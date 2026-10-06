import sys,os; sys.path.insert(0,'.')
from crops import CROPS
from PIL import Image, ImageOps
OUT='/home/claude/mbsweets.github.io/assets/img/'
os.makedirs(OUT,exist_ok=True)
SQUARE=lambda n: n in('balushahi','rasgulla','gulabjamun','chamcham','rasmalai','peda','laddoo','real-balushahi','real-rasgulla-bowl','real-balushahi-cut','real-boondi','real-milkcake') or n.startswith('cake-')
def widths(n,w,h):
    if n=='shop-front-wide': return [960,1600]
    if n=='shop-front-43': return [640,1000]
    if n.startswith('banner-'): return [800,1400]
    if SQUARE(n): return [400,560,800]
    return [480,640,900]
meta={}
for n,(src,(a,b,c,e)) in CROPS.items():
    im=ImageOps.exif_transpose(Image.open(src)).convert('RGB')
    W,H=im.size
    im=im.crop((round(a*W),round(b*H),round(c*W),round(e*H)))
    if SQUARE(n):
        s=min(im.size); x=(im.width-s)//2; y=(im.height-s)//2; im=im.crop((x,y,x+s,y+s))
    out=[]
    for w in widths(n,*im.size):
        if w>im.width: w=im.width
        r=im.resize((w,round(im.height*w/im.width)),Image.LANCZOS)
        p=f'{OUT}{n}-{w}.webp'; r.save(p,'WEBP',quality=76,method=6)
        out.append((w,r.height,os.path.getsize(p)//1024))
    meta[n]=out
    print(n,out)
import json; json.dump(meta,open('/tmp/claude-0/-home-claude-mb-sweets/cd0ff99b-ecff-5326-bef3-9062146669c5/scratchpad/site-build/img-meta.json','w'))
