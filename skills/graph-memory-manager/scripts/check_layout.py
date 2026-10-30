#!/usr/bin/env python3
"""Check parent-folder placement from tools/context.py index --json on stdin."""
from __future__ import annotations

import argparse
import json
from pathlib import PurePosixPath
import sys


def check_layout(rows, knowledge_dir='knowledge'):
    if not isinstance(rows, list) or not rows:
        raise ValueError('expected a nonempty node index array')
    nodes = {}
    locations = set()
    for row in rows:
        if not isinstance(row, dict) or not {'id', 'parent', 'path'} <= row.keys():
            raise ValueError('each index entry needs id, parent, and path')
        node_id, parent, path = row['id'], row['parent'], row['path']
        if not isinstance(node_id, str) or not isinstance(path, str) or not (parent is None or isinstance(parent, str)):
            raise ValueError('invalid id, parent, or path value')
        if node_id in nodes:
            raise ValueError(f'duplicate node ID: {node_id}')
        nodes[node_id] = row
        locations.add(path)
    roots = [row for row in rows if row['parent'] is None]
    if len(roots) != 1:
        raise ValueError('expected one root; validate the memory tree first')

    errors = []
    for node_id, row in nodes.items():
        actual = PurePosixPath(row['path'])
        if row['parent'] is None:
            expected = PurePosixPath(knowledge_dir) / f'{node_id.lower()}.md'
        else:
            parent = nodes.get(row['parent'])
            if parent is None:
                raise ValueError(f'unknown parent for {node_id}: {row["parent"]}')
            expected = PurePosixPath(parent['path']).parent / parent['id'].lower() / f'{node_id.lower()}.md'
        if actual != expected:
            errors.append(f'{node_id}: {actual} -> expected {expected}')
    if len(locations) != len(rows):
        errors.append('multiple node IDs share a file; extract inline nodes into their own files')
    return errors


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--knowledge-dir', default='knowledge', help='index-relative directory containing the root file')
    args = parser.parse_args()
    try:
        rows = json.load(sys.stdin)
        errors = check_layout(rows, args.knowledge_dir)
    except (ValueError, OSError) as exc:
        print(f'Layout check: {exc}', file=sys.stderr)
        return 2
    if errors:
        print('\n'.join(errors), file=sys.stderr)
        return 1
    print(f'Layout valid for {len(rows)} nodes.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
