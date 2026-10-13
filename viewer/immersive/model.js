(()=>{'use strict';
const canvas=document.querySelector('#houseCanvas'),viewer=document.querySelector('#houseViewer');
let renderer;try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,preserveDrawingBuffer:false});}catch(e){document.querySelector('#boot h1').textContent='Open your house in a 3D-enabled browser.';document.querySelector('#bootText').textContent='WebGL is unavailable here. Open this file in Chrome or Edge with hardware acceleration enabled.';document.querySelector('.loadingLine').hidden=true;return;}
const mobile=innerWidth<760,DPR=Math.min(devicePixelRatio||1,mobile?1:1.25);
renderer.setPixelRatio(DPR);renderer.outputEncoding=THREE.sRGBEncoding;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.02;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(68,1,.18,600),V=THREE.Vector3;
const root=new THREE.Group();scene.add(root);const groups={};for(const n of ['site','ground','groundRoof','upper','upperRoof','suite','facade','veranda','lighting']){groups[n]=new THREE.Group();root.add(groups[n]);}
const doors=[];const wallsets={ground:[],upper:[]};const indoorLights=[];
let seed=105;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
function col(h){return new THREE.Color(h).convertSRGBToLinear();}
function material(h,rough=.8,metal=0){return new THREE.MeshStandardMaterial({color:col(h),roughness:rough,metalness:metal});}
function texture(w,h,paint,repX=1,repY=1){const c=document.createElement('canvas');c.width=w;c.height=h;paint(c.getContext('2d'),w,h);const t=new THREE.CanvasTexture(c);t.encoding=THREE.sRGBEncoding;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repX,repY);t.anisotropy=Math.min(8,renderer.capabilities.getMaxAnisotropy());return t;}
const stoneTex=texture(512,512,(g,w,h)=>{g.fillStyle='#b3ac9b';g.fillRect(0,0,w,h);for(let i=0;i<9500;i++){let v=110+rnd()*100;g.fillStyle=`rgba(${v},${v-5},${v-13},.10)`;g.fillRect(rnd()*w,rnd()*h,1+rnd()*3,1+rnd()*2);}for(let y=0;y<h;y+=64){g.fillStyle='#a29d90';g.fillRect(0,y,w,1);}},2,2);
const floorTex=texture(512,512,(g,w,h)=>{g.fillStyle='#d2cfc3';g.fillRect(0,0,w,h);for(let i=0;i<15000;i++){g.fillStyle=`rgba(90,86,68,${rnd()*.09})`;g.fillRect(rnd()*w,rnd()*h,1,1);}g.fillStyle='#a7a397';g.fillRect(0,0,1,h);g.fillRect(0,0,w,1);},8,8);
const woodTex=texture(256,512,(g,w,h)=>{g.fillStyle='#8a6544';g.fillRect(0,0,w,h);for(let i=0;i<800;i++){g.fillStyle=`rgba(40,30,15,${rnd()*.09})`;g.fillRect(rnd()*w,0,.3+rnd(),h);}},1,1);
const plasterTex=texture(256,256,(g,w,h)=>{g.fillStyle='#dedbcf';g.fillRect(0,0,w,h);for(let i=0;i<6000;i++){g.fillStyle=`rgba(110,107,91,${rnd()*.055})`;g.fillRect(rnd()*w,rnd()*h,1,1);}},2,2);
const fabricTex=texture(128,128,(g,w,h)=>{g.fillStyle='#e4dfd1';g.fillRect(0,0,w,h);for(let i=0;i<w;i+=2){g.fillStyle='rgba(80,70,50,.07)';g.fillRect(i,0,1,h);g.fillRect(0,i,w,1);}},4,4);
const M={plaster:new THREE.MeshStandardMaterial({map:plasterTex,roughness:.95}),stone:new THREE.MeshStandardMaterial({map:stoneTex,roughness:.85}),tile:new THREE.MeshStandardMaterial({map:floorTex,roughness:.6}),wood:new THREE.MeshStandardMaterial({map:woodTex,roughness:.65}),metal:material('#343932',.45,.55),sage:material('#87947c'),cream:new THREE.MeshStandardMaterial({map:fabricTex,color:col('#e5dfd0'),roughness:.95}),clay:material('#a77c61'),white:material('#efeee5'),soil:material('#7c7861'),grass:material('#849076'),dark:material('#303b32'),water:material('#707d72',.25),glass:new THREE.MeshPhysicalMaterial({color:col('#c3d2cd'),transparent:true,opacity:.18,roughness:.07,metalness:.1,depthWrite:false}),glow:new THREE.MeshStandardMaterial({color:col('#fff2d4'),emissive:col('#ffce8b'),emissiveIntensity:.35}),leaf:material('#607356'),leaf2:material('#80906a')};
function box(x0,x1,y0,y1,z0,z1,m=M.plaster,p=groups.ground,cast=true){const o=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m);o.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);o.castShadow=cast;o.receiveShadow=true;p.add(o);return o;}
function cyl(x,y,z,r,h,m=M.wood,p=groups.ground,rt){const o=new THREE.Mesh(new THREE.CylinderGeometry(rt===undefined?r:rt,r,h,24),m);o.position.set(x,y+h/2,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function soft(x,y,z,w,h,d,m,p=groups.ground,r=.12){const shape=new THREE.Shape(),a=w/2-r,b=h/2-r;shape.moveTo(-a,-b);shape.lineTo(a,-b);shape.lineTo(a,b);shape.lineTo(-a,b);shape.closePath();const geo=new THREE.ExtrudeGeometry(shape,{depth:Math.max(.01,d-2*r),steps:1,bevelEnabled:true,bevelSegments:2,bevelSize:r,bevelThickness:r});geo.translate(0,0,-(d-2*r)/2);const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;p.add(o);return o;}
function bar(a,b,r,m,p){const va=new V(...a),vb=new V(...b),v=vb.clone().sub(va),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),10),m);o.position.copy(va.add(vb).multiplyScalar(.5));o.quaternion.setFromUnitVectors(new V(0,1,0),v.normalize());o.castShadow=true;p.add(o);return o;}
function pane(axis,a,b,y0,y1,c,p){
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
function wall(axis,a,b,c,t,y0,y1,openings,p,material=M.plaster){const g=new THREE.Group();p.add(g);let cursor=a;function seg(a,b,h0,h1){if(b-a<.005||h1-h0<.005)return;if(axis==='x')box(a,b,h0,h1,c-t/2,c+t/2,material,g);else box(c-t/2,c+t/2,h0,h1,a,b,material,g);}for(const o of openings.sort((x,y)=>x.a-y.a)){seg(cursor,o.a,y0,y1);seg(o.a,o.b,y0,o.y0);seg(o.a,o.b,o.y1,y1);if(o.glass)pane(axis,o.a,o.b,o.y0,o.y1,c,g);cursor=o.b;}seg(cursor,b,y0,y1);return g;}
function lamp(x,y,z,p=groups.ground,r=.3){bar([x,y+.2,z],[x,y+2,z],.012,M.metal,p);cyl(x,y-.06,z,r,.12,M.glow,p);const l=new THREE.PointLight(0xffd8ab,.11,16,2);l.position.set(x,y-.3,z);p.add(l);indoorLights.push(l);}
function rail(axis,a,b,c,y,p,height=3.5){if(axis==='x'){box(a,b,y,y+height,c-.025,c+.025,M.glass,p,false);box(a,b,y+height,y+height+.07,c-.04,c+.04,M.metal,p);for(let x=a;x<=b+.1;x+=3)box(x-.035,x+.035,y,y+height,c-.035,c+.035,M.metal,p);}else{box(c-.025,c+.025,y,y+height,a,b,M.glass,p,false);box(c-.04,c+.04,y+height,y+height+.07,a,b,M.metal,p);for(let z=a;z<=b+.1;z+=3)box(c-.035,c+.035,y,y+height,z-.035,z+.035,M.metal,p);}}
function plant(x,y,z,h,p=groups.site){cyl(x,y,z,h*.14,h*.25,M.stone,p,h*.18);bar([x,y+h*.2,z],[x,y+h*.88,z],h*.018,M.wood,p);for(let i=0;i<18;i++){const a=i*2.3999,level=.35+.6*(i/18),r=h*(.3-.14*level),o=new THREE.Mesh(new THREE.SphereGeometry(1,10,6),i%2?M.leaf:M.leaf2);o.scale.set(h*.16,h*.035,h*.09);o.position.set(x+Math.cos(a)*r,y+h*level,z+Math.sin(a)*r);o.rotation.set(.15,-a,.6);o.castShadow=true;p.add(o);}}
function sofa(x,z,w,d,y=0,p=groups.ground,angle=0,m=M.cream){const g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=angle;p.add(g);soft(0,.9,0,w,1.0,d,m,g,.15);soft(0,2,d/2-.3,w,1.5,.6,m,g,.2);soft(-w/2+.25,1.5,0,.5,1.0,d,m,g,.15);soft(w/2-.25,1.5,0,.5,1,d,m,g,.15);for(let i=0;i<Math.max(2,Math.floor(w/2));i++)soft(-w/2+.6+(i+.5)*(w-1.2)/Math.max(2,Math.floor(w/2)),1.38,-.25,(w-1.3)/Math.max(2,Math.floor(w/2)),.30,d-.7,m,g,.1);for(const xx of [-w/2+.35,w/2-.35])for(const zz of [-d/2+.3,d/2-.3])cyl(xx,0,zz,.05,.45,M.metal,g);return g;}
function rug(x0,x1,z0,z1,y,p){box(x0,x1,y+.085,y+.12,z0,z1,M.cream,p,false);}
function chair(x,z,y,p,angle=0){return sofa(x,z,1.8,1.8,y,p,angle,M.sage);}
function dining(x,z,y,p){soft(x,y+2.55,z,3.2,.18,6.5,M.wood,p,.06);for(const xx of [x-1.1,x+1.1])for(const zz of [z-2.5,z+2.5])box(xx-.07,xx+.07,y,y+2.5,zz-.07,zz+.07,M.metal,p);for(let j=0;j<3;j++){chair(x-2.3,z-2+j*2,y,p,Math.PI/2);chair(x+2.3,z-2+j*2,y,p,-Math.PI/2);}lamp(x,y+7.7,z,p,.55);}
function bed(x,z,y,p,wood=M.wood){rug(x-4.5,x+4.5,z-1,z+8,y,p);soft(x,y+.65,z+3,6.2,.9,6.7,wood,p);soft(x,y+1.4,z+3,6.05,.65,6.55,M.cream,p,.15);soft(x,y+2.6,z-.5,8,.3,.2,M.wood,p);soft(x,y+2.8,z-.48,7.5,3.5,.3,M.sage,p,.08);soft(x,y+1.8,z+3.8,6.05,.35,4.9,M.cream,p,.13);soft(x,y+2.1,z+.7,2.5,.65,1.2,M.white,p,.15);soft(x+1.5,y+2.1,z+.7,2,.65,1.2,M.white,p,.15);for(const xx of [x-4,x+4]){box(xx-.55,xx+.55,y,y+1.6,z-.35,z+.85,wood,p);lamp(xx,y+4.5,z+.2,p,.23);}soft(x,y+1.05,z+7,4.1,.45,1.1,M.clay,p,.08);}
// Site: explicit overall dimension envelope. Small paving/landscape positions are concept design.
box(-20,40,-.7,-.35,-16,69,M.soil,groups.site);box(-19.25,39.25,-.34,-.28,-15.25,68.25,M.grass,groups.site);
box(-22,43,-.65,-.4,69,80,M.dark,groups.site);for(let x=-18;x<40;x+=11)box(x,x+6,-.395,-.38,74,74.18,M.white,groups.site,false);
box(-20,-19.25,-.3,2.4,-16,69,M.stone,groups.site);box(39.25,40,-.3,2.4,-16,69,M.stone,groups.site);box(-20,40,-.3,2.4,-16,-15.25,M.stone,groups.site);box(-20,-17,-.3,2.4,68.25,69,M.stone,groups.site);box(0,40,-.3,2.4,68.25,69,M.stone,groups.site);
const gate=new THREE.Group();gate.userData.dynamic=true;groups.site.add(gate);const gateBars=new THREE.InstancedMesh(new THREE.BoxGeometry(.1,3.8,.2),M.metal,49);gate.add(gateBars);for(let i=0;i<49;i++)gateBars.setMatrixAt(i,new THREE.Matrix4().makeTranslation(-16.95+i*.35,1.9,68.35));doors.push({type:'gate',g:gate,x:-8.5,y:0,z:68.3,value:0});
box(-17,-10,-.27,-.23,13,68.2,M.tile,groups.site);box(-17,36,-.26,-.22,54,66,M.tile,groups.site);box(17,35,-.21,-.18,55.5,65,M.stone,groups.site);
for(let z=-12;z<12;z+=4)box(-17.5,-13,-.2,-.13,z,z+1.9,M.stone,groups.site);for(const q of [[-12,-11,10],[-13,2,8],[-15,35,6],[-6,58,7],[7,57,7],[34,48,6]])plant(q[0],0,q[1],q[2]);
// Discreet car mass marks the existing front parking location, not an additional structure.
const car=new THREE.Group();groups.site.add(car);soft(25,1.4,60,13,1.6,5.6,material('#b2b4aa',.3,.4),car,.5);soft(25,2.5,60,7.8,1.6,5.0,M.glass,car,.5);for(const x of [21,29])for(const z of [57.2,62.8]){const w=cyl(x,.1,z,.9,.5,M.dark,car);w.rotation.x=Math.PI/2;w.position.y=.8;}
// Ground shell and source room arrangement.
box(0,37,-.4,0,0,45,M.stone);box(.75,36.25,.025,.065,.75,44.25,M.tile);
const frontG=wall('x',0,37,44.625,.75,0,10.5,[{a:3,b:10,y0:2.5,y1:7.4,glass:true},{a:13.5,b:16,y0:6.5,y1:8,glass:true},{a:20,b:22.5,y0:6.5,y1:8,glass:true},{a:27,b:34,y0:2.5,y1:7.4,glass:true}],groups.ground);
const northG=wall('z',0,45,.375,.75,0,10.5,[{a:11,b:13.5,y0:2.5,y1:8.5,glass:true},{a:17.25,b:22,y0:0,y1:8},{a:28,b:32,y0:2.5,y1:7.4,glass:true}],groups.ground);
const southG=wall('z',0,45,36.625,.75,0,10.5,[{a:3,b:9,y0:3.2,y1:7.5,glass:true},{a:15,b:22,y0:2.5,y1:8.5,glass:true},{a:28,b:32,y0:2.5,y1:7.4,glass:true}],groups.ground);
const rearG=wall('x',0,37,.375,.75,0,10.5,[{a:4.5,b:12.5,y0:0,y1:8.5,glass:true},{a:18,b:25.5,y0:0,y1:8.5,glass:true}],groups.ground);wallsets.ground=[{g:frontG,side:'west'},{g:northG,side:'north'},{g:southG,side:'south'},{g:rearG,side:'east'}];
// Lounge-dining screen on the existing division; no closed partition introduced.
box(15.75,16.5,0,10.5,0,3.5,M.plaster);for(let z=4;z<12;z+=.6)box(15.97,16.12,0,8.6,z,z+.1,M.wood);
// Front ground rooms: the two bedrooms remain. The first-floor change never propagates here.
wall('x',.75,36.25,24.875,.75,0,10.5,[{a:15.5,b:21.5,y0:0,y1:8}],groups.ground);
wall('z',25.25,44.25,12.92,.333,0,10.5,[{a:25.5,b:28.5,y0:0,y1:7.5},{a:33.2,b:35.9,y0:0,y1:7.2}],groups.ground);wall('z',25.25,44.25,24.08,.333,0,10.5,[{a:25.5,b:28.5,y0:0,y1:7.5},{a:33.2,b:35.9,y0:0,y1:7.2}],groups.ground);box(18.08,18.75,0,10.5,29,44.25,M.plaster);
for(const [a,b] of [[13.083,18.083],[18.75,23.75]]){wall('x',a,b,34.9,.333,0,10.5,[{a:a+.55,b:a+2.95,y0:0,y1:7.2}],groups.ground);box(a,b,.072,.10,35.1,44.25,M.stone);box(a+.2,b-.2,0,7.6,29.2,30.7,M.wood);for(let x=a+.25;x<b-.3;x+=1.2)box(x,x+.025,.15,7.4,30.71,30.74,M.dark);pane('x',a,b,0,7,41.2,groups.ground);cyl(b-.85,2.5,36.6,.5,.15,M.white);soft((a+b)/2,1.1,39.6,1.15,.55,1.7,M.white);box(b-1.5,b-.2,2.4,2.6,35.5,38,M.wood);lamp((a+b)/2,8,38,groups.ground,.2);}
for(const a of [1.1,27.2]){box(a,a+9,0,8.2,25.4,27.25,M.wood);for(let x=a+1.5;x<a+9;x+=1.5)box(x,x+.025,.2,8,27.25,27.28,M.dark);}
// Source GF sheet 2: both headboards face +X (right in the drawing), study desks face -X.
const groundBeds=[];
for(const [x,z] of [[12.0,38.1],[35.5,38.1]]){const g=new THREE.Group();g.name=x<20?'Guest bed — source orientation':'Main bed — source orientation';g.position.set(x,0,z);g.rotation.y=-Math.PI/2;groups.ground.add(g);bed(0,0,0,g);groundBeds.push(g);}
for(const x of [.80,24.30]){box(x,x+1.8,2.4,2.55,38.9,43.6,M.wood);for(const z of [39.1,43.4])box(x+.1,x+1.7,0,2.4,z,z+.1,M.wood);chair(x+2.8,41.0,0,groups.ground,Math.PI/2);}
for(const x of [4.0,32.0]){chair(x,29.6,0,groups.ground,.35);chair(x,32.2,0,groups.ground,-.35);cyl(x+1.6,0,31,.65,1.5,M.stone);}
// Ground living, informal foyer and kitchen in their existing positions.
rug(3,14,3.2,12.2,0,groups.ground);sofa(9.1,3.6,8.2,2.8,0,groups.ground,Math.PI);sofa(13.4,8,6.4,2.8,0,groups.ground,Math.PI/2);soft(8,1.1,8.8,3.4,.2,3.1,M.stone);box(.77,.9,3,6.4,5.3,10.5,M.dark);box(.8,2,0,1.2,4.6,11.2,M.wood);plant(3,0,2,4.6,groups.ground);
sofa(7.5,22.6,7,2.5,0,groups.ground);cyl(7.5,0,20,1.2,1.5,M.stone);plant(20,0,18,5,groups.ground);
dining(20.5,6.5,0,groups.ground);box(25,36.25,0,2.9,.8,3,M.sage);box(34,36.25,0,2.9,3,11.75,M.sage);box(26,36.25,0,2.9,9.6,11.75,M.sage);box(25,36.25,2.9,3.03,.8,3,M.stone);box(34,36.25,2.9,3.03,3,11.75,M.stone);box(26,36.25,2.9,3.03,9.6,11.75,M.stone);box(27.8,36.1,5,7.9,.9,2.0,M.wood);box(25.3,27.8,0,7.2,3.1,5.4,M.metal);for(const x of [29.6,30.7])for(const z of [1.6,2.2])cyl(x,3.04,z,.22,.03,M.dark);cyl(35,3.04,7,.6,.02,M.metal);lamp(30.2,8.1,7,groups.ground,.4);
// Pooja occupies the source 5'6 x 5' central room within the main stair.
wall('z',16,21.5,26.875,.25,0,7.6,[{a:18,b:20.75,y0:0,y1:7.2}],groups.ground,M.wood);box(32.5,32.75,0,7.6,16,21.5,M.wood);box(27,32.5,0,7.6,16,16.25,M.stone);box(27,32.5,0,.08,16.25,21.5,M.stone);box(28,31.5,0,1.8,16.3,17.7,M.wood);for(let z=17;z<21.5;z+=.35){if(z+.07<=18||z>=20.75)box(26.73,26.84,4.8,7.5,z,z+.07,M.wood);}lamp(29.75,6.6,18.7,groups.ground,.25);
// Source main stair core, schematic three-flight rise; stair fabrication is not dimensioned in the PDF.
const stair=new THREE.Group();groups.ground.add(stair);const ry=11/21;
for(let i=0;i<7;i++){box(25.3+i*1.2,26.5+i*1.2,(i+1)*ry-.18,(i+1)*ry,22,24.5,M.wood,stair);box(33.7,36.2,(8+i)*ry-.18,(8+i)*ry,22-i*1.2,23.2-i*1.2,M.wood,stair);box(32.5-i*1.2,33.7-i*1.2,(15+i)*ry-.18,(15+i)*ry,12.5,15,M.wood,stair);}
bar([25.3,-.1,23.25],[33.7,7*ry-.15,23.25],.12,M.metal,stair);bar([34.95,7*ry-.15,22],[34.95,14*ry-.15,13.7],.12,M.metal,stair);bar([33.7,14*ry-.15,13.75],[25.3,11-.15,13.75],.12,M.metal,stair);
box(33.7,36.2,7*ry-.3,7*ry,22,24.5,M.wood,stair);box(33.7,36.2,14*ry-.3,14*ry,12.5,15,M.wood,stair);
for(const [a,b] of [[[25.3,3.2,22],[33.7,6.9,22]],[[33.7,6.9,22],[33.7,10.6,13.7]],[[33.7,10.6,15],[25.3,14.2,15]]]){bar(a,b,.045,M.metal,stair);for(let k=0;k<=7;k++){const t=k/7,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,z=a[2]+(b[2]-a[2])*t;bar([x,y-3.2,z],[x,y,z],.022,M.metal,stair);}}
// Slab retained under mezzanine and family; openings only where shown in source option 2.
box(0,37,10.5,11,24.5,45,M.plaster,groups.groundRoof);box(0,25.3,10.5,11,12.5,24.5,M.plaster,groups.groundRoof);box(16.5,37,10.5,11,0,12.5,M.plaster,groups.groundRoof);box(36.2,37,10.5,11,12.5,24.5,M.plaster,groups.groundRoof);
// First-floor family, stair landing and terrace retain the option-2 arrangement.
box(.75,25.25,11,11.035,12.5,24.5,M.tile,groups.upper);box(16.5,36.25,11,11.035,.75,11.75,M.stone,groups.upper);
const northU=wall('z',0,25.25,.375,.75,11,21.5,[{a:11,b:13.5,y0:12,y1:19.5,glass:true},{a:14.8,b:17,y0:13,y1:19,glass:true}],groups.upper);
const eastU=wall('x',0,16.5,.375,.75,11,21.5,[{a:4.5,b:12.5,y0:12,y1:19.5,glass:true}],groups.upper);
const southU=wall('z',12.5,25.25,36.625,.75,11,21.5,[{a:15,b:22,y0:12.5,y1:19.2,glass:true}],groups.upper);wallsets.upper=[{g:northU,side:'north'},{g:eastU,side:'east'},{g:southU,side:'south'}];
rail('x',.75,15.75,12.5,11,groups.upper);rail('z',.75,12.5,16.5,11,groups.upper);rail('x',16.5,37,0,11,groups.upper);rail('z',0,12.5,36.625,11,groups.upper);rail('z',15.1,24.5,25.3,11,groups.upper);
wall('x',16.5,37,12.125,.75,11,21.5,[{a:17.2,b:24.9,y0:11,y1:19,glass:true}],groups.upper);
rug(5,17,15.2,23,11,groups.upper);sofa(14.8,19,7,2.8,11,groups.upper,Math.PI/2);chair(7,16,11,groups.upper,-Math.PI/6);chair(7,21,11,groups.upper,Math.PI/6);soft(10.4,12,18.5,3.6,.2,2.7,M.stone,groups.upper);plant(3,11,22,5,groups.upper);
sofa(27,3.8,6.3,2.7,11,groups.upper,Math.PI,M.sage);chair(22.6,7.6,11,groups.upper,Math.PI/2);soft(27,12.1,7.8,3.1,.16,2.3,M.stone,groups.upper);plant(34.2,11,2.7,5,groups.upper);
box(0,16.5,21.5,22,0,12.5,M.plaster,groups.upperRoof);box(0,37,21.5,22,12.5,25.25,M.plaster,groups.upperRoof);
// The source ground pergola + secondary kitchen remain within the existing rear 8' strip.
box(0,37,-.2,0,-8,0,M.stone,groups.ground);wall('x',16.5,37,-7.84,.333,0,9.2,[{a:19,b:30,y0:3.5,y1:7.8,glass:true}],groups.ground);wall('z',-8,0,36.83,.333,0,9.2,[],groups.ground);wall('z',-8,0,16.5,.333,0,9.2,[{a:-5.5,b:-2.5,y0:0,y1:7.5}],groups.ground);box(17,36.3,0,2.9,-7.5,-5.5,M.wood);box(17,36.3,2.9,3.05,-7.5,-5.5,M.stone);soft(24,2.5,-3,6,.18,2.6,M.wood);box(16.5,37,9.2,9.5,-8,0,M.metal,groups.groundRoof);for(const x of [.2,16.25])for(const z of [-7.75,-.1])box(x-.09,x+.09,0,9,z-.09,z+.09,M.metal,groups.veranda);for(let x=.2;x<16.5;x+=.8)box(x,x+.11,9,9.22,-8,0,M.wood,groups.veranda);for(const x of [2,6,10,14])plant(x,0,-6.4,4,groups.ground);soft(8,.95,-3,8,.5,2,M.stone);
// North arrival veranda, in the original canopy zone. Roof profile is a proposed refinement.
box(-8,0,-.25,0,-8,45,M.stone,groups.veranda);box(-11,0,-.25,0,13,31,M.stone,groups.veranda);for(const z of [-7.5,13.2,31.5,44.5])box(-7.85,-7.58,0,9,z-.13,z+.13,M.metal,groups.veranda);
const canopy=new THREE.Group();groups.veranda.add(canopy);box(-8.4,.05,8.6,8.8,-8.3,45.2,M.metal,canopy);for(let z=-8;z<45;z+=.65)box(-8.2,0,8.51,8.61,z,z+.08,M.wood,canopy);box(-11.4,0,8.6,8.8,13,31,M.metal,canopy);box(-.11,.04,0,8,17.25,17.55,M.wood);box(-.13,.02,0,8,21.6,22,M.wood);const entryDoor=new THREE.Group();entryDoor.position.set(.04,0,17.55);entryDoor.userData.dynamic=true;groups.ground.add(entryDoor);box(-.06,.06,0,8,0,4.05,M.wood,entryDoor);bar([-.13,3.1,3.4],[-.13,4.7,3.4],.045,M.metal,entryDoor);doors.push({type:'hinge',g:entryDoor,x:0,y:0,z:19.6,value:0});
// Bring in the approved mezzanine geometry at +11', exactly 35'6 x 19' inside.
groups.suite.position.set(.75,11,25.25);const suite=createMezzanine(groups.suite,renderer.capabilities.getMaxAnisotropy());
// Façade: a quiet mineral base and a screened upper lantern, not extra floors or balconies.
const facade=groups.facade;box(-.35,37.35,27.9,28.3,24.7,46.3,M.plaster,facade);box(-.35,.05,10.8,28.3,44.7,46.3,M.plaster,facade);box(36.95,37.35,10.8,28.3,44.7,46.3,M.plaster,facade);box(-.35,37.35,10.8,11.15,44.7,46.3,M.stone,facade);
// Shading fins align with the approved suite's two stacked window bays.
for(const [a,b] of [[4.25,10.75],[26.25,32.75]]){for(let x=a-.4;x<=b+.4;x+=.85){const fin=box(x-.065,x+.065,12.8,27,45.1,46.05,M.wood,facade);fin.rotation.y=-.36;}box(a-.65,b+.65,26.85,27.08,44.95,46.2,M.metal,facade);}
// Central vertical mineral panel preserves high wet-room vents by leaving their bands open.
box(13.55,23.7,0,5.8,44.97,45.12,M.stone,facade);box(13.55,23.7,8.2,10.7,44.97,45.12,M.stone,facade);
for(let x=14;x<24;x+=.42)box(x,x+.10,19.0,27.7,44.95,45.10,M.clay,facade);
box(.1,36.9,27.7,27.77,45.4,45.48,M.glow,facade,false);box(-7.7,-.15,8.42,8.48,17,17.08,M.glow,canopy,false);
// Light sculptures are concentrated at the double-height living volume.
for(const [x,y,z,r] of [[6,15,7,.65],[8,17,7,.5],[10,16,7.5,.4]]){const g=new THREE.Mesh(new THREE.SphereGeometry(r,16,10),M.glow);g.position.set(x,y,z);groups.upperRoof.add(g);bar([x,y+r,z],[x,21.5,z],.012,M.metal,groups.upperRoof);const l=new THREE.PointLight(0xffdbb1,.18,26,2);l.position.set(x,y-.4,z);groups.upperRoof.add(l);indoorLights.push(l);}
for(const z of [4,18,32,43]){const l=new THREE.PointLight(0xffcc91,.08,12,2);l.position.set(-5,7.8,z);groups.veranda.add(l);indoorLights.push(l);cyl(-5,8.38,z,.16,.03,M.glow,canopy);}
for(const x of [6.5,30]){const l=new THREE.PointLight(0xffce98,.12,18,2);l.position.set(x,24,42);groups.suite.parent.add(l);indoorLights.push(l);}
const hemi=new THREE.HemisphereLight(0xf2f3ed,0x766c54,.78);scene.add(hemi);const ambient=new THREE.AmbientLight(0xffffff,.05);scene.add(ambient);const sun=new THREE.DirectionalLight(0xffecd0,2.5);sun.position.set(-30,55,80);sun.target.position.set(15,0,20);scene.add(sun,sun.target);sun.castShadow=true;sun.shadow.mapSize.set(mobile?1024:2048,mobile?1024:2048);Object.assign(sun.shadow.camera,{left:-65,right:65,top:65,bottom:-65,near:1,far:190});sun.shadow.bias=-.00012;sun.shadow.normalBias=.035;
const env=new THREE.Scene();env.background=new THREE.Color('#a39d8e');for(const [x,y,z,w,h,ry,rx,c] of [[0,20,0,100,100,0,Math.PI/2,0xfff6e7],[0,4,-50,80,50,0,0,0xe6eef0],[50,5,0,80,50,Math.PI/2,0,0xfff5e6]]){const o=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide}));o.position.set(x,y,z);o.rotation.set(rx,ry,0);env.add(o);}const pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(env,.06).texture;pmrem.dispose();

