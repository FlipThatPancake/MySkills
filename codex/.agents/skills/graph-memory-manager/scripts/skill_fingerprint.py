#!/usr/bin/env python3
"""Print a location-independent identity for installed skill guidance and helpers."""
from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys


def fingerprint(skill_dir):
    root = Path(skill_dir).resolve()
    if not (root / 'SKILL.md').is_file():
        raise ValueError('expected a skill directory containing SKILL.md')
    paths = [root / 'SKILL.md']
    for folder in ('references', 'scripts', 'agents'):
        base = root / folder
        if base.is_symlink():
            raise ValueError(f'symlinked skill directory: {folder}')
        if base.exists():
            paths.extend(base.rglob('*'))
    files = []
    for path in sorted(paths, key=lambda p: p.relative_to(root).as_posix()):
        relative = path.relative_to(root)
        if any(part.startswith('.') or part == '__pycache__' for part in relative.parts):
            continue
        if path.suffix in ('.pyc', '.pyo'):
            continue
        if path.is_symlink():
            raise ValueError(f'symlinked skill file: {relative.as_posix()}')
        if path.is_dir():
            continue
        files.append({'path': relative.as_posix(),
                      'sha256': hashlib.sha256(path.read_bytes()).hexdigest()})
    manifest = json.dumps(files, ensure_ascii=True, sort_keys=True,
                          separators=(',', ':')).encode('utf-8')
    return {'fingerprint_version': 1,
            'fingerprint': 'sha256:' + hashlib.sha256(manifest).hexdigest(),
            'files': files}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--skill-dir', type=Path,
                        default=Path(__file__).resolve().parents[1])
    args = parser.parse_args()
    try:
        result = fingerprint(args.skill_dir)
    except (ValueError, OSError) as exc:
        print(f'Skill fingerprint: {exc}', file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=True, indent=2))
    return 0


if __name__ == '__main__':
    sys.exit(main())
