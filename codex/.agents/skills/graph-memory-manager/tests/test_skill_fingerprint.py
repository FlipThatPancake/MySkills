"""Check installed-package identity without depending on a project's graph."""
import importlib.util
from pathlib import Path
import shutil
import tempfile
import unittest


SCRIPT = Path(__file__).resolve().parents[1] / 'scripts/skill_fingerprint.py'
spec = importlib.util.spec_from_file_location('skill_fingerprint', SCRIPT)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class FingerprintTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name) / 'skill'
        self.root.mkdir()
        (self.root / 'SKILL.md').write_text('Example skill\n', encoding='utf-8')
        for folder in ('references', 'scripts', 'agents'):
            (self.root / folder).mkdir()
        (self.root / 'references/format.md').write_text('Format\n', encoding='utf-8')

    def identity(self):
        return module.fingerprint(self.root)['fingerprint']

    def test_location_independent_and_read_only(self):
        before = {p.relative_to(self.root): p.read_bytes()
                  for p in self.root.rglob('*') if p.is_file()}
        expected = module.fingerprint(self.root)
        other = Path(self.temp.name) / 'different-location'
        shutil.copytree(self.root, other)
        self.assertEqual(expected, module.fingerprint(other))
        self.assertEqual(before, {p.relative_to(self.root): p.read_bytes()
                                 for p in self.root.rglob('*') if p.is_file()})

    def test_guidance_edits_change_identity(self):
        previous = self.identity()
        (self.root / 'references/format.md').write_text('Revised\n', encoding='utf-8')
        self.assertNotEqual(previous, self.identity())

    def test_helper_and_agent_metadata_changes_are_tracked(self):
        for relative in ('scripts/helper.py', 'agents/openai.yaml'):
            previous = self.identity()
            (self.root / relative).write_text('New content\n', encoding='utf-8')
            self.assertNotEqual(previous, self.identity())

    def test_rename_and_removal_change_identity(self):
        previous = self.identity()
        source = self.root / 'references/format.md'
        renamed = source.with_name('new-format.md')
        source.rename(renamed)
        self.assertNotEqual(previous, self.identity())
        previous = self.identity()
        renamed.unlink()
        self.assertNotEqual(previous, self.identity())

    def test_generated_files_do_not_change_identity(self):
        previous = self.identity()
        for relative in ('scripts/__pycache__/helper.cpython-314.pyc',
                         'scripts/helper.pyc', 'references/.DS_Store',
                         'reports/session.md'):
            path = self.root / relative
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(b'generated')
        self.assertEqual(previous, self.identity())

    def test_missing_or_directory_entrypoint_is_rejected(self):
        entry = self.root / 'SKILL.md'
        entry.unlink()
        with self.assertRaises(ValueError):
            self.identity()
        entry.mkdir()
        with self.assertRaises(ValueError):
            self.identity()

    def test_symlinked_content_or_folder_is_rejected(self):
        link = self.root / 'scripts/linked.py'
        link.symlink_to(self.root / 'SKILL.md')
        with self.assertRaises(ValueError):
            self.identity()
        link.unlink()
        shutil.rmtree(self.root / 'agents')
        (self.root / 'agents').symlink_to(self.root / 'references', target_is_directory=True)
        with self.assertRaises(ValueError):
            self.identity()


if __name__ == '__main__':
    unittest.main()
