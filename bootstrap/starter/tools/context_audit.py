#!/usr/bin/env python3
"""Opt-in POSIX emission audit. Logs contain metadata, never reference or node bodies."""
from __future__ import annotations
import argparse
from contextlib import contextmanager, redirect_stdout
import hashlib
import json
import os
from pathlib import Path
import re
import sys
import tempfile
import time
import uuid

if os.name == 'posix':
    import fcntl

ROOT = Path(__file__).resolve().parents[1]
COVERAGE = 'Instrumented emissions only; direct reads are unobserved. Emission is not understanding. Chars are not model tokens. Delivery/truncation is unverified; signals require review.'


def fingerprint(text):
    return hashlib.sha256(text.encode('utf-8')).hexdigest()


def storage(root):
    base = Path(tempfile.gettempdir()) / f'context-audit-{os.getuid()}'
    base.mkdir(mode=0o700, exist_ok=True)
    path = base / fingerprint(str(Path(root).resolve()))
    path.mkdir(mode=0o700, exist_ok=True)
    return path


@contextmanager
def locked(root):
    if os.name != 'posix':
        raise OSError('audit requires POSIX (macOS/Linux); normal context retrieval remains available')
    path = storage(root)
    with (path / 'lock').open('a') as lock:
        fcntl.flock(lock, fcntl.LOCK_EX)
        yield path


def active_at(path):
    active = path / 'active.json'
    return json.loads(active.read_text())['run'] if active.exists() else None


def active(root):
    # Inactive retrieval has no filesystem writes, including directory creation.
    path = Path(tempfile.gettempdir()) / f'context-audit-{os.getuid()}' / fingerprint(str(Path(root).resolve()))
    if not (path / 'active.json').exists():
        return None
    with locked(root) as path:
        return active_at(path)


def reader_label(value):
    if not re.fullmatch(r'[A-Za-z0-9_.-]{1,64}', value):
        raise ValueError('reader must be 1â64 letters, digits, dots, underscores or hyphens')
    return value


def start(root, intent, targets=(), budget_chars=None, skill=None):
    if intent not in ('targeted', 'all'):
        raise ValueError('intent must be targeted or all')
    if any(not re.fullmatch(r'[A-Z][A-Z0-9-]*', target) for target in targets):
        raise ValueError('targets must be node IDs')
    if budget_chars is not None and budget_chars < 1:
        raise ValueError('budget-chars must be positive')
    references = []
    if skill is not None:
        skill = Path(skill).resolve()
        if not skill.is_dir():
            raise ValueError('--skill must be a directory')
        references = sorted({str(p.resolve()) for p in (skill / 'references').rglob('*') if p.is_file()})
    with locked(root) as path:
        if active_at(path):
            raise ValueError('an audit is active; stop it before starting another')
        run = uuid.uuid4().hex
        folder = path / run
        folder.mkdir(mode=0o700)
        meta = dict(run=run, intent=intent, targets=list(dict.fromkeys(targets)),
                    budget_chars=budget_chars, started=time.time(), skill=str(skill) if skill else None,
                    references=references)
        (folder / 'meta.json').write_text(json.dumps(meta))
        (folder / 'events.jsonl').touch(mode=0o600)
        (path / 'active.json').write_text(json.dumps({'run': run}))
        return meta


def stop(root):
    with locked(root) as path:
        run = active_at(path)
        if not run:
            raise ValueError('no active audit')
        meta_path = path / run / 'meta.json'
        meta = json.loads(meta_path.read_text())
        meta['stopped'] = time.time()
        meta_path.write_text(json.dumps(meta))
        (path / 'latest.json').write_text(json.dumps({'run': run}))
        (path / 'active.json').unlink()
        return run


def append(root, run, event):
    with locked(root) as path:
        # Bind to the run captured before emission, even if another run starts.
        with (path / run / 'events.jsonl').open('a') as output:
            output.write(json.dumps(dict(event, run=run, time=time.time()), separators=(',', ':')) + '\n')


class Meter:
    def __init__(self, stream):
        self.stream, self.chars = stream, 0

    def write(self, text):
        result = self.stream.write(text)
        self.chars += len(text) if result is None else result
        return result

    def flush(self):
        return self.stream.flush()

    def __getattr__(self, name):
        return getattr(self.stream, name)