// Continuous eye-level walkthrough. Feet throughout, matching the source model.
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), EYE=5.3;
const inRect=(x,z,a,b,c,d)=>x>=a&&x<=b&&z>=c&&z<=d;
let pending=false,lastTime=0,frames=0,ready=false,night=false,quality='auto',scale=mobile?.85:1.15;
const player={x:-11,z:62,l:0,y:0,yaw:-.4,pitch:0};
let yawTarget=player.yaw,pitchTarget=player.pitch,route=[],destination='',arrivalTarget=null,speed=0,joy={x:0,y:0},routeLook=true;
let walkSpeed=1,reducedMotion=false,overview=false,overviewAngle=.6,overviewHeight=27,overviewRadius=108,overviewPhi=.9,overviewCut=true,pinMode=false,sensitivity=.0022,moveForward=0,moveSide=0;
let navigationMode='view',steer={x:0,y:0},stepMotion=null,lastBlocked=0;
const keys=new Set(),floorNames=['Ground floor','First floor','Mezzanine deck','Main staircase','Mezzanine staircase'];
const dyn=o=>{for(let p=o;p;p=p.parent)if(p.userData.dynamic)return true;return false;};
stair.userData.stair=true;suite.stairG.userData.stair=true;
suite.jaali.userData.dynamic=true;
root.updateMatrixWorld(true);
// Collision boxes are taken from the retained architecture and furnishings before batching.
const colliders=[];let originalMeshes=0;
root.traverse(o=>{if(!o.isMesh)return;originalMeshes++;if(o.isInstancedMesh||dyn(o))return;for(let p=o;p;p=p.parent)if(p.userData.stair)return;
const m=Array.isArray(o.material)?o.material[0]:o.material;if(m.isMeshBasicMaterial||m.opacity<.02)return;
o.geometry.computeBoundingBox();const b=o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld);
if(b.max.y-b.min.y<.06)return;colliders.push({a:b.min.x,b:b.max.x,c:b.min.z,d:b.max.z,lo:b.min.y,hi:b.max.y});});
// All static meshes sharing a material are merged; transparent surfaces retain ordering.
const bins=new Map(),materials=new Set();
root.traverse(o=>{if(!o.isMesh)return;const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>materials.add(m));if(dyn(o))o.castShadow=false;if(o.isInstancedMesh||dyn(o)||ms.length>1||ms[0].transparent)return;
const key=ms[0].uuid;if(!bins.has(key))bins.set(key,{m:ms[0],items:[]});bins.get(key).items.push(o);});
for(const {m,items} of bins.values()){if(items.length<2)continue;let gs=[],count=0;for(const o of items){let g=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();g.applyMatrix4(o.matrixWorld);gs.push(g);count+=g.attributes.position.count;}
const g=new THREE.BufferGeometry();for(const [name,size] of [['position',3],['normal',3],['uv',2]]){const a=new Float32Array(count*size);let off=0;for(const q of gs){const at=q.attributes[name];if(at)a.set(at.array,off);off+=q.attributes.position.count*size;}g.setAttribute(name,new THREE.BufferAttribute(a,size));}
g.computeBoundingSphere();const mesh=new THREE.Mesh(g,m);mesh.castShadow=true;mesh.receiveShadow=true;root.add(mesh);for(const o of items)o.parent.remove(o);gs.forEach(g=>g.dispose());}
// Lighter vertex lighting is available on modest devices; keep the detailed materials for High.
const gl=renderer.getContext(),debugGL=gl.getExtension('WEBGL_debug_renderer_info');
const softwareGPU=!!(debugGL&&/swiftshader|llvmpipe|software/i.test(gl.getParameter(debugGL.UNMASKED_RENDERER_WEBGL)));
const materialPairs=new Map(),meshMaterials=[];root.traverse(o=>{if(!o.isMesh)return;const original=o.material;const convert=m=>{if(!m.isMeshStandardMaterial)return m;if(materialPairs.has(m))return materialPairs.get(m);const n=new THREE.MeshLambertMaterial({color:m.color.clone(),map:m.map,transparent:m.transparent,opacity:m.opacity,side:m.side,depthWrite:m.depthWrite,alphaTest:m.alphaTest,vertexColors:m.vertexColors,emissive:m.emissive.clone(),emissiveIntensity:m.emissiveIntensity});materialPairs.set(m,n);return n;};meshMaterials.push({o,original,light:Array.isArray(original)?original.map(convert):convert(original)});});
const fastPairs=new Map();
for(const a of meshMaterials){const convert=m=>{if(!m.isMeshStandardMaterial)return m;if(fastPairs.has(m))return fastPairs.get(m);const n=new THREE.MeshBasicMaterial({color:m.color.clone(),map:m.map,transparent:m.transparent,opacity:m.opacity,side:m.side,depthWrite:m.depthWrite,alphaTest:m.alphaTest,vertexColors:true});n.userData.emissive=m.emissiveIntensity*m.emissive.getHex()>0;fastPairs.set(m,n);return n;};a.fast=Array.isArray(a.original)?a.original.map(convert):convert(a.original);const g=a.o.geometry;if(!g.attributes.color){const normal=g.attributes.normal,colors=new Float32Array(g.attributes.position.count*3);for(let i=0;i<g.attributes.position.count;i++){const nx=normal?normal.getX(i):0,ny=normal?normal.getY(i):1,nz=normal?normal.getZ(i):0,v=.58+.25*Math.max(0,ny)+.10*Math.max(0,-nx*.6+ny*.7+nz*.35);colors[i*3]=v;colors[i*3+1]=v*.97;colors[i*3+2]=v*.92;}g.setAttribute('color',new THREE.BufferAttribute(colors,3));}}
let fastMode=softwareGPU,lightMode=softwareGPU||mobile;const originalEnvironment=scene.environment;
function shading(light,fast=false){lightMode=light;fastMode=fast;meshMaterials.forEach(a=>a.o.material=fast?a.fast:light?a.light:a.original);scene.environment=light?null:originalEnvironment;}
shading(lightMode,fastMode);if(softwareGPU)scale=.75;
// Stationary room lights: no nearest-light swaps, position jumps or per-frame shader changes.
const oldLights=[];root.traverse(o=>{if(o.isPointLight||o.isSpotLight)oldLights.push(o);});oldLights.forEach(o=>o.parent.remove(o));
const lightPool=[[7,8.8,36],[30,8.8,36],[8,8.5,10],[18,8.5,21],[29,8.7,7],[12,19.4,19],[7,23,35],[28,26,36],[-5,8,22]].map(p=>{const l=new THREE.PointLight(0xffdfba,.35,23,1.7);l.position.set(...p);scene.add(l);return l;});
function refreshLights(){} // Kept as a stable render hook; fixtures never follow the camera.
// A multi-level navigation grid: continuous free floor areas, with explicit stair surfaces.
const STEP=.35,X0=-19,Z0=-15,NX=168,NZ=265,SIZE=NX*NZ,RAD=.43;
function surface(l,x,z){
if(l===0){if(!inRect(x,z,-18.7,38.7,-14.7,67.75)&&!inRect(x,z,-16.5,-.5,67,77))return null;if(inRect(x,z,25.25,36.25,12.3,15.3)||inRect(x,z,33.3,36.3,15,24.55)||inRect(x,z,25.3,36.3,21.8,24.55))return null;return 0;}
if(l===1){if(!(inRect(x,z,1.15,24.9,13,24.6)||inRect(x,z,17,36.15,.8,12.65)||inRect(x,z,1.15,35.85,25.25,43.82)||inRect(x,z,16.25,20.45,24.5,25.65)))return null;if(inRect(x,z,12.58,24.3,34.85,37.85))return null;return 11;}
if(l===2){return (inRect(x,z,24.7,35.8,25.7,43.8)||inRect(x,z,14.55,25,38.23,43.8))?19.75:null;}
if(l===3){if(inRect(x,z,24.3,35.72,22.48,24.02))return clamp((x-25.3)/8.4,0,1)*11/3;if(inRect(x,z,34.15,35.72,13,22.48))return 11/3+clamp((22.48-z)/7.96,0,1)*11/3;if(inRect(x,z,24.3,34.15,12.98,14.52))return 22/3+clamp((34.15-x)/8.85,0,1)*11/3;return null;}
if(l===4){if(inRect(x,z,12.05,25.5,35.45,37.25))return 11+clamp((x-12.583)/11.667,0,1)*8.75;return null;}
return null;}
const grids=Array.from({length:5},()=>new Uint8Array(SIZE));
for(let l=0;l<5;l++){const g=grids[l];for(let iz=0;iz<NZ;iz++)for(let ix=0;ix<NX;ix++){const x=X0+ix*STEP,z=Z0+iz*STEP;if(surface(l,x,z)!==null)g[iz*NX+ix]=1;}
if(l<3){const y=[0,11,19.75][l];for(const b of colliders){if(b.hi<y+.32||b.lo>y+EYE+.25)continue;const xa=clamp(Math.ceil((b.a-RAD-X0)/STEP),0,NX-1),xb=clamp(Math.floor((b.b+RAD-X0)/STEP),0,NX-1),za=clamp(Math.ceil((b.c-RAD-Z0)/STEP),0,NZ-1),zb=clamp(Math.floor((b.d+RAD-Z0)/STEP),0,NZ-1);for(let z=za;z<=zb;z++)for(let x=xa;x<=xb;x++)g[z*NX+x]=0;}}
}
function index(x,z){const ix=Math.round((x-X0)/STEP),iz=Math.round((z-Z0)/STEP);return ix<0||ix>=NX||iz<0||iz>=NZ?-1:iz*NX+ix;}
function valid(l,x,z){const i=index(x,z);return i>=0&&grids[l][i]===1;}
function xyz(id){const l=Math.floor(id/SIZE),i=id%SIZE,x=X0+(i%NX)*STEP,z=Z0+Math.floor(i/NX)*STEP;return{x,z,l,y:surface(l,x,z)};}
function nearest(l,x,z,max=3){const center=index(x,z);if(center>=0&&grids[l][center])return l*SIZE+center;let best=-1,bd=max*max;const r=Math.ceil(max/STEP),cx=Math.round((x-X0)/STEP),cz=Math.round((z-Z0)/STEP);for(let dz=-r;dz<=r;dz++)for(let dx=-r;dx<=r;dx++){const ix=cx+dx,iz=cz+dz;if(ix<0||ix>=NX||iz<0||iz>=NZ)continue;const i=iz*NX+ix;if(!grids[l][i])continue;const d=(X0+ix*STEP-x)**2+(Z0+iz*STEP-z)**2;if(d<bd){best=l*SIZE+i;bd=d;}}return best;}
const portals=new Map();function join(l1,x1,z1,l2,x2,z2){const a=nearest(l1,x1,z1,2),b=nearest(l2,x2,z2,2);if(a<0||b<0)throw Error('Stair connection is inaccessible');if(!portals.has(a))portals.set(a,[]);if(!portals.has(b))portals.set(b,[]);portals.get(a).push(b);portals.get(b).push(a);}
join(0,24.55,23.25,3,24.65,23.25);join(1,24.6,13.7,3,24.65,13.7);join(1,12.25,36.2,4,12.2,36.2);join(2,25.1,36.2,4,25.2,36.2);
function clearLine(a,b){if(a.l!==b.l)return false;const n=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.14);for(let i=0;i<=n;i++)if(!valid(a.l,a.x+(b.x-a.x)*i/Math.max(n,1),a.z+(b.z-a.z)*i/Math.max(n,1)))return false;return true;}
function findPath(start,end){const si=nearest(start.l,start.x,start.z,2),ei=nearest(end.l,end.x,end.z,2);if(si<0||ei<0)return null;if(si===ei)return [xyz(ei)];const ep=xyz(ei),heap=[],dist=new Map([[si,0]]),from=new Map(),closed=new Set();
function push(id,f){let i=heap.length;heap.push({id,f});while(i){const p=(i-1)>>1;if(heap[p].f<=f)break;heap[i]=heap[p];i=p;heap[i]={id,f};}}
function pop(){const a=heap[0],b=heap.pop();if(heap.length){let i=0;heap[0]=b;while(true){let j=i*2+1;if(j>=heap.length)break;if(j+1<heap.length&&heap[j+1].f<heap[j].f)j++;if(heap[i].f<=heap[j].f)break;[heap[i],heap[j]]=[heap[j],heap[i]];i=j;}}return a.id;}
const heuristic=id=>{const p=xyz(id);return Math.hypot(p.x-ep.x,p.z-ep.z,p.y-ep.y);};push(si,heuristic(si));let n=0;
while(heap.length&&n++<180000){const id=pop();if(closed.has(id))continue;if(id===ei){const ids=[id];let k=id;while(from.has(k)){k=from.get(k);ids.push(k);}ids.reverse();const raw=ids.map(xyz),path=[raw[0]];let a=0;while(a<raw.length-1){let b=a+1;while(b+1<raw.length&&raw[b+1].l===raw[a].l&&clearLine(raw[a],raw[b+1]))b++;path.push(raw[b]);a=b;}return path;}
closed.add(id);const l=Math.floor(id/SIZE),i=id%SIZE,ix=i%NX,iz=Math.floor(i/NX);const neighbors=[];
for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){if(ix+dx<0||ix+dx>=NX||iz+dz<0||iz+dz>=NZ)continue;const j=i+dx+dz*NX;if(!grids[l][j])continue;if(dx&&dz&&(!grids[l][i+dx]||!grids[l][i+dz*NX]))continue;neighbors.push(l*SIZE+j);}
if(portals.has(id))neighbors.push(...portals.get(id));const p=xyz(id);for(const qid of neighbors){if(closed.has(qid))continue;const q=xyz(qid),nd=dist.get(id)+Math.hypot(q.x-p.x,q.z-p.z,q.y-p.y);if(nd<(dist.get(qid)??Infinity)){dist.set(qid,nd);from.set(qid,id);push(qid,nd+heuristic(qid));}}}
return null;}
const nodes=ROOMS.map(n=>({...n,l:n.floor==='deck'?2:n.floor==='first'?1:0}));
function dispatch(name,detail){document.dispatchEvent(new CustomEvent(name,{detail}));}
function stop(){moveForward=moveSide=0;stepMotion=null;steer={x:0,y:0};route=[];destination='';arrivalTarget=null;speed=0;keys.clear();joy={x:0,y:0};dispatch('walkroute',{active:false});request();}
function navigate(x,z,l,name='Selected space',lookAt=null){const path=findPath(player,{x,z,l});if(!path){dispatch('walktoast','That spot is not accessible. Choose a nearby clear floor area.');return false;}if(overview)setOverview(false);else stop();route=path;destination=name;arrivalTarget=lookAt;speed=0;routeLook=true;dispatch('walkroute',{active:true,name});dispatch('walkstart',{});request();return true;}
function go(id){const n=nodes.find(n=>n.id===id);if(!n)return false;return navigate(n.p[0],n.p[2],n.l,n.name,n.t);}
function move(dx,dz){const attempt=(x,z)=>{let l=player.l,y=surface(l,x,z);if(valid(l,x,z)&&y!==null&&Math.abs(y-player.y)<.48){player.x=x;player.z=z;player.y=y;return true;}
for(const nl of l===0?[3]:l===1?[3,4]:l===2?[4]:l===3?[0,1]:[1,2]){const ny=surface(nl,x,z);if(ny!==null&&Math.abs(ny-player.y)<.48&&valid(nl,x,z)){player.l=nl;player.x=x;player.z=z;player.y=ny;return true;}}return false;};
if(!attempt(player.x+dx,player.z+dz)){attempt(player.x+dx,player.z);attempt(player.x,player.z+dz);}}
function stairs(){let end;if(player.l===4)end={x:25.1,z:36.2,l:2};else if(player.l===3)end={x:24.5,z:13.7,l:1};else if(player.l===2)end={x:11.8,z:36.2,l:1};else if(player.l===1&&player.z>25)end={x:26,z:36.2,l:2};else if(player.l===1)end={x:23.5,z:23.25,l:0};else end={x:23.8,z:13.7,l:1};return navigate(end.x,end.z,end.l,end.l===2?'Mezzanine library':end.l===1?'First floor':'Ground floor');}
// Presentation lighting presets; directional studies, not a geolocated solar analysis.
const lightPresets={
 day:{sky:'#dce8ed',hemi:.82,ambient:.18,sun:1.45,position:[-45,36,60],sunColor:'#ffe4bb',ground:'#a5a699',exposure:1.12,indoor:.30,env:.46,glow:.4},
 midday:{sky:'#d7eaff',hemi:.94,ambient:.15,sun:2.05,position:[8,85,12],sunColor:'#fff8ec',ground:'#a4aaa0',exposure:1.0,indoor:.19,env:.53,glow:.3},
 dusk:{sky:'#b3a3a7',hemi:.44,ambient:.13,sun:1.15,position:[-38,12,75],sunColor:'#ffb775',ground:'#8a7470',exposure:1.16,indoor:.72,env:.29,glow:1.2},
 evening:{sky:'#26384e',hemi:.26,ambient:.13,sun:.06,position:[25,30,-45],sunColor:'#a9c9ff',ground:'#5b6070',exposure:1.24,indoor:1.05,env:.17,glow:1.9}
};
let timeOfDay='day',lightingTween=null;
function lightingState(){return {sky:scene.background.clone(),hemi:hemi.intensity,ambient:ambient.intensity,sun:sun.intensity,position:sun.position.clone(),sunColor:sun.color.clone(),ground:hemi.groundColor.clone(),exposure:renderer.toneMappingExposure,indoor:lightPool[0].intensity,env:M.plaster.envMapIntensity??.46,glow:M.glow.emissiveIntensity};}
function applyLighting(from,to,k){const lerp=(a,b)=>a+(b-a)*k;scene.background.copy(from.sky).lerp(new THREE.Color(to.sky),k);hemi.intensity=lerp(from.hemi,to.hemi);ambient.intensity=lerp(from.ambient,to.ambient);sun.intensity=lerp(from.sun,to.sun);sun.position.copy(from.position).lerp(new V(...to.position),k);sun.color.copy(from.sunColor).lerp(new THREE.Color(to.sunColor),k);hemi.groundColor.copy(from.ground).lerp(new THREE.Color(to.ground),k);renderer.toneMappingExposure=lerp(from.exposure,to.exposure);lightPool.forEach(l=>l.intensity=lerp(from.indoor,to.indoor));
 const env=lerp(from.env,to.env),glow=lerp(from.glow,to.glow);materials.forEach(m=>{if(m.isMeshStandardMaterial)m.envMapIntensity=env;});M.glow.emissiveIntensity=suite.glowWarm.emissiveIntensity=suite.globeMat.emissiveIntensity=glow;materialPairs.forEach((n,m)=>{n.color.copy(m.color);n.emissiveIntensity=m.emissiveIntensity;});
 fastPairs.forEach((n,m)=>{n.color.copy(m.color);const factor=.65+.35*hemi.intensity;n.color.multiplyScalar(factor);if(n.userData.emissive)n.color.add(m.emissive.clone().multiplyScalar(Math.min(.8,m.emissiveIntensity)));});renderer.shadowMap.needsUpdate=true;
}
function mood(v,instant=false){if(v==='night')v='evening';if(!lightPresets[v])return;timeOfDay=v;night=v==='evening';const from=lightingState(),to=lightPresets[v];lightingTween={from,to,start:performance.now()};if(instant||reducedMotion){applyLighting(from,to,1);lightingTween=null;}dispatch('walklighting',v);request();}
function cameraUpdate(){if(overview){camera.position.set(18+Math.sin(overviewAngle)*Math.sin(overviewPhi)*overviewRadius,8+Math.cos(overviewPhi)*overviewRadius,25+Math.cos(overviewAngle)*Math.sin(overviewPhi)*overviewRadius);camera.lookAt(new V(18,8,25));camera.updateMatrixWorld(true);return;}camera.position.set(player.x,player.y+EYE,player.z);camera.rotation.set(player.pitch,player.yaw,0,'YXZ');camera.updateMatrixWorld(true);}
function updateDoors(dt){let changing=false;for(const d of doors){const near=Math.hypot(player.x-d.x,player.z-d.z)<(d.type==='gate'?12:8)&&Math.abs(player.y-d.y)<3;const goal=near?1:0,old=d.value;d.value+=(goal-d.value)*Math.min(1,dt*5);if(Math.abs(d.value-goal)<.001)d.value=goal;if(Math.abs(old-d.value)>.0001)changing=true;if(d.type==='gate')d.g.position.x=d.value*17;else if(d.type==='hinge')d.g.rotation.y=-Math.PI*.49*d.value;else d.panels.forEach((g,i)=>g.position.x=(i?1:-1)*d.width*.43*d.value);}return changing;}
const ray=new THREE.Raycaster();const ring=new THREE.Mesh(new THREE.RingGeometry(.35,.46,40),new THREE.MeshBasicMaterial({color:0xe9f7cd,transparent:true,opacity:.85,side:THREE.DoubleSide,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.visible=false;scene.add(ring);let ringUntil=0;
function tap(e){if(overview)return;if(pinMode){cameraUpdate();const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);const h=ray.intersectObject(root,true).find(h=>h.object.visible&&(!h.object.material.transparent||h.object.material.opacity>.3));if(h){pinMode=false;dispatch('studiopin',{point:h.point.toArray()});}return;}cameraUpdate();const r=canvas.getBoundingClientRect();ray.setFromCamera(new THREE.Vector2((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2),camera);const hits=ray.intersectObject(root,true).filter(h=>h.object.visible&&(!h.object.material.transparent||h.object.material.opacity>.3));
if(!hits.length)return;const h=hits[0],n=h.face.normal.clone().transformDirection(h.object.matrixWorld);if(n.y<.6){dispatch('walktoast','Tap visible floor to walk, or choose a destination on the plan.');return;}
let l=-1,delta=1.5;for(let i=0;i<5;i++){const y=surface(i,h.point.x,h.point.z);if(y!==null&&Math.abs(y-h.point.y)<delta){delta=Math.abs(y-h.point.y);l=i;}}
if(l<0){dispatch('walktoast','Choose a clear floor area or a destination on the plan.');return;}if(navigate(h.point.x,h.point.z,l)){ring.position.set(h.point.x,h.point.y+.065,h.point.z);ring.visible=true;ringUntil=performance.now()+1800;}}
let pointer=null;
function mouseLook(dx,dy){if(overview){overviewAngle-=dx*.005;overviewPhi=clamp(overviewPhi+dy*.004,.30,1.18);}else{yawTarget-=dx*sensitivity;pitchTarget=clamp(pitchTarget-dy*sensitivity,-1.20,1.20);routeLook=false;}dispatch('walkstart',{});request();}
canvas.addEventListener('pointerdown',e=>{if(e.button>0)return;canvas.focus({preventScroll:true});if(document.pointerLockElement===canvas)return;canvas.setPointerCapture(e.pointerId);pointer={id:e.pointerId,x:e.clientX,y:e.clientY,dist:0};});
canvas.addEventListener('pointermove',e=>{if(document.pointerLockElement===canvas){mouseLook(e.movementX,e.movementY);return;}if(!pointer||e.pointerId!==pointer.id)return;const dx=e.clientX-pointer.x,dy=e.clientY-pointer.y;pointer.dist+=Math.hypot(dx,dy);pointer.x=e.clientX;pointer.y=e.clientY;if(pointer.dist>3)mouseLook(dx,dy);});
canvas.addEventListener('pointerup',e=>{if(pointer&&pointer.id===e.pointerId&&pointer.dist<5)tap(e);pointer=null;});canvas.addEventListener('pointercancel',()=>pointer=null);canvas.addEventListener('contextmenu',e=>e.preventDefault());
canvas.addEventListener('wheel',e=>{e.preventDefault();if(overview)overviewRadius=clamp(overviewRadius*Math.exp(e.deltaY*.001),65,260);else{camera.fov=clamp(camera.fov+e.deltaY*.02,50,90);camera.updateProjectionMatrix();}request();},{passive:false});
const keyNames=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','ShiftLeft','ShiftRight'];
addEventListener('keydown',e=>{if(document.querySelector('dialog[open]')||/INPUT|TEXTAREA|SELECT/.test(e.target?.tagName||''))return;if(e.code==='Escape'){stop();if(document.pointerLockElement)document.exitPointerLock();return;}if(keyNames.includes(e.code)){e.preventDefault();if(navigationMode!=='walk'||overview)return;if(route.length)stop();stepMotion=null;keys.add(e.code);dispatch('walkstart',{});request();}});addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();joy={x:0,y:0};steer={x:0,y:0};stepMotion=null;moveForward=moveSide=0;request();});
document.addEventListener('pointerlockchange',()=>{pointer=null;keys.clear();moveForward=moveSide=0;dispatch('walklook',document.pointerLockElement===canvas);request();});
function lockLook(){canvas.focus({preventScroll:true});if(document.pointerLockElement===canvas){document.exitPointerLock();return;}if(navigationMode!=='walk')return;try{const result=canvas.requestPointerLock?.();if(result?.catch)result.catch(()=>dispatch('walktoast','Mouse capture is unavailable. Drag the view to look around.'));}catch(e){dispatch('walktoast','Drag the view to look around.');}}
let frameTimes=[],renderMs=0,slowCount=0,uiTimer=0;
function request(){if(!pending&&!document.hidden){pending=true;requestAnimationFrame(frame);}}
function frame(now){pending=false;const dt=Math.min(.06,lastTime?(now-lastTime)/1000:.016);lastTime=now;let moving=false;
if(route.length){let remain=0,prev=player;for(const q of route){remain+=Math.hypot(q.x-prev.x,q.z-prev.z,q.y-prev.y);prev=q;}const desired=Math.min(5.8*walkSpeed,Math.sqrt(12*remain));speed+=clamp(desired-speed,-dt*8,dt*6);let budget=speed*dt;moving=true;while(route.length&&budget>0){const q=route[0],d=Math.hypot(q.x-player.x,q.z-player.z,q.y-player.y);if(d<.025){Object.assign(player,{x:q.x,z:q.z,y:q.y,l:q.l});route.shift();continue;}const step=Math.min(budget,d),k=step/d;
if(routeLook){const angle=Math.atan2(-(q.x-player.x),-(q.z-player.z));yawTarget=player.yaw+Math.atan2(Math.sin(angle-player.yaw),Math.cos(angle-player.yaw));pitchTarget=clamp((q.y-player.y)/d*.25,-.16,.16);}
player.x+=(q.x-player.x)*k;player.z+=(q.z-player.z)*k;player.y+=(q.y-player.y)*k;if(k>=1)player.l=q.l;if(player.l===q.l){const floorY=surface(player.l,player.x,player.z);if(floorY!==null)player.y=floorY;}budget-=step;if(k>=1)route.shift();}
if(!route.length){speed=0;if(routeLook&&arrivalTarget){const dx=arrivalTarget[0]-player.x,dz=arrivalTarget[2]-player.z,dy=arrivalTarget[1]-player.y-EYE,angle=Math.atan2(-dx,-dz);yawTarget=player.yaw+Math.atan2(Math.sin(angle-player.yaw),Math.cos(angle-player.yaw));pitchTarget=clamp(Math.atan2(dy,Math.hypot(dx,dz)),-1.24,1.24);}arrivalTarget=null;dispatch('walkroute',{active:false,arrived:destination});destination='';}}
// Resolve orientation BEFORE translating; keyboard direction always uses the displayed camera yaw.
if(steer.x||steer.y){yawTarget+=steer.x*1.3*dt;pitchTarget=clamp(pitchTarget+steer.y*.85*dt,-1.2,1.2);routeLook=false;moving=true;}
const turn=reducedMotion?1:1-Math.exp(-dt*(route.length&&routeLook?8:24));player.yaw+=(yawTarget-player.yaw)*turn;player.pitch+=(pitchTarget-player.pitch)*turn;const turning=Math.abs(yawTarget-player.yaw)+Math.abs(pitchTarget-player.pitch)>.0001;
let f=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)-joy.y,s=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)+joy.x;
const movingFrom={x:player.x,z:player.z};
if(stepMotion){const d=Math.min(stepMotion.left,3.1*dt),steps=Math.max(1,Math.ceil(d/.08));const forward=-stepMotion.y,side=stepMotion.x,norm=Math.max(1,Math.hypot(forward,side));for(let i=0;i<steps;i++)move((-Math.sin(player.yaw)*forward+Math.cos(player.yaw)*side)*d/steps/norm,(-Math.cos(player.yaw)*forward-Math.sin(player.yaw)*side)*d/steps/norm);stepMotion.left-=d;if(stepMotion.left<.005)stepMotion=null;moving=true;}
const norm=Math.max(1,Math.hypot(f,s)),rate=1-Math.exp(-dt*(f||s?14:22));moveForward+=(f/norm-moveForward)*rate;moveSide+=(s/norm-moveSide)*rate;if(Math.abs(moveForward)<.003)moveForward=0;if(Math.abs(moveSide)<.003)moveSide=0;
if(moveForward||moveSide){const vel=(keys.has('ShiftLeft')||keys.has('ShiftRight')?6:3.9)*walkSpeed*dt,steps=Math.max(1,Math.ceil(vel/.08));for(let i=0;i<steps;i++)move((-Math.sin(player.yaw)*moveForward+Math.cos(player.yaw)*moveSide)*vel/steps,(-Math.cos(player.yaw)*moveForward-Math.sin(player.yaw)*moveSide)*vel/steps);moving=true;}
if((f||s||stepMotion)&&Math.hypot(player.x-movingFrom.x,player.z-movingFrom.z)<.0001&&now-lastBlocked>1700){lastBlocked=now;dispatch('walkblocked',{});}
if(lightingTween){const k=clamp((now-lightingTween.start)/900,0,1);applyLighting(lightingTween.from,lightingTween.to,k*k*(3-2*k));if(k>=1)lightingTween=null;}
cameraUpdate();refreshLights();const doorsMoving=updateDoors(dt);if(ring.visible&&now>ringUntil)ring.visible=false;
const t=performance.now();renderer.render(scene,camera);renderMs=performance.now()-t;frames++;
if(moving||turning){frameTimes.push(dt*1000);if(frameTimes.length>100)frameTimes.shift();if(quality==='auto'&&dt>.044)slowCount++;else slowCount=Math.max(0,slowCount-1);if(slowCount>75&&scale>.75){scale=Math.max(.75,scale-.1);resize();slowCount=0;}}
if(now-uiTimer>90){uiTimer=now;dispatch('walkupdate',state());}
if(moving||turning||doorsMoving||ring.visible||lightingTween)request();else lastTime=0;
}
function resize(){const w=viewer.clientWidth,h=viewer.clientHeight;renderer.setPixelRatio(Math.min(devicePixelRatio||1,scale));renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();request();}
new ResizeObserver(resize).observe(viewer);document.addEventListener('visibilitychange',()=>{lastTime=0;if(document.hidden){keys.clear();joy={x:0,y:0};steer={x:0,y:0};stepMotion=null;moveForward=moveSide=0;}else request();});
function state(){let closest=null,bd=Infinity;for(const n of nodes){if(n.l!==(player.l===3?player.y>5.5?1:0:player.l===4?player.y>15.5?2:1:player.l))continue;const d=Math.hypot(n.p[0]-player.x,n.p[2]-player.z);if(d<bd){bd=d;closest=n;}}return {ready,navigationMode,overview,walkSpeed,reducedMotion,position:[player.x,player.y+EYE,player.z],player:{...player},floor:floorNames[player.l],room:player.l>=3?'Moving between floors':closest?.name||floorNames[player.l],route:route.map(p=>({...p})),destination,night,timeOfDay,overviewRadius,overviewPhi,mouseLocked:document.pointerLockElement===canvas,quality,scale,frames,calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,originalMeshes,renderMs,lightMode,fastMode,softwareGPU};}
function setQuality(q){quality=q;shading(q==='smooth'||q==='auto'&&(softwareGPU||mobile),q==='smooth'||q==='auto'&&softwareGPU);scale=q==='high'?Math.min(devicePixelRatio||1,1.5):q==='smooth'||softwareGPU?.85:mobile?1:1.25;resize();}
const clipPlane=new THREE.Plane(new V(0,-1,0),27);
function setOverview(on,level=2){stop();overview=!!on;overviewCut=level!==-1;overviewHeight=[9.5,18.8,27][level]||27;clipPlane.constant=overviewHeight;renderer.localClippingEnabled=overview&&overviewCut;for(const mat of [...materials,...materialPairs.values(),...fastPairs.values()]){mat.clippingPlanes=overview&&overviewCut?[clipPlane]:null;mat.needsUpdate=true;}camera.fov=overview?49:68;camera.updateProjectionMatrix();request();}
function snapshot(){return {player:{...player},night,timeOfDay,fov:camera.fov,scheme:currentScheme,edition:'05'};}
function restore(v){if(!v||!v.player)return false;const p=v.player;if(![p.x,p.z,p.l,p.yaw,p.pitch].every(Number.isFinite)||!Number.isInteger(p.l)||p.l<0||p.l>4)return false;const n=nearest(p.l,p.x,p.z,2);if(n<0)return false;setOverview(false);stop();Object.assign(player,xyz(n));if(valid(p.l,p.x,p.z)){player.x=p.x;player.z=p.z;player.y=surface(p.l,p.x,p.z);}yawTarget=player.yaw=p.yaw;pitchTarget=player.pitch=clamp(p.pitch,-1.24,1.24);camera.fov=clamp(Number.isFinite(v.fov)?v.fov:68,45,90);camera.updateProjectionMatrix();if(v.scheme)scheme(v.scheme);mood(v.timeOfDay||(v.night?'evening':'day'));request();return true;}
let currentScheme='original';const originalColours=new Map();for(const m of materials)if(m.color)originalColours.set(m,m.color.clone());
function scheme(id){const options={original:null,walnut:{wood:'#aa8068',plaster:'#eee5d5',tile:'#e2d7c7'},cool:{wood:'#c4b7a4',plaster:'#e1e7eb',tile:'#ced4d8'}};if(!(id in options))return;currentScheme=id;originalColours.forEach((c,m)=>m.color.copy(c));const o=options[id];if(o){for(const [k,v] of Object.entries(o))M[k].color.set(v);suite.M.wall.color.set(o.plaster);suite.M.floor.color.set(o.tile);suite.M.deck.color.set(o.tile);suite.M.walnut.color.set(o.wood);}materialPairs.forEach((n,m)=>n.color.copy(m.color));mood(timeOfDay,true);request();}
function capture(){cameraUpdate();renderer.render(scene,camera);const c=document.createElement('canvas');c.width=800;c.height=Math.round(800*canvas.height/canvas.width);c.getContext('2d').drawImage(canvas,0,0,c.width,c.height);return {snapshot:snapshot(),image:c.toDataURL('image/jpeg',.77),room:state().room};}
window.walk={go,navigate,stop,stairs,mood,lockLook,state,nodes,snapshot,restore,capture,scheme,setOverview,setPin:(v)=>{pinMode=!!v;stop();},settings:(v)=>{walkSpeed=clamp(Number(v.speed)||1,.4,1.5);reducedMotion=!!v.reduced;sensitivity=clamp(Number(v.sensitivity)||.0022,.0008,.005);request();},valid,findPath,nearest,xyz,grids,portals,colliders,surface,setQuality,ready:false,
setMode:(mode)=>{setOverview(false);stop();if(document.pointerLockElement)document.exitPointerLock();navigationMode=mode==='walk'?'walk':'view';dispatch('walkmode',navigationMode);request();},
step:(x,y,d=.85)=>{if(navigationMode!=='walk')return;stop();const f=-y,n=Math.max(1,Math.hypot(x,y));stepMotion={x,y,left:d};request();},
setSteer:(x,y)=>{if(navigationMode!=='walk')return;if(route.length)stop();steer={x,y};routeLook=false;request();},
nudgeLook:(x,y)=>{if(navigationMode!=='walk')return;yawTarget+=x;pitchTarget=clamp(pitchTarget+y,-1.24,1.24);routeLook=false;request();},
setJoy:(x,y)=>{if(navigationMode!=='walk')return;if(route.length)stop();stepMotion=null;joy={x,y};dispatch('walkstart',{});request();},
look:(yaw,pitch)=>{yawTarget=yaw;pitchTarget=clamp(pitch,-1.24,1.24);routeLook=false;request();},
inspect:{scene,renderer,camera,root,doors,groundBeds,lightPool,player,request,move,frame,keys,clearLine,STEP,X0,Z0,NX,NZ,SIZE},
place:(id)=>{const n=nodes.find(n=>n.id===id);if(!n)return;const i=nearest(n.l,n.p[0],n.p[2],3);if(i<0)return;stop();Object.assign(player,xyz(i));cameraUpdate();camera.lookAt(new V(...n.t));const e=new THREE.Euler().setFromQuaternion(camera.quaternion,'YXZ');yawTarget=player.yaw=e.y;pitchTarget=player.pitch=e.x;request();},
};
renderer.shadowMap.autoUpdate=false;renderer.shadowMap.needsUpdate=true;scene.background=new THREE.Color('#dbe3dc');mood('day',true);resize();walk.place('arrival');ready=true;walk.ready=true;dispatch('walkready',state());document.querySelector('#boot').classList.add('done');
canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();stop();const b=document.querySelector('#boot');b.classList.remove('done');b.querySelector('h1').textContent='The view needs a refresh.';document.querySelector('#bootText').textContent='Your browser paused 3D rendering. Reload to continue.';});

})();