"""Optional audit integration, including concurrent processes and snapshot coverage."""
from concurrent.futures import ThreadPoolExecutor
import importlib.util
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('fixture_audit', ROOT / 'tools/context_audit.py')
audit = importlib.util.module_from_spec(spec)
spec.loader.exec_module(audit)


class AuditTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'tools').mkdir()
        for name in ('context.py', 'context_audit.py'):
            shutil.copy2(ROOT / 'tools' / name, self.root / 'tools' / name)
        (self.root / 'knowledge').mkdir()
        (self.root / 'knowledge/context.json').write_text(json.dumps({'root': 'ROOT', 'foundation': ['ROOT']}))
        self.node('ROOT', None, 'Shared context.')
        self.node('TOPIC', 'ROOT', 'Private topic words.')
        self.node('DETAIL', 'TOPIC', 'Private detailed words.')
        self.addCleanup(lambda: shutil.rmtree(audit.storage(self.root), ignore_errors=True))

    def node(self, id, parent, body):
        (self.root / 'knowledge' / (id.lower() + '.md')).write_text(
            f'---\nid: {id}\nparent: {parent or "null"}\n---\n\n# {id}\n\n{body}\n')

    def cli(self, *args, reader='main', script='context.py', success=True):
        result = subprocess.run([sys.executable, str(self.root / 'tools' / script), *args],
                                cwd=self.root, text=True, capture_output=True,
                                env=dict(os.environ, CONTEXT_AUDIT_READER=reader))
        if success:
            self.assertEqual(result.returncode, 0, result.stderr)
        return result

    def test_inactive_no_state_and_optional_module(self):
        self.cli('read', 'TOPIC')
        self.assertIsNone(audit.active(self.root))
        path = Path(tempfile.gettempdir()) / f'context-audit-{os.getuid()}' / audit.fingerprint(str(self.root.resolve()))
        self.assertFalse(path.exists())
        (self.root / 'tools/context_audit.py').unlink()
        self.cli('read', 'TOPIC')

    def test_stdout_unchanged_metadata_only_and_budget(self):
        commands = [('read', 'TOPIC'), ('inspect', 'TOPIC'), ('index', '--json'),
                    ('tree',), ('search', 'Private')]
        before = [self.cli(*cmd).stdout for cmd in commands]
        audit.start(self.root, 'targeted', ['TOPIC'], 1)
        after = [self.cli(*cmd).stdout for cmd in commands]
        self.assertEqual(before, after)
        report = audit.report(self.root, details=True)
        self.assertEqual(report['commands'], len(commands))
        self.assertEqual(report['chars'], sum(map(len, after)))
        self.assertTrue(report['over_budget'])
        log = (Path(report['storage']) / 'events.jsonl').read_text()
        self.assertNotIn('Private', log)
        self.assertNotIn('Shared context.', log)
        self.assertEqual(report['review_signals']['broad_discovery'], 2)
        self.assertEqual(report['events'][-1]['options'], {'term_count': 1})

    def test_concurrent_writes_and_repeats_per_reader(self):
        audit.start(self.root, 'targeted')
        with ThreadPoolExecutor(max_workers=6) as pool:
            results = list(pool.map(lambda index: self.cli('read', 'TOPIC', '--only',
                                reader='one' if index % 2 else 'two'), range(12)))
        report = audit.report(self.root, details=True)
        self.assertEqual(len(results), 12)
        self.assertEqual(report['commands'], 12)
        self.assertEqual(report['review_signals']['repeated_emissions'], 10)
        self.assertEqual(report['readers']['one']['repeated_emissions'], 5)
        self.assertEqual(report['readers']['two']['repeated_emissions'], 5)
        self.node('TOPIC', 'ROOT', 'Changed content.')
        self.cli('read', 'TOPIC', '--only', reader='one')
        self.assertEqual(audit.report(self.root)['review_signals']['repeated_emissions'], 10)

    def test_snapshot_batch_completeness_and_all_detection(self):
        audit.start(self.root, 'targeted', ['TOPIC'])
        self.cli('read', '--all', '--batch', '1', '--batch-words', '1')
        initial = audit.report(self.root)['all_reads'][0]
        self.assertFalse(initial['complete'])
        self.assertEqual(initial['missing'], 2)
        # Other readers cannot complete this reader's selection.
        self.cli('read', '--all', '--batch', '2', '--batch-words', '1', reader='helper')
        self.cli('read', '--all', '--batch', '3', '--batch-words', '1')
        self.assertFalse(audit.report(self.root)['all_reads'][0]['complete'])
        self.cli('read', '--all', '--batch', '2', '--batch-words', '1')
        self.assertTrue(audit.report(self.root)['all_reads'][0]['complete'])
        # Editing content establishes a different snapshot, not a fresh batch of the old one.
        self.node('TOPIC', 'ROOT', 'Changed topic.')
        self.cli('read', '--all', '--batch', '1', '--batch-words', '1')
        report = audit.report(self.root)
        self.assertEqual(len(report['all_reads']), 3)
        self.assertFalse(report['all_reads'][-1]['complete'])
        self.assertEqual(report['review_signals']['read_all_during_targeted'], 5)
        # An unbatched emission can complete only its own snapshot.
        self.cli('read', '--all')
        self.assertTrue(audit.report(self.root)['all_reads'][-1]['complete'])

    def test_different_partitions_do_not_mix_batch_numbers(self):
        audit.start(self.root, 'all')
        self.cli('read', '--all', '--batch', '1', '--batch-words', '1')
        self.cli('read', '--all', '--batch', '1', '--batch-words', '1000')
        report = audit.report(self.root, details=True)
        self.assertEqual(len(report['all_reads']), 1)
        self.assertTrue(report['all_reads'][0]['complete'])
        self.assertEqual(report['review_signals']['read_all_during_targeted'], 0)

    def test_skill_inventory_view_and_changed_references(self):
        skill = self.root / 'sample-skill'
        references = skill / 'references'
        references.mkdir(parents=True)
        (skill / 'SKILL.md').write_text('Main skill body.')
        first = references / 'first.md'
        first.write_text('Reference body cafÃ©.\n')
        second = references / 'second.md'
        second.write_text('Another private body.')
        started = self.cli('start', '--intent', 'targeted', '--skill', str(skill), script='context_audit.py')
        self.assertEqual(json.loads(started.stdout)['reference_count'], 2)
        self.assertTrue(Path(json.loads(started.stdout)['storage']).is_dir())
        output = self.cli('--reader', 'helper', 'view', str(first), script='context_audit.py')
        self.assertEqual(output.stdout, first.read_text())
        report = audit.report(self.root, details=True)
        self.assertEqual(report['chars'], len(output.stdout))
        self.assertFalse(report['skill_references']['helper']['all_references_emitted'])
        self.cli('--reader', 'helper', 'view', str(second), script='context_audit.py')
        self.assertTrue(audit.report(self.root)['skill_references']['helper']['all_references_emitted'])
        self.assertNotIn('private body', json.dumps(audit.report(self.root, details=True)))
        # A main-skill read is counted as volume but not as an optional reference.
        self.cli('view', str(skill / 'SKILL.md'), script='context_audit.py')
        self.assertEqual(audit.report(self.root)['skill_references']['helper']['emitted'], 2)

    def test_session_and_project_isolation(self):
        first = audit.start(self.root, 'all')['run']
        with self.assertRaisesRegex(ValueError, 'active'):
            audit.start(self.root, 'targeted')
        self.cli('read', 'TOPIC', '--only')
        audit.stop(self.root)
        self.cli('read', 'TOPIC', '--only')
        self.assertEqual(audit.report(self.root, first)['commands'], 1)
        second = audit.start(self.root, 'targeted')['run']
        self.assertNotEqual(first, second)
        self.assertEqual(audit.report(self.root)['commands'], 0)
        # Simulate an in-flight command finishing after stop/start.
        audit.append(self.root, first, {'command': 'view', 'reader': 'main', 'chars': 0,
                                       'options': {'path': '/reference'}, 'items': []})
        self.assertEqual(audit.report(self.root, first)['commands'], 2)
        self.assertEqual(audit.report(self.root, second)['commands'], 0)
        other = self.root / 'other-project'
        other.mkdir()
        self.addCleanup(lambda: shutil.rmtree(audit.storage(other), ignore_errors=True))
        audit.start(other, 'all')
        self.assertEqual(audit.report(other)['commands'], 0)
        self.assertIsNone(audit.active(self.root / 'unrelated'))

    def test_review_expansion_and_cli_reports(self):
        self.cli('start', '--intent', 'targeted', '--targets', 'TOPIC', script='context_audit.py')
        self.cli('read', 'TOPIC', '--children')
        self.cli('read', 'DETAIL', '--only')
        result = self.cli('report', script='context_audit.py').stdout
        self.assertEqual(len(result.splitlines()), 1)
        report = json.loads(result)
        self.assertEqual(report['signals']['C'], 1)
        self.assertEqual(report['signals']['T'], 1)
        self.assertLessEqual(len(result), 500)
        self.assertNotIn('events', report)
        self.cli('stop', script='context_audit.py')
        self.assertFalse(json.loads(self.cli('report', script='context_audit.py').stdout)['active'])


    def test_individual_body_reads_cover_inventory_not_content_snapshot(self):
        audit.start(self.root, 'targeted', ['TOPIC'])
        self.cli('read', 'ROOT', '--only')
        self.cli('read', 'TOPIC', '--only')
        # Changed content does not change the inventory, but is no coherent full read.
        self.node('ROOT', None, 'Revised shared context.')
        self.cli('read', 'DETAIL', '--only')
        result = audit.report(self.root, details=True)
        self.assertEqual(result['body_coverage'][0]['emitted'], 3)
        self.assertEqual(result['body_coverage'][0]['total'], 3)
        self.assertTrue(result['body_coverage'][0]['all_ids_observed'])
        self.assertEqual(result['review_signals']['complete_body_coverage_during_targeted'], 1)
        self.assertEqual(result['review_signals']['read_all_during_targeted'], 0)
        self.assertEqual(result['all_reads'], [])
        self.assertIn('Not a coherent', result['body_coverage_scope'])
        # A new ID creates a separate inventory and cannot reuse old coverage.
        self.node('NEW', 'ROOT', 'New subject.')
        self.cli('read', 'NEW', '--only')
        groups = audit.report(self.root)['body_coverage']
        self.assertEqual(len(groups), 2)
        self.assertEqual((groups[1]['emitted'], groups[1]['total']), (1, 4))
        self.cli('read', 'TOPIC', '--only', reader='helper')
        self.assertEqual(audit.report(self.root)['body_coverage'][-1]['emitted'], 1)

    def test_compact_summary_bounded_with_many_snapshots_and_readers(self):
        audit.start(self.root, 'targeted')
        self.cli('read', '--all', '--batch', '1', '--batch-words', '1')
        result = audit.report(self.root, details=True)
        event = result['events'][0]
        for index in range(80):
            audit.append(self.root, result['run'], dict(event, reader=f'reader-{index}', snapshot=f'snapshot-{index}'))
        output = self.cli('report', script='context_audit.py').stdout
        self.assertLessEqual(len(output), 500)
        self.assertEqual(len(output.splitlines()), 1)
        summary = json.loads(output)
        self.assertEqual(summary['readers'], 81)
        self.assertEqual(summary['signals']['I'], 81)
        self.assertNotIn('events', summary)
        details = json.loads(self.cli('report', '--details', script='context_audit.py').stdout)
        self.assertEqual(len(details['all_reads']), 81)



    def test_foundation_and_target_ancestors_are_expected_context(self):
        self.node('AIM', 'ROOT', 'Shared purpose.')
        self.node('SIDE', 'ROOT', 'Optional other subject.')
        (self.root / 'knowledge/context.json').write_text(json.dumps(
            {'root': 'ROOT', 'foundation': ['ROOT', 'AIM']}))
        audit.start(self.root, 'targeted', ['DETAIL'])
        self.cli('read', 'ROOT', 'AIM')
        self.cli('read', 'TOPIC', '--only')
        self.cli('read', 'DETAIL', '--only')
        self.assertEqual(audit.report(self.root)['review_signals']['outside_declared_targets'], 0)
        self.cli('read', 'SIDE', '--only')
        self.assertEqual(audit.report(self.root)['review_signals']['outside_declared_targets'], 1)



    def test_non_posix_reader_skips_optional_audit_import(self):
        # Simulate the platform after importing pathlib-backed project setup.
        (self.root / 'tools/context_audit.py').write_text('raise RuntimeError("must not import")')
        result = subprocess.run([sys.executable, '-c',
            'import context; context.os.name="nt"; context._main=lambda: print("normal reader"); context.main()'],
            cwd=self.root / 'tools', text=True, capture_output=True)
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(result.stdout, 'normal reader\n')


if __name__ == '__main__':
    unittest.main()
