# python3 applyshots.py <seed>: runs the skill's fitshots.mjs on seed-<n>.json here and writes the cameras it finds into seed-<n>.spec.mjs
import re,sys,subprocess,os
n=sys.argv[1]; base=f'seed-{n}' if n.isdigit() else n; here=os.path.dirname(os.path.abspath(__file__))
fit=os.path.join(here,'..','..','..','skills','cozy-interiors','scene','fitshots.mjs')
out=subprocess.run(['node',fit,os.path.join(here,f'{base}.json')],capture_output=True,text=True).stdout
p=os.path.join(here,f'{base}.spec.mjs'); s=open(p).read()
pos=0
for line in out.splitlines():
    m=re.match(r'(\w+) "(.+?)" → \[([\d,\-]+)\], \[([\d,\-]+)\], (\d+)',line)
    if not m: print('SKIP',line[:120]); continue
    a,name,fr,lk,fov=m.groups()
    pat=re.compile(r"(a\.shot\('"+re.escape(name)+r"', )\[[^\]]*\], \[[^\]]*\], \d+")
    mm=pat.search(s,pos)   # shots come in area order, so a name used in two areas is matched in order
    if not mm: print('nomatch',name); continue
    new=mm.group(1)+f"[{fr.replace(',',', ')}], [{lk.replace(',',', ')}], {fov}"
    s=s[:mm.start()]+new+s[mm.end():]; pos=mm.start()+len(new)
open(p,'w').write(s)
