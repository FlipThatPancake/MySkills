import re,sys,subprocess
n=sys.argv[1]
out=subprocess.run(['node','fitshots.mjs',f'scenes/seed-{n}.json'],capture_output=True,text=True).stdout
p=f'scenes/seed-{n}.spec.mjs'; s=open(p).read()
for line in out.splitlines():
    m=re.match(r'(\w+) "(.+?)" → \[([\d,\-]+)\], \[([\d,\-]+)\], (\d+)',line)
    if not m: print('SKIP',line[:120]); continue
    a,name,fr,lk,fov=m.groups()
    pat=re.compile(r"(a\.shot\('"+re.escape(name)+r"', )\[[^\]]*\], \[[^\]]*\], \d+")
    if not pat.search(s): print('nomatch',name); continue
    s=pat.sub(lambda mm: mm.group(1)+f"[{fr.replace(',',', ')}], [{lk.replace(',',', ')}], {fov}",s)
open(p,'w').write(s)
