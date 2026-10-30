#!/usr/bin/env python3
"""Inspect a Markdown context tree; read explicit nodes without chasing links."""
from __future__ import annotations
import argparse
from dataclasses import dataclass
import hashlib
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import unquote, urlparse

ROOT = Path(__file__).resolve().parents[1]
HEADING = re.compile(r'^(#{2,6}) ([A-Z][A-Z0-9-]*) Â· (.+)$')
LINK = re.compile(r'\[[^\]\n]+\]\(([^)]+)\)')

def load_config(root=ROOT):
    path = root / 'knowledge/context.json'
    config = json.loads(path.read_text())
    if not isinstance(config, dict) or set(config) != {'root', 'foundation'}:
        raise ValueError(f'{path}: expected root and foundation keys')
    def valid_id(value):
        return isinstance(value, str) and re.fullmatch(r'[A-Z][A-Z0-9-]*', value)
    if not valid_id(config['root']):
        raise ValueError(f'{path}: invalid root ID')
    foundation = config['foundation']
    if not isinstance(foundation, list) or not foundation or not all(valid_id(id) for id in foundation):
        raise ValueError(f'{path}: foundation must be a nonempty list of node IDs')
    if len(foundation) != len(set(foundation)):
        raise ValueError(f'{path}: duplicate foundation IDs')
    return config

@dataclass
class Node:
    id: str
    parent: str | None
    title: str
    path: Path
    start: int
    end: int
    body: str
    anchor: str | None = None

def load_nodes(root=ROOT):
    nodes = {}
    for path in sorted((root/'knowledge').rglob('*.md')):
        lines = path.read_text().splitlines()
        if not lines or lines[0] != '---':
            raise ValueError(f'{path}: missing minimal frontmatter')
        try:
            stop = lines.index('---', 1)
        except ValueError as exc:
            raise ValueError(f'{path}: unclosed frontmatter') from exc
        meta = {}
        for line in lines[1:stop]:
            if not line.strip(): continue
            key, separator, value = line.partition(':')
            if not separator or key not in ('id', 'parent') or key in meta:
                raise ValueError(f'{path}: unexpected/duplicate metadata {line!r}')
            meta[key] = value.strip()
        if set(meta) != {'id','parent'}:
            raise ValueError(f'{path}: id and parent are required')
        rootid = meta['id']
        if not re.fullmatch(r'[A-Z][A-Z0-9-]*',rootid):
            raise ValueError(f'{path}: invalid id {rootid}')
        if path.stem != rootid.lower():
            raise ValueError(f'{path}: filename must match root ID {rootid.lower()}.md')
        parent = None if meta['parent']=='null' else meta['parent']
        h1 = next((i for i,l in enumerate(lines[stop+1:],stop+1) if l.startswith('# ')),None)
        if h1 is None: raise ValueError(f'{path}: missing title')
        records=[(rootid,parent,lines[h1][2:],h1,h1+1,None,1)]
        stack=[(1,rootid)]
        for i,line in enumerate(lines[h1+1:],h1+1):
            m=HEADING.match(line)
            if not m: continue
            hashes,id,title=m.groups();level=len(hashes)
            while stack[-1][0]>=level: stack.pop()
            if i<1 or lines[i-1] != f'<a id="{id}"></a>':
                raise ValueError(f'{path}:{i+1}: explicit anchor missing for {id}')
            records.append((id,stack[-1][1],title,i-1,i+1,id,level))
            stack.append((level,id))
        for j,(id,parent,title,start,body_start,anchor,level) in enumerate(records):
            end=records[j+1][3] if j+1<len(records) else len(lines)
            if id in nodes: raise ValueError(f'Duplicate node ID: {id}')
            nodes[id]=Node(id,parent,title,path,start+1,end,'\n'.join(lines[body_start:end]).strip(),anchor)
    return nodes

def ancestors(nodes,id):
    chain=[];seen=set()
    while id:
        if id in seen: raise ValueError(f'Parent cycle involving {id}')
        if id not in nodes: raise ValueError(f'Unknown node/parent: {id}')
        seen.add(id);chain.append(id);id=nodes[id].parent
    return list(reversed(chain))

def children(nodes,id):
    return [n.id for n in nodes.values() if n.parent==id]

def refs(nodes,node):
    by_location={(n.path.resolve(),n.anchor):n.id for n in nodes.values()}
    result=[]
    for target in LINK.findall(node.body):
        if urlparse(target).scheme: continue
        path,_,anchor=target.partition('#')
        location=((node.path.parent/unquote(path)).resolve(),anchor or None)
        id=by_location.get(location)
        if id and id not in result: result.append(id)
    return result

