"""Exercise retrieval against isolated knowledge, independent of project topics."""
import importlib.util
import json
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import unittest

ROOT = Path(__file__).resolve().parents[1]


class ContextTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'tools').mkdir()
        shutil.copy2(ROOT / 'tools/context.py', self.root / 'tools/context.py')
        (self.root / 'knowledge').mkdir()
        self.config = {'root': 'ROOT', 'foundation': ['ROOT', 'AIM']}
        self.write_config()
        self.node('ROOT', None, 'Shared project context.')
        self.node('AIM', 'ROOT', 'Shared purpose.')
        self.node('TOPIC', 'ROOT', '''Overview.

Optional â [SIDE](side.md).

<a id="STATES"></a>
## STATES Â· States

Shared state behavior.

<a id="EMPTY"></a>
### EMPTY Â· Empty

Specific empty behavior.''')
        self.node('DETAIL', 'TOPIC', 'Detailed behavior. [SIDE](side.md).')
        self.node('SIDE', 'ROOT', 'Related subject.')
        spec = importlib.util.spec_from_file_location('fixture_context', self.root / 'tools/context.py')
        self.context = importlib.util.module_from_spec(spec)
        sys.modules[spec.name] = self.context
        spec.loader.exec_module(self.context)
        self.nodes = self.context.load_nodes(self.root)

    def write_config(self):
        (self.root / 'knowledge/context.json').write_text(json.dumps(self.config))

    def node(self, id, parent, body):
        path = self.root / 'knowledge' / (id.lower() + '.md')
        path.write_text(f'---\nid: {id}\nparent: {parent or "null"}\n---\n\n# {id.title()}\n\n{body}\n')
        return path

    def select(self, ids, **kwargs):
        return self.context.selected(self.nodes, ids, **kwargs)

    def cli(self, *args):
        return subprocess.run([sys.executable, str(self.root / 'tools/context.py'), *args],
                              text=True, capture_output=True)

    def emitted(self, output):
        return [line[2:].split(' â ')[0] for line in output.splitlines() if line.startswith('# ')]

    def test_configurable_foundation_and_deduplicated_ancestry(self):
        self.assertEqual(self.select(['DETAIL', 'EMPTY']),
                         ['ROOT', 'AIM', 'TOPIC', 'DETAIL', 'STATES', 'EMPTY'])

    def test_references_do_not_expand_reads(self):
        self.assertEqual(self.context.refs(self.nodes, self.nodes['DETAIL']), ['SIDE'])
        self.assertNotIn('SIDE', self.select(['DETAIL']))
        self.assertNotIn('STATES', self.select(['DETAIL']))

    def test_explicit_children_include_only_one_level(self):
        self.assertEqual(self.select(['TOPIC'], include_children=True),
                         ['ROOT', 'AIM', 'TOPIC', 'DETAIL', 'STATES'])

    def test_only_omits_context_but_can_include_children(self):
        self.assertEqual(self.select(['TOPIC'], foundation=False), ['TOPIC'])
        self.assertEqual(self.select(['TOPIC'], foundation=False, include_children=True),
                         ['TOPIC', 'DETAIL', 'STATES'])
        result = self.cli('read', 'TOPIC', '--only', '--children')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertEqual(self.emitted(result.stdout), ['TOPIC', 'DETAIL', 'STATES'])

    def test_inline_bodies_exclude_descendants(self):
        self.assertNotIn('Shared state behavior', self.nodes['TOPIC'].body)
        self.assertNotIn('Specific empty behavior', self.nodes['STATES'].body)
        self.assertIn('Specific empty behavior', self.nodes['EMPTY'].body)

    def test_separate_shard_can_extend_inline_node(self):
        self.node('DEEP', 'EMPTY', 'Deeper detail.')
        nodes = self.context.load_nodes(self.root)
        self.assertEqual(self.context.ancestors(nodes, 'DEEP'),
                         ['ROOT', 'TOPIC', 'STATES', 'EMPTY', 'DEEP'])
        self.context.validate(self.root, nodes)

    def test_graph_validation_accepts_configured_root(self):
        self.assertIn('ancestry and local links', self.context.validate(self.root, self.nodes))
        self.config['root'] = 'AIM'
        self.write_config()
        with self.assertRaisesRegex(ValueError, 'sole root'):
            self.context.validate(self.root, self.nodes)

    def test_cycles_and_missing_parents_are_rejected(self):
        self.nodes['ROOT'].parent = 'DETAIL'
        with self.assertRaisesRegex(ValueError, 'cycle'):
            self.context.validate(self.root, self.nodes)
        self.node('ROOT', 'DETAIL', 'Cycle.')
        result = self.cli('tree')
        self.assertNotEqual(result.returncode, 0)
        self.assertIn('cycle', result.stderr)
        self.node('ROOT', None, 'Shared project context.')
        self.nodes['ROOT'].parent = None
        self.nodes['DETAIL'].parent = 'MISSING'
        with self.assertRaisesRegex(ValueError, 'Unknown'):
            self.context.validate(self.root, self.nodes)

    def test_malformed_identity_and_missing_anchor_are_rejected(self):
        path = self.root / 'knowledge/topic.md'
        original = path.read_text()
        path.write_text(original.replace('<a id="STATES"></a>\n', ''))
        with self.assertRaisesRegex(ValueError, 'anchor'):
            self.context.load_nodes(self.root)
        path.write_text(original)
        self.node('OTHER', 'ROOT', 'Wrong filename.').rename(self.root / 'knowledge/wrong.md')
        with self.assertRaisesRegex(ValueError, 'filename'):
            self.context.load_nodes(self.root)

    def test_duplicate_ids_are_rejected(self):
        (self.root / 'knowledge/other').mkdir()
        shutil.copy2(self.root / 'knowledge/root.md', self.root / 'knowledge/other/root.md')
        with self.assertRaisesRegex(ValueError, 'Duplicate'):
            self.context.load_nodes(self.root)

    def test_broken_file_and_node_links_are_rejected(self):
        self.node('DETAIL', 'TOPIC', '[Missing](missing.md).')
        with self.assertRaisesRegex(ValueError, 'Broken file'):
            self.context.validate(self.root, self.context.load_nodes(self.root))
        self.node('DETAIL', 'TOPIC', '[Missing](topic.md#MISSING).')
        with self.assertRaisesRegex(ValueError, 'Broken node'):
            self.context.validate(self.root, self.context.load_nodes(self.root))

    def test_invalid_configuration_is_rejected(self):
        for config in ({'root': 'ROOT', 'foundation': []},
                       {'root': 'ROOT', 'foundation': ['ROOT', 'ROOT']},
                       {'root': 'bad', 'foundation': ['ROOT']},
                       {'root': 'ROOT', 'foundation': ['MISSING']}):
            with self.subTest(config=config):
                self.config = config
                self.write_config()
                with self.assertRaises(ValueError):
                    self.context.validate(self.root, self.nodes)

    def test_complete_read_has_no_hard_word_cap(self):
        self.node('DETAIL', 'TOPIC', 'evidence ' * 5000)
        result = self.cli('read', '--all')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertGreater(len(result.stdout.split()), 5000)
        self.assertCountEqual(self.emitted(result.stdout), self.nodes)
        self.assertIn('[READ COMPLETE', result.stdout)

    def test_batches_cover_selection_once_with_one_snapshot(self):
        first = self.cli('read', '--all', '--batch', '1', '--batch-words', '25')
        self.assertEqual(first.returncode, 0, first.stderr)
        count = int(re.search(r'BATCH 1/(\d+)', first.stdout)[1])
        self.assertGreater(count, 1)
        outputs = [first] + [self.cli('read', '--all', '--batch', str(i), '--batch-words', '25')
                             for i in range(2, count + 1)]
        emitted, snapshots = [], set()
        for result in outputs:
            self.assertEqual(result.returncode, 0, result.stderr)
            self.assertIn('[READ COMPLETE', result.stdout)
            self.assertIn('requires every batch', result.stdout)
            emitted.extend(self.emitted(result.stdout))
            snapshots.add(re.search(r'snapshot ([a-f0-9]+)', result.stdout)[1])
        self.assertEqual(len(snapshots), 1)
        self.assertCountEqual(emitted, self.nodes)

    def test_snapshot_changes_with_selected_content(self):
        before = self.cli('read', '--all').stdout
        self.node('DETAIL', 'TOPIC', 'Changed content.')
        after = self.cli('read', '--all').stdout
        self.assertNotEqual(re.search(r'snapshot ([a-f0-9]+)', before)[1],
                            re.search(r'snapshot ([a-f0-9]+)', after)[1])

    def test_oversized_node_is_preserved_whole(self):
        blocks = ['first', 'word ' * 500, 'last']
        self.assertEqual(self.context.read_batches(['A', 'B', 'C'], blocks, 100),
                         [[('A', 'first')], [('B', blocks[1])], [('C', 'last')]])

    def test_invalid_read_requests_fail_without_completion_receipt(self):
        for args in [('read',), ('read', '--all', 'ROOT'), ('read', '--all', '--only'),
                     ('read', '--all', '--children'), ('read', '--all', '--batch', '9999'),
                     ('read', '--all', '--batch', '0'), ('read', 'MISSING')]:
            with self.subTest(args=args):
                result = self.cli(*args)
                self.assertNotEqual(result.returncode, 0)
                self.assertTrue(result.stderr)
                self.assertNotIn('[READ COMPLETE', result.stdout)

    def test_discovery_has_no_body_expansion_and_tree_has_full_depth(self):
        tree = self.cli('tree')
        self.assertEqual(tree.returncode, 0, tree.stderr)
        self.assertIn('EMPTY â Empty', tree.stdout)
        inspected = self.cli('inspect', 'TOPIC')
        self.assertEqual(inspected.returncode, 0, inspected.stderr)
        self.assertIn('Context path: ROOT > TOPIC', inspected.stdout)
        self.assertIn('References: SIDE', inspected.stdout)
        self.assertNotIn('Shared state behavior', inspected.stdout)
        searched = self.cli('search', 'specific', 'empty')
        self.assertEqual(searched.returncode, 0, searched.stderr)
        self.assertIn('EMPTY â Empty', searched.stdout)
        indexed = self.cli('index', '--json')
        self.assertEqual(indexed.returncode, 0, indexed.stderr)
        self.assertEqual({n['id'] for n in json.loads(indexed.stdout)}, set(self.nodes))

    def test_tree_depth_is_not_limited_by_python_recursion(self):
        parent = 'ROOT'
        for i in range(1050):
            id = f'DEEP-{i}'
            self.node(id, parent, 'Deep subject.')
            parent = id
        result = self.cli('tree')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertIn('DEEP-1049 â Deep-1049', result.stdout)


if __name__ == '__main__':
    unittest.main()