def run_instrumented(root, callback, reader=None):
    """Forward stdout unchanged; log successful commands into their original run."""
    try:
        run = active(root)
        identity = reader_label(reader or os.environ.get('CONTEXT_AUDIT_READER', 'main')) if run else None
    except (OSError, ValueError) as exc:
        print(f'context audit unavailable: {exc}', file=sys.stderr)
        return callback()
    if not run:
        return callback()
    meter = Meter(sys.stdout)
    with redirect_stdout(meter):
        event = callback()
    if event is not None:
        try:
            append(root, run, dict(event, reader=identity, chars=meter.chars))
        except (OSError, ValueError) as exc:
            print(f'context audit could not record emission: {exc}', file=sys.stderr)
    return event


def report(root, run=None, details=False):
    with locked(root) as path:
        current = active_at(path)
        if run is None:
            latest = path / 'latest.json'
            run = current or (json.loads(latest.read_text())['run'] if latest.exists() else None)
        if not run or not re.fullmatch(r'[0-9a-f]{32}', run):
            raise ValueError('no audit found; start one or supply a valid --run ID')
        folder = path / run
        meta = json.loads((folder / 'meta.json').read_text())
        events = [json.loads(line) for line in (folder / 'events.jsonl').read_text().splitlines()]
    readers, seen, all_reads = {}, {}, {}
    reference_reads, body_reads = {}, {}
    signals = dict(repeated_emissions=0, read_all_during_targeted=0, children_expansions=0,
                   broad_discovery=0, outside_declared_targets=0, complete_body_coverage_during_targeted=0)
    for event in events:
        who = event['reader']
        stats = readers.setdefault(who, dict(commands=0, chars=0, repeated_emissions=0))
        stats['commands'] += 1
        stats['chars'] += event['chars']
        options = event.get('options', {})
        command = event['command']
        for item in event.get('items', []):
            key = (who, command, item['id'], item['fingerprint'])
            if key in seen:
                signals['repeated_emissions'] += 1
                stats['repeated_emissions'] += 1
            seen[key] = True
        if command == 'view' and event['options']['path'] in meta['references']:
            reference_reads.setdefault(who, set()).add(event['options']['path'])
        if command == 'read':
            if 'knowledge_inventory' in event:
                key = (who, event['knowledge_inventory'])
                observed = body_reads.setdefault(key, {'reader': who, 'inventory': event['knowledge_inventory'],
                    'total': event['knowledge_node_count'], 'ids': set()})
                observed['ids'].update(item['id'] for item in event['items'])
            signals['read_all_during_targeted'] += int(meta['intent'] == 'targeted' and options['all'])
            signals['children_expansions'] += int(options['children'])
            allowed = set(meta['targets']) | set(event.get('foundation_ids', []))
            parents = event.get('knowledge_parents', {})
            for target in meta['targets']:
                visited = set()
                while target is not None and target not in visited:
                    visited.add(target)
                    allowed.add(target)
                    target = parents.get(target)
            signals['outside_declared_targets'] += int(bool(meta['targets']) and any(
                target not in allowed for target in options['ids']))
            if options['all']:
                key = (who, event['snapshot'])
                group = all_reads.setdefault(key, {'reader': who, 'snapshot': event['snapshot'],
                    'selected': set(event['selected_ids']), 'emitted': set(), 'batches': set()})
                group['emitted'].update(item['id'] for item in event['items'])
                group['batches'].add((options['batch_words'], event['batch'], event['batch_count']))
        if command == 'index' or (command == 'tree' and options.get('depth') is None):
            signals['broad_discovery'] += 1
    completeness = []
    for group in all_reads.values():
        missing = sorted(group['selected'] - group['emitted'])
        item = dict(reader=group['reader'], snapshot=group['snapshot'], complete=not missing,
                    emitted=len(group['emitted']), selected=len(group['selected']), missing=len(missing))
        if details:
            item.update(missing_ids=missing, batches=sorted(group['batches']))
        completeness.append(item)
    body_coverage = [dict(reader=group['reader'], inventory=group['inventory'],
        emitted=len(group['ids']), total=group['total'], all_ids_observed=len(group['ids']) == group['total'])
        for group in body_reads.values()]
    signals['complete_body_coverage_during_targeted'] = sum(group['all_ids_observed'] for group in body_coverage) if meta['intent'] == 'targeted' else 0
    chars = sum(event['chars'] for event in events)
    skill_reads = {who: {'emitted': len(paths), 'available': len(meta['references']),
                         'all_references_emitted': bool(meta['references']) and len(paths) == len(meta['references'])}
                   for who, paths in reference_reads.items()}
    if meta['skill'] and not skill_reads:
        skill_reads['main'] = {'emitted': 0, 'available': len(meta['references']), 'all_references_emitted': False}
    result = dict(run=run, active=run == current, intent=meta['intent'], targets=meta['targets'],
                  commands=len(events), chars=chars, budget_chars=meta['budget_chars'],
                  over_budget=meta['budget_chars'] is not None and chars > meta['budget_chars'],
                  review_signals=signals, readers=readers, all_reads=completeness, skill_references=skill_reads,
                  body_coverage=body_coverage, body_coverage_scope='Observed IDs within a stable inventory; bodies may span revisions. Not a coherent content-snapshot completeness proof.',
                  coverage=COVERAGE)
    if details:
        result.update(storage=str(folder), events=events)
    return result