def selected(nodes,ids,include_children=False,foundation=True,foundation_ids=None):
    if foundation_ids is None:
        foundation_ids = load_config()['foundation'] if foundation else []
    requested=list(ids)
    for id in requested:
        if id not in nodes: raise ValueError(f'Unknown node: {id}')
    if include_children:
        requested += [child for id in ids for child in children(nodes,id)]
    result=[]
    for id in list(foundation_ids if foundation else ())+requested:
        chain=ancestors(nodes,id) if foundation else [id]
        for item in chain:
            if item not in result: result.append(item)
    return result

def label(node): return f'{node.id} â {node.title}'

def validate(root,nodes):
    for id in nodes: ancestors(nodes,id)
    roots=[n.id for n in nodes.values() if n.parent is None]
    config = load_config(root)
    if roots != [config['root']]:
        raise ValueError(f'Expected {config["root"]} as sole root, got {roots}')
    for id in config['foundation']:
        if id not in nodes: raise ValueError(f'Missing foundation {id}')
    by_path={}
    for n in nodes.values():
        by_path.setdefault(n.path.resolve(),set())
        if n.anchor: by_path[n.path.resolve()].add(n.anchor)
    for path in list((root/'knowledge').rglob('*.md'))+[root/'README.md',root/'AGENTS.md']:
        if not path.exists(): continue
        text=path.read_text()
        if '(kg:' in text: raise ValueError(f'Unresolved logical link in {path}')
        for target in LINK.findall(text):
            if urlparse(target).scheme: continue
            rel,_,fragment=target.partition('#');p=(path.parent/unquote(rel)).resolve()
            if not p.is_file(): raise ValueError(f'Broken file link in {path}: {target}')
            if p in by_path and fragment and fragment not in by_path[p]:
                raise ValueError(f'Broken node link in {path}: {target}')
    return f'Validated {len(nodes)} nodes, {len(by_path)} containers, ancestry and local links.'

def read_blocks(nodes, ids, root=ROOT):
    return [f'# {label(nodes[id])}\nSource: {nodes[id].path.relative_to(root)}:{nodes[id].start}-{nodes[id].end}\n\n{nodes[id].body}' for id in ids]

def read_batches(ids, blocks, word_target):
    """Keep complete nodes together; a large node gets its own batch."""
    batches=[];batch=[];words=0
    for id,block in zip(ids,blocks):
        size=len(block.split())
        if batch and words+size>word_target:
            batches.append(batch);batch=[];words=0
        batch.append((id,block));words+=size
    if batch: batches.append(batch)
    return batches

def positive(value):
    number=int(value)
    if number<1: raise argparse.ArgumentTypeError('must be a positive integer')
    return number

def audit_event(args, nodes, ids, **extra):
    options = vars(args).copy()
    options.pop('command')
    if 'terms' in options:
        options['term_count'] = len(options.pop('terms'))
    items=[]
    for id in ids:
        node=nodes[id]
        # Fingerprint emitted content, not unshown bodies from discovery commands.
        if args.command=='read':
            content=node.title+'\n'+node.body
        elif args.command=='search':
            terms=[term.casefold() for term in args.terms]
            hit=next((line for line in node.body.splitlines() if any(term in line.casefold() for term in terms)), '')
            content=f'{label(node)}|{node.path}:{node.start}-{node.end}|{hit[:180]}'
        elif args.command=='tree':
            content=label(node)
        else:
            content=json.dumps({'label':label(node),'parent':node.parent,'path':str(node.path),
                'lines':[node.start,node.end],'children':children(nodes,id),'references':refs(nodes,node)},sort_keys=True)
        items.append({'id':id,'fingerprint':hashlib.sha256(content.encode()).hexdigest()})
    if args.command=='read':
        extra.update(knowledge_parents={id:node.parent for id,node in nodes.items()},
            knowledge_node_count=len(nodes), knowledge_inventory=hashlib.sha256(
            json.dumps(sorted(nodes),separators=(',', ':')).encode()).hexdigest())
    return dict(command=args.command,options=options,items=items,**extra)


