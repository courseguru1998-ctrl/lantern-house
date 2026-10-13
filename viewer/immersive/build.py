from pathlib import Path
import json,re
R=Path(__file__).resolve().parents[1]; D=R/'immersive'
s=(R/'house-scene.js').read_text().split("let night=false,active=")[0]
s=s.replace("viewer.classList.add('unavailable');return;","document.querySelector('#boot h1').textContent='Open your house in a 3D-enabled browser.';document.querySelector('#bootText').textContent='WebGL is unavailable here. Open this file in Chrome or Edge with hardware acceleration enabled.';document.querySelector('.loadingLine').hidden=true;return;")
s=s.replace('bevelSegments:5','bevelSegments:2').replace('new THREE.SphereGeometry(r,24,16)','new THREE.SphereGeometry(r,16,10)')
s=s.replace('mobile?1.25:1.8','mobile?1:1.25').replace('PerspectiveCamera(43,1,.25,450)','PerspectiveCamera(68,1,.18,600)')
s=s.replace('const wallsets={ground:[],upper:[]};','const doors=[];const wallsets={ground:[],upper:[]};')
# Sliding panels are confined to the existing full-height glazed openings.
a=s.index('function pane('); b=s.index('function wall(',a)
s=s[:a]+'''function pane(axis,a,b,y0,y1,c,p){
const mm=new THREE.Group();p.add(mm);
const sliding=axis==='x'&&(y0===0||y0===11);
if(sliding){
 for(const x of [a,b])box(x-.05,x+.05,y0,y1,c-.09,c+.09,M.metal,mm);
 box(a,b,y1-.10,y1,c-.09,c+.09,M.metal,mm);box(a,b,y0,y0+.06,c-.09,c+.09,M.metal,mm);
 const panels=[];for(let i=0;i<2;i++){const g=new THREE.Group();mm.add(g);const l=a+i*(b-a)/2,r=l+(b-a)/2;box(l,r,y0+.08,y1-.1,c-.025,c+.025,M.glass,g,false);for(const x of [l,r])box(x-.035,x+.035,y0+.08,y1-.1,c-.055,c+.055,M.metal,g);g.userData.dynamic=true;panels.push(g);}
 doors.push({type:'slide',panels,x:(a+b)/2,y:y0,z:c,width:(b-a),value:0});
}else if(axis==='x'){box(a,b,y0,y1,c-.025,c+.025,M.glass,mm,false);for(const x of [a,(a+b)/2,b])box(x-.05,x+.05,y0,y1,c-.09,c+.09,M.metal,mm);box(a,b,y0,y0+.10,c-.09,c+.09,M.metal,mm);box(a,b,y1-.10,y1,c-.09,c+.09,M.metal,mm);}
else{box(c-.025,c+.025,y0,y1,a,b,M.glass,mm,false);for(const z of [a,(a+b)/2,b])box(c-.09,c+.09,y0,y1,z-.05,z+.05,M.metal,mm);box(c-.09,c+.09,y0,y0+.10,a,b,M.metal,mm);box(c-.09,c+.09,y1-.10,y1,a,b,M.metal,mm);}
return mm;}
''' +s[b:]
s=s.replace("box(-.02,.10,0,8,17.55,21.6,M.wood);bar([-.18,3.1,20.9],[-.18,4.7,20.9],.045,M.metal,groups.ground);", "const entryDoor=new THREE.Group();entryDoor.position.set(.04,0,17.55);entryDoor.userData.dynamic=true;groups.ground.add(entryDoor);box(-.06,.06,0,8,0,4.05,M.wood,entryDoor);bar([-.13,3.1,3.4],[-.13,4.7,3.4],.045,M.metal,entryDoor);doors.push({type:'hinge',g:entryDoor,x:0,y:0,z:19.6,value:0});")
s=s.replace('for(let x=-17;x<0;x+=.35)box(x,x+.10,0,3.8,68.25,68.45,M.metal,groups.site);', "const gate=new THREE.Group();gate.userData.dynamic=true;groups.site.add(gate);const gateBars=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,3.8,.2),M.metal,49);gate.add(gateBars);for(let i=0;i<49;i++)gateBars.setMatrixAt(i,new THREE.Matrix4().makeTranslation(-16.95+i*.35,1.9,68.35));doors.push({type:'gate',g:gate,x:-8.5,y:0,z:68.3,value:0});")
s=s.replace('cyl((a+b)/2,2.5,36.6,.55,.15,M.white);', 'cyl(b-.85,2.5,36.6,.5,.15,M.white);').replace('box(a+.2,b-.2,2.4,2.6,35.5,37.3,M.wood);','box(b-1.5,b-.2,2.4,2.6,35.5,38,M.wood);')
s+='\n'+(D/'engine.js').read_text()+'\n})();'
mezz=(R/'mezzanine.js').read_text().replace('return {walls,ceiling','return {stairG,walls,ceiling')
mezz=mezz.replace("B(23.13,23.5-PT,0,7.3,ARMZ+PT,RZ,tileMat(6.17,7.3,'#E2DED7'),scene,false);","B(23.13,23.5-PT,0,7.3,ARMZ+PT,14.9,tileMat(2.07,7.3,'#E2DED7'),scene,false);B(23.13,23.5-PT,0,7.3,17.3,RZ,tileMat(1.7,7.3,'#E2DED7'),scene,false);")
mezz=mezz.replace(',thickness:.06','')
mezz=mezz.replace('floor.position.set(RX/2,0,RZ/2)','floor.position.set(RX/2,.025,RZ/2)')
mezz=mezz.replace('bevelSegments:7,curveSegments:8','bevelSegments:3,curveSegments:3').replace('SphereGeometry(r,32,20)','SphereGeometry(r,16,10)').replace('seg||32','seg||16').replace('48,10),pos','32,4),pos')
nodes=json.loads((R/'tour/nodes.json').read_text());nodes.append(dict(id='suitebath',name='Suite bathroom',floor='first',p=[22,16.3,41],t=[18,14,42],description='The private suite bathroom.'))
plans={}
for n in ['ground','first','deck']:
 t=(R/f'{n}-plan.svg').read_text();plans[n]=re.sub(r'^<svg[^>]*>','',t).replace('</svg>','')
html=(D/'interface.html').read_text().replace('/*STYLE*/',(D/'style.css').read_text())
scripts='window.ROOMS='+json.dumps(nodes)+';window.PLANS='+json.dumps(plans)+';'
for code in [(R/'three.min.js').read_text(),scripts,mezz,s,(D/'ui.js').read_text(),(D/'studio-bridge.js').read_text()]:html+='\n<script>'+code.replace('</script','<\\/script')+'</script>'
html+='</body></html>'
(R.parent/'public/viewer.html').write_text(html)
(D/'model.js').write_text(s)
print(len(html.encode()),'bytes')
