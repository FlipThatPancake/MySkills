# python3 applyshots.py <seed>: runs the skill's fitshots.mjs on seed-<n>.json here and writes the cameras it finds into seed-<n>.spec.mjs
import re,sys,subprocess,os
n=sys.argv[1]; here=os.path.dirname(os.path.abspath(__file__))
fit=os.path.join(here,'..','..','..','skills','cozy-interiors','scene','fitshots.mjs')
out=subprocess.run(['node',fit,os.path.join(here,f'seed-{n}.json')],capture_output=True,text=True).stdout
p=os.path.join(here,f'seed-{n}.spec.mjs'); s=open(p).read()
for line in out.splitlines():
    m=re.match(r'(\w+) "(.+?)" → \[([\d,\-]+)\], \[([\d,\-]+)\], (\d+)',line)
    if not m: print('SKIP',line[:120]); continue
    a,name,fr,lk,fov=m.groups()
    pat=re.compile(r"(a\.shot\('"+re.escape(name)+r"', )\[[^\]]*\], \[[^\]]*\], \d+")
    if not pat.search(s): print('nomatch',name); continue
    s=pat.sub(lambda mm: mm.group(1)+f"[{fr.replace(',',', ')}], [{lk.replace(',',', ')}], {fov}",s)
open(p,'w').write(s)