# Compact CLI codes: R repeats, A targeted --all, C children, B broad discovery,
# T outside targets, K all body IDs observed in targeted intent, S all skill
# references emitted, I incomplete all-read snapshots, Q soft budget exceeded.
def compact_report(result):
    signals = result['review_signals']
    codes = dict(R=signals['repeated_emissions'], A=signals['read_all_during_targeted'],
        C=signals['children_expansions'], B=signals['broad_discovery'],
        T=signals['outside_declared_targets'], K=signals['complete_body_coverage_during_targeted'],
        S=sum(item['all_references_emitted'] for item in result['skill_references'].values()),
        I=sum(not item['complete'] for item in result['all_reads']), Q=int(result['over_budget']))
    return dict(run=result['run'], active=result['active'], intent=result['intent'],
        commands=result['commands'], chars=result['chars'], readers=len(result['readers']),
        inventories=len(result['body_coverage']),
        all_ids_observed=sum(item['all_ids_observed'] for item in result['body_coverage']),
        signals={code: count for code, count in codes.items() if count},
        scope='Emissions only; chars are not tokens; review signals. See --details.')


def view(root, path, reader=None):
    path = Path(path).resolve()
    def emit():
        body = path.read_text(encoding='utf-8')
        sys.stdout.write(body)
        return dict(command='view', options={'path': str(path)},
                    items=[dict(id=str(path), fingerprint=fingerprint(body))])
    return run_instrumented(root, emit, reader)


def main():
    if os.name != 'posix':
        raise OSError('audit requires POSIX (macOS/Linux); normal context retrieval remains available')
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--reader', default=None, help='identity for view; retrieval uses CONTEXT_AUDIT_READER')
    sub = parser.add_subparsers(dest='command', required=True)
    p = sub.add_parser('start')
    p.add_argument('--intent', choices=['targeted', 'all'], required=True)
    p.add_argument('--targets', nargs='+', default=[])
    p.add_argument('--budget-chars', type=int)
    p.add_argument('--skill', type=Path, help='inventory paths under references/ without reading bodies')
    p = sub.add_parser('report')
    p.add_argument('--run')
    p.add_argument('--details', action='store_true')
    sub.add_parser('stop')
    p = sub.add_parser('view')
    p.add_argument('path')
    args = parser.parse_args()
    if args.command == 'start':
        meta = start(ROOT, args.intent, args.targets, args.budget_chars, args.skill)
        result = {'run': meta['run'], 'intent': meta['intent'], 'reference_count': len(meta['references']),
                  'storage': str(storage(ROOT) / meta['run'])}
    elif args.command == 'stop':
        result = {'stopped': stop(ROOT)}
    elif args.command == 'report':
        result = report(ROOT, args.run, args.details)
        if not args.details:
            result = compact_report(result)
    else:
        view(ROOT, args.path, args.reader)
        return
    print(json.dumps(result, ensure_ascii=False, indent=2 if getattr(args, 'details', False) else None,
                     separators=None if getattr(args, 'details', False) else (',', ':')))


if __name__ == '__main__':
    try:
        main()
    except (ValueError, OSError) as exc:
        print(f'context audit: {exc}', file=sys.stderr)
        sys.exit(1)