def _main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest='command',required=True)
    sub.add_parser('validate')
    p=sub.add_parser('tree');p.add_argument('id',nargs='?',default=None);p.add_argument('--depth',type=int,default=None,help='optional display limit; default shows the full tree')
    p=sub.add_parser('inspect');p.add_argument('ids',nargs='+')
    p=sub.add_parser('read');p.add_argument('ids',nargs='*');p.add_argument('--all',action='store_true',help='read every maintained knowledge node once');p.add_argument('--children',action='store_true',help='explicitly include immediate children only');p.add_argument('--only',action='store_true',help='omit already-loaded foundation and ancestors')
    p.add_argument('--batch',type=positive,help='read one numbered batch of the selection')
    p.add_argument('--batch-words',type=positive,default=1600,help='approximate batch size; complete nodes stay together')
    p=sub.add_parser('search');p.add_argument('terms',nargs='+')
    p=sub.add_parser('index');p.add_argument('--json',action='store_true')
    args=parser.parse_args();nodes=load_nodes();config=load_config()
    if args.command=='validate': print(validate(ROOT,nodes));return
    if args.command=='index':
        data=[{'id':n.id,'parent':n.parent,'title':n.title,'path':n.path.relative_to(ROOT).as_posix(),'start_line':n.start,'end_line':n.end,'children':children(nodes,n.id),'references':refs(nodes,n)} for n in nodes.values()]
        if args.json: print(json.dumps(data,ensure_ascii=False,indent=2))
        else:
            for n in nodes.values():print(f'{label(n)} | {n.path.relative_to(ROOT)}:{n.start}-{n.end}')
        return audit_event(args,nodes,list(nodes))
    if args.command=='tree':
        args.id = args.id or config['root']
        # Validate every parent edge before recursion, including descendants.
        for id in nodes: ancestors(nodes,id)
        ancestors(nodes,args.id)
        emitted=[]
        pending = [(args.id, 0)]
        while pending:
            id, depth = pending.pop();emitted.append(id)
            print('  '*depth+label(nodes[id]))
            if args.depth is None or depth<args.depth:
                pending.extend((child, depth+1) for child in reversed(children(nodes,id)))
        return audit_event(args,nodes,emitted)
    if args.command=='search':
        emitted=[]
        terms=[t.casefold() for t in args.terms]
        for n in nodes.values():
            if all(t in (label(n)+'\n'+n.body).casefold() for t in terms):
                emitted.append(n.id)
                print(label(n))
                print(f'  {n.path.relative_to(ROOT)}:{n.start}-{n.end}')
                hit=next((line for line in n.body.splitlines() if any(t in line.casefold() for t in terms)),None)
                if hit: print('  '+hit[:180])
        return audit_event(args,nodes,emitted)
    if args.command=='inspect':
        emitted=[]
        for id in args.ids:
            emitted.append(id)
            n=nodes[id];print(label(n));print('Context path: '+' > '.join(ancestors(nodes,id)))
            print(f'Location: {n.path.relative_to(ROOT)}:{n.start}-{n.end}')
            print('References: '+(', '.join(refs(nodes,n)) or '(none)'))
            for child in children(nodes,id):
                emitted.append(child)
                c=nodes[child];print('  '+label(c));print('    References: '+(', '.join(refs(nodes,c)) or '(none)'))
        return audit_event(args,nodes,emitted)
    if args.all and (args.ids or args.children or args.only):
        parser.error('--all cannot be combined with node IDs, --children or --only')
    if not args.all and not args.ids: parser.error('read requires node IDs or --all')
    ids=selected(nodes,list(nodes) if args.all else args.ids,args.children,not args.only,config['foundation'])
    blocks=read_blocks(nodes,ids);words=sum(len(b.split()) for b in blocks)
    snapshot=hashlib.sha256('\n\n'.join(blocks).encode()).hexdigest()[:12]
    scope='all maintained knowledge (knowledge/; excludes tools, skills and binary assets)' if args.all else 'selected nodes with the requested context'
    batches=read_batches(ids,blocks,args.batch_words)
    if args.batch and args.batch>len(batches): parser.error(f'only {len(batches)} batches exist')
    print(f'[READ START | {scope} | snapshot {snapshot} | {len(ids)} selected nodes | {words} words]')
    if args.batch:
        batch=batches[args.batch-1]
        before=sum(len(b) for b in batches[:args.batch-1]);after=before+len(batch)
        print(f'[BATCH {args.batch}/{len(batches)} | nodes {before+1}-{after}/{len(ids)} | {len(ids)-len(batch)} nodes outside this batch]')
        print('\n\n'.join(block for _,block in batch))
        print(f'\n[READ COMPLETE | snapshot {snapshot} | batch {args.batch}/{len(batches)} | emitted IDs: '+', '.join(id for id,_ in batch)+']')
        print('Full selection requires every batch with this snapshot; this receipt confirms only this batch.')
    else:
        print('\n\n'.join(blocks))
        print(f'\n[READ COMPLETE | snapshot {snapshot} | {len(ids)}/{len(ids)} selected nodes emitted | IDs: '+', '.join(ids)+']')

    emitted = [id for id,_ in batch] if args.batch else ids
    return audit_event(args,nodes,emitted,snapshot=snapshot,selected_ids=ids,
                       batch=args.batch or 0,batch_count=len(batches),foundation_ids=config['foundation'])


def main():
    if os.name != 'posix':
        return _main()
    try:
        import context_audit
    except ModuleNotFoundError as exc:
        if exc.name != 'context_audit':
            raise
        return _main()
    return context_audit.run_instrumented(ROOT, _main)


if __name__=='__main__':
    try:main()
    except (ValueError,KeyError,OSError) as exc:
        print(f'context: {exc}',file=sys.stderr);sys.exit(1)
