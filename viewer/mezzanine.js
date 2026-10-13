function createMezzanine(parent,maxAniso){
const scene=parent,V=THREE.Vector3;
/* Room constants (feet). x: north(0) to south(35.5). z: lobby/east(0) to road/west(19). */
const RX=35.5,RZ=19,CH=16.5,MU=8,MT=8.75,ME=23.5,ARMX=13.33,ARMZ=12.5,PT=1/3;
let seed=31;
function rand(){seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;}
function lin(h){return new THREE.Color(h).convertSRGBToLinear();}
function mkCanvas(w,h,draw){const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);return c;}
function tex(c,rx,ry,srgb){const t=new THREE.CanvasTexture(c);t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(rx||1,ry||1);if(srgb!==false)t.encoding=THREE.sRGBEncoding;t.anisotropy=maxAniso;return t;}
function rep(t,rx,ry){const n=t.clone();n.needsUpdate=true;n.repeat.set(rx,ry);return n;}
function mat(hex,o){const m=new THREE.MeshStandardMaterial(Object.assign({roughness:.8,metalness:0},o||{}));m.color=lin(hex);return m;}

/* ---------- Procedural textures ---------- */
const plankC=mkCanvas(512,512,g=>{
  for(let r=0;r<8;r++){let x=-rand()*240;
    while(x<512){const len=200+rand()*220,l=58+rand()*8,h=31+rand()*4;
      g.fillStyle='hsl('+h+',33%,'+l+'%)';g.fillRect(x,r*64,len,64);
      for(let k=0;k<9;k++){g.fillStyle='rgba(90,58,32,'+(.03+rand()*.07)+')';g.fillRect(x,r*64+rand()*64,len,.8+rand()*1.6);}
      g.fillStyle='rgba(60,40,24,.4)';g.fillRect(x,r*64,1.5,64);x+=len;}
    g.fillStyle='rgba(60,40,24,.45)';g.fillRect(0,r*64,512,1.4);}
});
const plankBump=mkCanvas(512,512,g=>{g.fillStyle='#fff';g.fillRect(0,0,512,512);g.fillStyle='#777';for(let r=0;r<=8;r++)g.fillRect(0,r*64-1,512,2);});
const brickC=mkCanvas(512,512,g=>{
  g.fillStyle='#A99C89';g.fillRect(0,0,512,512);
  const pal=['#88654F','#9B7257','#8C604A','#A17D65','#967059','#7F5E4A','#A07B62'];
  for(let r=0;r<16;r++){const off=(r%2)*48;
    for(let x=-off;x<512;x+=96){g.fillStyle=pal[(rand()*pal.length)|0];g.fillRect(x+1.5,r*32+1.5,93,29);
      for(let k=0;k<40;k++){g.fillStyle='rgba('+(rand()<.5?'40,20,10':'220,170,140')+','+(rand()*.12)+')';g.fillRect(x+3+rand()*88,r*32+3+rand()*24,2+rand()*4,1+rand()*2);}}}
});
const brickB=mkCanvas(512,512,g=>{g.fillStyle='#333';g.fillRect(0,0,512,512);g.fillStyle='#EEE';
  for(let r=0;r<16;r++){const off=(r%2)*48;for(let x=-off;x<512;x+=96)g.fillRect(x+1.5,r*32+1.5,93,29);}});
const woodC=mkCanvas(512,256,g=>{
  g.fillStyle='#5E3F2B';g.fillRect(0,0,512,256);
  for(let i=0;i<140;i++){const y=rand()*256,a=.04+rand()*.1;g.strokeStyle=(rand()<.5?'rgba(30,18,10,':'rgba(140,95,60,')+a+')';g.lineWidth=.6+rand()*2;
    g.beginPath();g.moveTo(0,y);for(let x=0;x<=512;x+=32)g.lineTo(x,y+Math.sin(x/60+i)*2.5*rand());g.stroke();}
});
const fabricC=mkCanvas(256,256,g=>{g.fillStyle='#E9E6E0';g.fillRect(0,0,256,256);
  for(let i=0;i<256;i+=2){g.fillStyle='rgba(0,0,0,'+(.02+rand()*.03)+')';g.fillRect(0,i,256,1);g.fillRect(i,0,1,256);}
  for(let i=0;i<3000;i++){g.fillStyle='rgba(255,255,255,'+(rand()*.1)+')';g.fillRect(rand()*256,rand()*256,1,1);}});
const tileC=mkCanvas(512,512,g=>{g.fillStyle='#ECEAE6';g.fillRect(0,0,512,512);
  for(let i=0;i<2600;i++){g.fillStyle='rgba(120,112,100,'+(rand()*.1)+')';g.fillRect(rand()*512,rand()*512,1+rand()*2,1+rand()*2);}
  g.fillStyle='#B9B4AC';g.fillRect(0,0,512,4);g.fillRect(0,254,512,4);g.fillRect(0,0,4,512);g.fillRect(254,0,4,512);});
const plasterC=mkCanvas(512,512,g=>{
  g.fillStyle='#EEEAE3';g.fillRect(0,0,512,512);
  for(let i=0;i<9000;i++){const v=235+((rand()*20)|0);g.fillStyle='rgba('+v+','+(v-2)+','+(v-7)+','+(0.018+rand()*.045)+')';const x=rand()*512,y=rand()*512,s=1+rand()*3;g.fillRect(x,y,s,s);}
});
const plasterB=mkCanvas(512,512,g=>{
  g.fillStyle='#808080';g.fillRect(0,0,512,512);
  for(let i=0;i<6000;i++){const v=95+((rand()*70)|0);g.fillStyle='rgb('+v+','+v+','+v+')';const x=rand()*512,y=rand()*512,s=1+rand()*2;g.fillRect(x,y,s,s);}
});
const stoneC=mkCanvas(512,512,g=>{
  g.fillStyle='#D4CEC4';g.fillRect(0,0,512,512);
  for(let i=0;i<1800;i++){const v=115+((rand()*90)|0);g.fillStyle='rgba('+v+','+(v-2)+','+(v-6)+','+(0.025+rand()*.05)+')';const x=rand()*512,y=rand()*512,s=1+rand()*3;g.fillRect(x,y,s,s);}
  g.strokeStyle='rgba(95,86,74,.16)';g.lineWidth=1;
  for(let i=0;i<15;i++){g.beginPath();let y=rand()*512;g.moveTo(0,y);for(let x=0;x<=512;x+=64)g.lineTo(x,y+(rand()-.5)*10);g.stroke();}
});
const stoneB=mkCanvas(512,512,g=>{g.fillStyle='#808080';g.fillRect(0,0,512,512);for(let i=0;i<1200;i++){const v=105+((rand()*55)|0);g.fillStyle='rgb('+v+','+v+','+v+')';g.fillRect(rand()*512,rand()*512,1+rand()*3,1+rand()*2);}});
const rugC=mkCanvas(512,512,g=>{g.fillStyle='#FFFFFF';g.fillRect(0,0,512,512);
  for(let i=0;i<512;i+=6){g.fillStyle='rgba(0,0,0,'+(.03+rand()*.04)+')';g.fillRect(0,i,512,3);}
  g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=14;g.strokeRect(30,30,452,452);g.lineWidth=4;g.strokeRect(58,58,396,396);});
const jaaliC=mkCanvas(256,256,g=>{g.fillStyle='#FFF';g.fillRect(0,0,256,256);g.fillStyle='#000';
  for(let y=0;y<4;y++)for(let x=0;x<4;x++){const cx=x*64+32,cy=y*64+32;
    g.beginPath();g.arc(cx-12,cy,11,0,7);g.arc(cx+12,cy,11,0,7);g.fill();g.beginPath();g.arc(cx,cy-12,11,0,7);g.arc(cx,cy+12,11,0,7);g.fill();}});

const T={
  floor:tex(plankC,RX/4,RZ/4),floorB:tex(plankBump,RX/4,RZ/4,false),plaster:tex(plasterC,3.2,3.2),plasterB:tex(plasterB,3.2,3.2,false),stoneTex:tex(stoneC,1.2,1.2),stoneB:tex(stoneB,1.2,1.2,false),
  deck:tex(plankC,(RX-ARMX)/4,RZ/4),deckB:tex(plankBump,(RX-ARMX)/4,RZ/4,false),
  brick:tex(brickC,1,1),brickB:tex(brickB,1,1,false),
  wood:tex(woodC,1,1),fabric:tex(fabricC,3,3),tile:tex(tileC,1,1),rug:tex(rugC,1,1),jaali:tex(jaaliC,1,1,false)
};
function brickMat(w,h){return new THREE.MeshStandardMaterial({map:rep(T.brick,w/4,h/4),bumpMap:rep(T.brickB,w/4,h/4),bumpScale:.035,roughness:.92});}
function tileMat(w,h,hex){const m=new THREE.MeshStandardMaterial({map:rep(T.tile,w/4,h/4),roughness:.28});m.color=lin(hex);return m;}
function fab(hex,rough){const m=new THREE.MeshStandardMaterial({map:T.fabric,roughness:rough||.95});m.color=lin(hex);return m;}

const M={
  wall:new THREE.MeshStandardMaterial({map:T.plaster,bumpMap:T.plasterB,bumpScale:.018,roughness:.9}),ceil:new THREE.MeshStandardMaterial({map:rep(T.plaster,2,2),bumpMap:rep(T.plasterB,2,2),bumpScale:.012,roughness:.94}),
  floor:new THREE.MeshStandardMaterial({map:T.floor,bumpMap:T.floorB,bumpScale:.018,roughness:.46}),
  deck:new THREE.MeshStandardMaterial({map:T.deck,bumpMap:T.deckB,bumpScale:.018,roughness:.44}),
  walnut:new THREE.MeshPhysicalMaterial({map:T.wood,roughness:.38,metalness:.02,clearcoat:.08,clearcoatRoughness:.34}),walnutDark:new THREE.MeshPhysicalMaterial({color:lin('#3A2719'),roughness:.46,clearcoat:.06,clearcoatRoughness:.36}),
  steel:mat('#1F2122',{roughness:.38,metalness:.6}),frame:mat('#1C1E1F',{roughness:.35,metalness:.5}),
  sofa:fab('#CDBFAA'),linen:fab('#ECE7DD'),duvet:fab('#DDD4C6'),head:fab('#8E7F6D'),rust:fab('#A5532F'),olive:fab('#7C7F55'),
  leather:mat('#7A4A2A',{roughness:.5}),leatherDark:mat('#2A2421',{roughness:.5}),
  brass:new THREE.MeshPhysicalMaterial({color:lin('#B08A3E'),roughness:.2,metalness:.94,clearcoat:.08}),white:new THREE.MeshPhysicalMaterial({color:lin('#F6F4F0'),roughness:.18,clearcoat:.12,clearcoatRoughness:.25}),stone:new THREE.MeshStandardMaterial({map:T.stoneTex,bumpMap:T.stoneB,bumpScale:.025,roughness:.36,metalness:0}),
  tv:mat('#0F1111',{roughness:.2,metalness:.3}),mirror:mat('#DCE1E2',{roughness:.03,metalness:.97}),shade:fab('#EFE6D6',.9),
  plant:mat('#4C6A42',{roughness:.8}),plant2:mat('#5E7E4F',{roughness:.8}),pot:mat('#A45A3C',{roughness:.85}),soil:mat('#3A2E24',{roughness:1}),
  rug:new THREE.MeshStandardMaterial({map:T.rug,roughness:1}),rug2:new THREE.MeshStandardMaterial({map:T.rug,roughness:1})
};
M.rug.color=lin('#C9B08A');M.rug2.color=lin('#DCD2C2');
M.sofa.roughness=.88;M.linen.roughness=.94;M.duvet.roughness=.92;M.head.roughness=.9;M.rust.roughness=.82;M.olive.roughness=.82;M.leather.roughness=.42;M.leatherDark.roughness=.38;
const jaaliMat=new THREE.MeshStandardMaterial({map:rep(T.wood,1,3),alphaMap:rep(T.jaali,3.5/1.4,7.8/1.4),alphaTest:.5,side:THREE.DoubleSide,roughness:.55});
const glass=new THREE.MeshPhysicalMaterial({color:lin('#D7E7E8'),transparent:true,opacity:.12,roughness:.02,metalness:.0,transmission:.55,ior:1.46,thickness:.06,depthWrite:false});
const curtainMat=new THREE.MeshStandardMaterial({color:lin('#E6DFC9'),map:T.fabric,bumpMap:T.fabric,bumpScale:.012,roughness:.96,side:THREE.DoubleSide});
const glowWarm=new THREE.MeshStandardMaterial({color:lin('#FFF1D8'),emissive:lin('#FFC784'),emissiveIntensity:.45});
const globeMat=new THREE.MeshStandardMaterial({color:lin('#F6ECDA'),emissive:lin('#FFD7A0'),emissiveIntensity:.3,roughness:.25});
const downMat=new THREE.MeshStandardMaterial({color:lin('#FFFFFF'),emissive:lin('#FFF1DC'),emissiveIntensity:.4});
const ghostMat=new THREE.MeshBasicMaterial({colorWrite:false,depthWrite:false});

/* ---------- Geometry helpers ---------- */
function B(x0,x1,y0,y1,z0,z1,m,p,cast){
  const me=new THREE.Mesh(new THREE.BoxGeometry(x1-x0,y1-y0,z1-z0),m);
  me.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);me.castShadow=cast!==false;me.receiveShadow=true;(p||scene).add(me);return me;
}
const softCache={};
function softGeo(w,h,d,r){
  const key=[w,h,d,r].map(v=>v.toFixed(3)).join('|');if(softCache[key])return softCache[key];
  const b=Math.min(r,w/2-.01,h/2-.01,d/2-.01),iw=w-2*b,ih=h-2*b,cr=Math.min(r*.6,iw/2-.001,ih/2-.001);
  const s=new THREE.Shape(),x=-iw/2,y=-ih/2;
  if(cr>.002){s.moveTo(x+cr,y);s.lineTo(x+iw-cr,y);s.quadraticCurveTo(x+iw,y,x+iw,y+cr);s.lineTo(x+iw,y+ih-cr);s.quadraticCurveTo(x+iw,y+ih,x+iw-cr,y+ih);s.lineTo(x+cr,y+ih);s.quadraticCurveTo(x,y+ih,x,y+ih-cr);s.lineTo(x,y+cr);s.quadraticCurveTo(x,y,x+cr,y);}
  else{s.moveTo(x,y);s.lineTo(x+iw,y);s.lineTo(x+iw,y+ih);s.lineTo(x,y+ih);s.lineTo(x,y);}
  const g=new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b,bevelSegments:7,curveSegments:8});
  g.translate(0,0,-(d-2*b)/2);g.computeVertexNormals();softCache[key]=g;return g;
}
function S(x0,x1,y0,y1,z0,z1,m,r,p,cast){
  const me=new THREE.Mesh(softGeo(x1-x0,y1-y0,z1-z0,r||.12),m);
  me.position.set((x0+x1)/2,(y0+y1)/2,(z0+z1)/2);me.castShadow=cast!==false;me.receiveShadow=true;(p||scene).add(me);return me;
}
function CY(r,h,x,y0,z,m,p,rTop,cast,seg){
  const me=new THREE.Mesh(new THREE.CylinderGeometry(rTop===undefined?r:rTop,r,h,seg||32),m);
  me.position.set(x,y0+h/2,z);me.castShadow=cast!==false;me.receiveShadow=true;(p||scene).add(me);return me;
}
function SP(r,x,y,z,m,p,sx,sy,sz){const me=new THREE.Mesh(new THREE.SphereGeometry(r,32,20),m);me.position.set(x,y,z);if(sx)me.scale.set(sx,sy,sz);me.castShadow=true;me.receiveShadow=true;(p||scene).add(me);return me;}
function RB(axis,r0,r1,y0,y1,d0,d1,m,p,cast){return axis==='x'?B(r0,r1,y0,y1,d0,d1,m,p,cast):B(d0,d1,y0,y1,r0,r1,m,p,cast);}

/* ---------- Books ---------- */
const palette=['#7A3B2E','#2F4A5A','#8A7A4E','#3F5E47','#B9A889','#5C4A6B','#A6582F','#D9CDB4','#2C2F33','#6E7F86','#9E3F3A','#C7A85A','#E4DCCB','#4B5D6B','#1F3A33','#8C5A3C','#C9C2B3'].map(lin);
function fillBooks(axis,a0,a1,yb,maxH,d0,d1,wallSide,arr){
  const depth=Math.min(.72,(d1-d0)-.22);let a=a0;
  while(a<a1){const t=.075+rand()*.1;if(a+t>a1)break;
    if(rand()<.045){a+=.3+rand()*.5;continue;}
    const h=maxH*(.66+rand()*.34),dd=depth*(.82+rand()*.18),c=palette[(rand()*palette.length)|0];
    const dc=wallSide==='max'?d1-.08-dd/2:d0+.08+dd/2;
    if(axis==='x')arr.push({x:a+t/2,y:yb+h/2,z:dc,sx:t*.95,sy:h,sz:dd,c});else arr.push({x:dc,y:yb+h/2,z:a+t/2,sx:dd,sy:h,sz:t*.95,c});
    a+=t;}
}
function shelves(axis,r0,r1,y0,y1,d0,d1,wallSide,rowH,p,arr,base){
  base=base||0;const t=.07;
  if(wallSide==='max')RB(axis,r0,r1,y0,y1,d1-.05,d1,M.walnutDark,p);else RB(axis,r0,r1,y0,y1,d0,d0+.05,M.walnutDark,p);
  let ys=y0;if(base>0){RB(axis,r0,r1,y0,y0+base,d0,d1,M.walnut,p);ys=y0+base;}
  const rows=[];for(let y=ys;y<=y1-rowH*.6;y+=rowH){RB(axis,r0,r1,y,y+t,d0,d1,M.walnut,p);rows.push(y+t);}
  RB(axis,r0,r1,y1-t,y1,d0,d1,M.walnut,p);
  const n=Math.max(1,Math.round((r1-r0)/3)),step=(r1-r0)/n;
  for(let i=0;i<=n;i++){const r=r0+i*step;RB(axis,Math.max(r0,r-.04),Math.min(r1,r+.04),y0,y1,d0,d1,M.walnut,p);}
  rows.forEach(yb=>{const room=Math.min(rowH-t-.1,.98);if(yb+.5>y1-t)return;for(let i=0;i<n;i++)fillBooks(axis,r0+i*step+.07,r0+(i+1)*step-.07,yb,room,d0,d1,wallSide,arr);});
}
let bookCount=0;
function makeBooks(arr,p){
  if(!arr.length)return;
  const im=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.8}),arr.length);
  const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),ps=new V(),sc=new V();
  arr.forEach((b,i)=>{ps.set(b.x,b.y,b.z);sc.set(b.sx,b.sy,b.sz);m4.compose(ps,q,sc);im.setMatrixAt(i,m4);im.setColorAt(i,b.c);});
  im.instanceMatrix.needsUpdate=true;if(im.instanceColor)im.instanceColor.needsUpdate=true;im.receiveShadow=true;p.add(im);bookCount+=arr.length;
}
function pendant(x,y,z,r,top,p){CY(.012,top-y,x,y,z,M.steel,p,undefined,false,6);CY(.09,.1,x,y+r*.8,z,M.brass,p,undefined,false);const g=SP(r,x,y,z,globeMat,p);g.castShadow=false;}
function plant(x,z,tall,y0,p){
  y0=y0||0;p=p||scene;CY(.46,tall?1.25:.85,x,y0,z,M.pot,p,.56);CY(.49,.04,x,y0+(tall?1.21:.81),z,M.soil,p);
  const H=tall?5.6:2.65;CY(.035,H-.7,x,y0+.7,z,M.walnutDark,p,undefined,true,8);
  for(let i=0;i<(tall?30:19);i++){
    const a=i*2.3999,h=.9+(H-.9)*(i/(tall?30:19)),r=(tall?1.12:.68)*(1-.43*h/H);
    const leaf=new THREE.Mesh(new THREE.SphereGeometry(1,12,8),i%3?M.plant:M.plant2);
    leaf.scale.set(tall?.48:.32,.028,tall?.19:.14);leaf.position.set(x+Math.cos(a)*r,y0+h,z+Math.sin(a)*r);leaf.rotation.set(.25*Math.cos(a),-a,-.45);leaf.castShadow=true;p.add(leaf);
    const end=new V(leaf.position.x,leaf.position.y,leaf.position.z),base=new V(x,y0+h-.18,z),delta=end.clone().sub(base);
    const stem=new THREE.Mesh(new THREE.CylinderGeometry(.012,.016,delta.length(),5),M.plant);stem.position.copy(base.add(end).multiplyScalar(.5));stem.quaternion.setFromUnitVectors(new V(0,1,0),delta.normalize());p.add(stem);
  }
}

/* ---------- Groups ---------- */
const walls={east:new THREE.Group(),west:new THREE.Group(),north:new THREE.Group(),south:new THREE.Group()};
Object.values(walls).forEach(g=>scene.add(g));
const ceiling=new THREE.Group();scene.add(ceiling);
const up=new THREE.Group();scene.add(up);
const upE=new THREE.Group(),upW=new THREE.Group(),upS=new THREE.Group();walls.east.add(upE);walls.west.add(upW);walls.south.add(upS);

/* ---------- Floor + roof ---------- */
const floor=new THREE.Mesh(new THREE.PlaneGeometry(RX,RZ),M.floor);floor.rotation.x=-Math.PI/2;floor.position.set(RX/2,0,RZ/2);floor.receiveShadow=true;scene.add(floor);
B(-.75,RX+.75,CH,CH+.5,-.75,RZ+.75,M.ceil,ceiling);
[[3.5,4],[8.5,4],[3.5,16],[8.5,16],[15.5,3.5],[21,3.5],[17,7.5],[27,5],[32,5],[27,13],[32,13],[18,16.5]].forEach(p=>CY(.22,.04,p[0],CH-.04,p[1],downMat,ceiling,undefined,false));
[[5.5,12.3,11,.6],[4.6,13.3,10.2,.46],[6.5,13.7,11.8,.48],[5.9,14.5,10.3,.36],[4.9,11.8,11.9,.4],[6.6,12.7,10.4,.34]].forEach(g=>pendant(g[0],g[1],g[2],g[3],CH,ceiling));
CY(.6,.08,5.5,CH-.08,11,M.brass,ceiling);

/* ---------- Exterior walls ---------- */
function wallRun(axis,a0,a1,c0,c1,openings,grp,matFn){
  let cur=a0;
  const seg=(s,e,y0,y1)=>{if(e-s<.01||y1-y0<.01)return;const m=matFn?matFn(e-s,y1-y0):M.wall;axis==='x'?B(s,e,y0,y1,c0,c1,m,grp):B(c0,c1,y0,y1,s,e,m,grp);};
  openings.slice().sort((a,b)=>a.s-b.s).forEach(o=>{seg(cur,o.s,0,CH);let y=0;o.holes.forEach(h=>{seg(o.s,o.e,y,h[0]);y=h[1];});seg(o.s,o.e,y,CH);cur=o.e;});
  seg(cur,a1,0,CH);
}
function windowUnit(axis,s,e,sill,top,c0,c1,grp,inner){
  const cm=(c0+c1)/2,f=.12;
  const P=(a0,a1,y0,y1,m)=>axis==='x'?B(a0,a1,y0,y1,cm-.07,cm+.07,m,grp):B(cm-.07,cm+.07,y0,y1,a0,a1,m,grp);
  P(s,e,sill,sill+f,M.frame);P(s,e,top-f,top,M.frame);P(s,s+f,sill,top,M.frame);P(e-f,e,sill,top,M.frame);
  const w=e-s,n=w>4?2:1;for(let i=1;i<=n;i++){const x=s+w*i/(n+1);P(x-.05,x+.05,sill,top,M.frame);}
  if(top-sill>2.5)P(s,e,sill+(top-sill)*.72,sill+(top-sill)*.72+.07,M.frame);
  axis==='x'?B(s,e,sill,top,cm-.015,cm+.015,glass,grp,false):B(cm-.015,cm+.015,sill,top,s,e,glass,grp,false);
  if(sill>.5){const d=inner>cm?1:-1,i0=inner,i1=inner+d*.35;
    axis==='x'?B(s-.15,e+.15,sill-.08,sill,Math.min(i0,i1),Math.max(i0,i1),M.stone,grp):B(Math.min(i0,i1),Math.max(i0,i1),sill-.08,sill,s-.15,e+.15,M.stone,grp);}
}
const OPEN={
  east:[{s:16.25,e:19.75,holes:[[0,7.2]]}],
  west:[{s:3.5,e:10,holes:[[2.5,7.2],[11.25,15.5]]},{s:13.5,e:15.5,holes:[[6,7.5]]},{s:20,e:22,holes:[[6,7.5]]},{s:25.5,e:32,holes:[[2.5,7.2],[11.25,15]]}],
  north:[{s:2.5,e:6.5,holes:[[2.5,7.2],[11.25,15.5]]}],
  south:[{s:2.5,e:6.5,holes:[[2.5,7.2]]}]
};
wallRun('x',-.75,RX+.75,-.75,0,OPEN.east,walls.east);
wallRun('x',-.75,RX+.75,RZ,RZ+.75,OPEN.west,walls.west);
wallRun('z',-.75,RZ+.75,-.75,0,OPEN.north,walls.north,brickMat);
wallRun('z',0,RZ,RX,RX+.75,OPEN.south,walls.south);
OPEN.west.forEach(o=>o.holes.forEach(h=>windowUnit('x',o.s,o.e,h[0],h[1],RZ,RZ+.75,walls.west,RZ)));
OPEN.north.forEach(o=>o.holes.forEach(h=>windowUnit('z',o.s,o.e,h[0],h[1],-.75,0,walls.north,0)));
OPEN.south.forEach(o=>o.holes.forEach(h=>windowUnit('z',o.s,o.e,h[0],h[1],RX,RX+.75,walls.south,RX)));
function curtains(s,e,top){
 B(s-1.25,e+1.25,top+.03,top+.1,18.45,18.55,M.steel,walls.west);
 for(const [a,b] of [[s-1.15,s+.42],[e-.42,e+1.15]]){
  const g=new THREE.PlaneGeometry(b-a,top-.16,48,10),pos=g.attributes.position;
  for(let i=0;i<pos.count;i++){const u=(pos.getX(i)+(b-a)/2)/(b-a);pos.setZ(i,Math.sin(u*Math.PI*12)*.12);}
  g.computeVertexNormals();const m=new THREE.Mesh(g,curtainMat);m.position.set((a+b)/2,(top+.16)/2,18.48);m.castShadow=true;m.receiveShadow=true;walls.west.add(m);
 }
}
curtains(3.5,10,16.1);curtains(25.5,32,7.75);

/* ---------- Mezzanine (main 12 ft + strip over washroom) ---------- */
B(ME,RX,MU,MT-.15,0,RZ,M.ceil,up);const deck1=B(ME,RX,MT-.15,MT,0,RZ,M.deck,up);
B(ARMX,ME,MU,MT-.15,ARMZ,RZ,M.ceil,up);const deck2=B(ARMX,ME,MT-.15,MT,ARMZ,RZ,M.deck,up);
B(ME-.06,ME+.04,MU-.05,MT,0,9.7,M.steel,up);B(ARMX,ME,MU-.05,MT,ARMZ-.06,ARMZ+.04,M.steel,up);B(ARMX-.06,ARMX+.04,MU-.05,MT,ARMZ,RZ,M.steel,up);
function railing(axis,a0,a1,c,p){
  if(axis==='z'){B(c-.03,c+.03,MT,MT+3.5,a0,a1,glass,p,false);B(c-.06,c+.06,MT+3.44,MT+3.56,a0,a1,M.steel,p);B(c-.06,c+.06,MT,MT+.12,a0,a1,M.steel,p);}
  else{B(a0,a1,MT,MT+3.5,c-.03,c+.03,glass,p,false);B(a0,a1,MT+3.44,MT+3.56,c-.06,c+.06,M.steel,p);B(a0,a1,MT,MT+.12,c-.06,c+.06,M.steel,p);}
}
railing('z',0,9.7,ME,up);railing('x',ARMX,ME,ARMZ,up);railing('z',ARMZ,RZ,ARMX,up);
B(ME-.4,ME-.05,MU-.06,MU-.01,.3,9.5,glowWarm,up,false);
[[27,4],[32,4],[29.5,9.5],[26,16.5],[30,15.6],[33,16.8]].forEach(p=>CY(.2,.04,p[0],MU-.04,p[1],downMat,up,undefined,false));

/* ---------- Stair: straight flight on the brick wall ---------- */
const stairG=new THREE.Group();scene.add(stairG);
const RR=MT/15,SD=11.67/14,SX=11.83;
for(let i=1;i<=14;i++){const h=i*RR,x0=SX+(i-1)*SD;S(x0-.02,x0+SD,h-.22,h,9.7,ARMZ,M.walnut,.04,stairG);}
[2,5,8,11,14].forEach(i=>{const h=i*RR,xc=SX+(i-.5)*SD;B(xc-.035,xc+.035,h,h+3.05,9.74,9.8,M.steel,stairG);});
const hr=new THREE.Mesh(new THREE.BoxGeometry(13.22,.08,.08),M.steel);hr.position.set(17.67,7.4,9.77);hr.rotation.z=Math.atan(7.59/10.83);hr.castShadow=true;stairG.add(hr);
B(11.5,23.5-PT,0,MU,ARMZ,ARMZ+PT,brickMat(11.67,8),scene);

/* ---------- Core partitions ---------- */
B(13,ARMX,0,MU,ARMZ+PT,RZ,M.wall);
B(23.5-PT,23.5,0,MU,ARMZ,14.9,M.wall);B(23.5-PT,23.5,0,MU,17.3,RZ,M.wall);B(23.5-PT,23.5,7,MU,14.9,17.3,M.wall);
B(23.5,23.84,0,MU,0,6.2,M.wall);B(23.5,23.84,0,MU,9.7,ARMZ,M.wall);
B(23.5,27.5,0,MU,ARMZ,ARMZ+PT,M.wall);B(31.5,RX,0,MU,ARMZ,ARMZ+PT,M.wall);B(27.5,31.5,7,MU,ARMZ,ARMZ+PT,M.wall);
B(19.67,19.75,0,7.2,.02,3.5,M.walnut);B(19.57,19.67,3.35,3.42,2.9,3.3,M.brass);

/* ---------- Sliding jaali ---------- */
const jaali=new THREE.Group();scene.add(jaali);
B(23.28,23.4,.05,7.85,0,3.5,jaaliMat,jaali,true);B(23.26,23.42,7.85,7.95,-.02,3.52,M.walnutDark,jaali);
B(23.18,23.28,7.9,7.98,2.6,9.8,M.steel);
const jaaliState={z:2.7,target:2.7,open:2.7,closed:6.2};jaali.position.z=jaaliState.z;

/* ---------- Lounge (open double height) ---------- */
S(0,1.6,0,1.5,8.4,14.4,M.walnut,.05);B(1.58,1.6,.25,1.25,8.6,14.2,M.walnutDark);
B(.04,.14,4.1,6.9,9.2,13.6,M.tv);
B(2.5,10.5,.004,.04,6.5,15.5,M.rug,scene,false);
S(7.2,9.8,.35,1.35,7.5,14.5,M.sofa,.15);S(9.1,9.8,1.3,2.9,7.5,14.5,M.sofa,.2);
S(7.2,9.8,1.3,2.25,7.5,8.1,M.sofa,.18);S(7.2,9.8,1.3,2.25,13.9,14.5,M.sofa,.18);
S(7.3,9.15,1.3,1.8,8.1,11,M.sofa,.18);S(7.3,9.15,1.3,1.8,11,13.9,M.sofa,.18);
S(8.6,9.12,1.75,2.7,8.4,9.9,M.rust,.16);S(8.6,9.12,1.75,2.7,12.1,13.6,M.olive,.16);
for(const [x,z] of [[7.35,7.65],[9.65,7.65],[7.35,14.35],[9.65,14.35]])CY(.05,.35,x,0,z,M.walnutDark);
S(3.5,5.5,1.2,1.35,9.5,12.5,M.walnut,.05);B(3.7,5.3,.2,.28,9.7,12.3,M.walnut);
for(const [x,z] of [[3.65,9.65],[5.35,9.65],[3.65,12.35],[5.35,12.35]])B(x-.06,x+.06,0,1.2,z-.06,z+.06,M.steel);
S(4,4.8,1.35,1.55,10.2,11.1,M.rust,.03);CY(.25,.5,5,1.35,11.8,M.white,scene,.2);
CY(.45,1.6,8.5,0,6.8,M.walnut,scene,.45);CY(.04,4.9,8.5,1.6,6.8,M.brass);CY(.5,.7,8.5,6.1,6.8,M.shade,scene,.38);
plant(1.5,17.5,true);plant(10.8,1.4,false);

/* ---------- Washroom (under the strip) ---------- */
B(ARMX,23.5-PT,.004,.03,ARMZ+PT,RZ,tileMat(9.83,6.17,'#B6B0A6'),scene,false);
B(ARMX,23.5-PT,0,6,RZ-.03,RZ,tileMat(9.83,6,'#E2DED7'),walls.west,false);
B(ARMX,ARMX+.04,0,7.3,ARMZ+PT,RZ,tileMat(6.17,7.3,'#E2DED7'),scene,false);
B(23.13,23.5-PT,0,7.3,ARMZ+PT,RZ,tileMat(6.17,7.3,'#E2DED7'),scene,false);
B(ARMX,23.5-PT,0,7.3,ARMZ+PT,ARMZ+PT+.04,tileMat(9.83,7.3,'#E2DED7'),scene,false);
B(ARMX+.04,16.83,.03,.05,ARMZ+PT+.04,RZ-.03,tileMat(3.5,6,'#9B968C'),scene,false);
B(16.83,16.88,.05,7.3,14.4,RZ-.03,glass,scene,false);B(16.8,16.9,7.2,7.3,14.4,RZ-.03,M.steel);
B(14.7,15.6,6.9,6.95,15.3,16.2,M.steel);B(15.1,15.2,6.95,7.3,15.7,15.8,M.steel);
B(ARMX,23.5-PT,7.3,7.4,ARMZ+PT,RZ,M.ceil,up);[[15.2,15.8],[19.5,15.2]].forEach(p=>CY(.18,.04,p[0],7.26,p[1],downMat,up,undefined,false));
S(17.3,20.7,1.6,2.75,17.1,RZ-.03,M.walnut,.04);B(17.28,20.72,2.75,2.82,17.08,RZ-.03,M.stone);
CY(.6,.45,19,2.82,18.1,M.white,scene,.55);CY(.04,.8,19,2.82,18.85,M.brass);B(18.96,19.04,3.55,3.62,18.4,18.85,M.brass);
const mir=new THREE.Mesh(new THREE.CylinderGeometry(1.05,1.05,.04,48),M.mirror);mir.rotation.x=Math.PI/2;mir.position.set(19,5.1,RZ-.07);walls.west.add(mir);
const rim=new THREE.Mesh(new THREE.TorusGeometry(1.08,.05,10,48),M.brass);rim.position.set(19,5.1,RZ-.07);walls.west.add(rim);
S(21.5,22.9,1.0,1.42,17.3,RZ-.03,M.white,.18);B(21.95,22.45,3.2,3.5,RZ-.05,RZ-.03,M.steel);
B(23.08,23.13,4,4.07,17.4,18.8,M.brass);S(23.0,23.1,2.6,4.05,17.6,18.6,M.linen,.02);

/* ---------- Walk-in closet: full-width dressing room between bedroom and washroom ---------- */
B(23.5,27.5,0,7.9,ARMZ+PT,14.84,M.walnut);B(31.5,RX,0,7.9,ARMZ+PT,14.84,M.walnut);B(33.5,RX,0,7.9,14.84,RZ,M.walnut);
for(let x=24.85;x<27.5;x+=1.33)B(x,x+.03,.2,7.8,14.84,14.87,M.walnutDark);
for(let x=32.85;x<35.5;x+=1.33)B(x,x+.03,.2,7.8,14.84,14.87,M.walnutDark);
for(let z=16.2;z<19;z+=1.4)B(33.47,33.5,.2,7.8,z,z+.03,M.walnutDark);
B(23.55,27.45,6.45,6.5,14.84,14.87,M.walnutDark);B(31.55,35.45,6.45,6.5,14.84,14.87,M.walnutDark);B(33.47,33.5,6.45,6.5,14.9,18.95,M.walnutDark);
for(let x=24.2;x<27.5;x+=1.33)B(x+.45,x+.51,2.9,4.9,14.87,14.93,M.brass);
for(let x=32.2;x<35.5;x+=1.33)B(x+.45,x+.51,2.9,4.9,14.87,14.93,M.brass);
for(let z=15.5;z<19;z+=1.4)B(33.41,33.47,2.9,4.9,z+.5,z+.56,M.brass);
S(27.3,31.7,2.35,2.55,17.6,RZ-.05,M.walnut,.03);B(27.4,27.5,0,2.35,17.7,18.9,M.walnut);B(31.5,31.6,0,2.35,17.7,18.9,M.walnut);
S(28.9,30.1,0,1.5,16.5,17.4,M.olive,.12);
B(23.5,23.54,.3,7,17.45,18.85,M.mirror,scene,false);
/* ---------- Bedroom (under mezzanine): bed head on lobby wall, on axis with closet opening ---------- */
S(25.6,33.4,.4,4.9,0,.32,M.head,.08);for(let x=26.6;x<33.4;x+=1)B(x,x+.03,.5,4.8,.32,.35,M.walnutDark);
S(26.5,32.5,0,1.05,.32,6.8,M.walnut,.06);S(26.6,32.4,1.05,1.9,.42,6.7,M.linen,.18);
S(26.55,32.45,1.85,2.08,1.6,6.75,M.duvet,.08);S(26.5,32.5,2.02,2.16,5.3,6.8,M.rust,.05);
S(26.9,29.4,1.85,2.55,.5,1.55,M.white,.22);S(29.6,32.1,1.85,2.55,.5,1.55,M.white,.22);S(28.1,30.9,1.9,2.6,1.5,2.05,M.olive,.2);
S(25.1,26.3,0,1.8,.05,1.35,M.walnut,.05);S(32.7,33.9,0,1.8,.05,1.35,M.walnut,.05);
pendant(25.7,4.4,.75,.32,MU,up);pendant(33.3,4.4,.75,.32,MU,up);
S(27.5,31.5,1.05,1.5,7.3,8.6,M.olive,.1);for(const x of [27.7,31.3])for(const z of [7.5,8.4])CY(.05,1.05,x,0,z,M.walnutDark);
S(33,35.3,.4,1.35,8.7,11.1,M.leather,.15);S(34.7,35.3,1.3,3.1,8.7,11.1,M.leather,.18);S(33,35.3,1.3,2,8.7,9.05,M.leather,.12);S(33,35.3,1.3,2,10.75,11.1,M.leather,.12);
B(25.3,33.7,.004,.04,2.3,9.8,M.rug2,scene,false);
plant(34.6,11.7,false);
/* ---------- Mezzanine furniture ---------- */
const bE=[],bW=[],bS=[];
shelves('x',24.5,RX,MT,CH-.2,0,1.1,'min',1.1,upE,bE,.9);
shelves('z',1.1,17.9,MT,CH-.2,34.4,RX,'max',1.1,upS,bS,.9);
shelves('x',24.5,25.5,MT,CH-.2,17.9,RZ,'max',1.1,upW,bW,.9);
shelves('x',25.5,32,MT,11.1,17.9,RZ,'max',1.1,upW,bW,.9);
shelves('x',32,34.4,MT,CH-.2,17.9,RZ,'max',1.1,upW,bW,.9);
makeBooks(bE,upE);makeBooks(bS,upS);makeBooks(bW,upW);
const rail=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,15.8,12),M.brass);rail.rotation.x=Math.PI/2;rail.position.set(34.25,MT+6.4,9.5);upS.add(rail);
const lad=new THREE.Group();B(-.05,.05,0,6.55,-.75,-.65,M.walnut,lad);B(-.05,.05,0,6.55,.65,.75,M.walnut,lad);for(let y=1;y<6.3;y+=.9)B(-.05,.05,y,y+.07,-.65,.65,M.walnut,lad);
lad.position.set(33.1,MT,10);lad.rotation.z=-.17;upS.add(lad);
B(25,33.5,MT+.004,MT+.04,3,15,M.rug,up,false);
S(25.2,27.7,MT+.4,MT+1.35,3,5.5,M.leather,.15,up);S(25.2,25.8,MT+1.3,MT+3.1,3,5.5,M.leather,.18,up);
S(25.2,27.7,MT+1.3,MT+2,3,3.35,M.leather,.12,up);S(25.2,27.7,MT+1.3,MT+2,5.15,5.5,M.leather,.12,up);
CY(.4,1.7,28.4,MT,6.1,M.walnut,up,.4);CY(.04,4.8,24.9,MT,6.3,M.brass,up);CY(.45,.65,24.9,MT+4.8,6.3,M.shade,up,.34);
S(14.5,21.5,MT+2.35,MT+2.5,12.8,15.05,M.walnut,.03,up);
B(14.65,14.75,MT,MT+2.35,12.9,14.95,M.steel,up);B(21.25,21.35,MT,MT+2.35,12.9,14.95,M.steel,up);
B(16.3,18.1,MT+3.1,MT+4.2,13.25,13.33,M.tv,up);B(18.3,20.1,MT+3.1,MT+4.2,13.25,13.33,M.tv,up);
B(17.15,17.25,MT+2.5,MT+3.15,13.3,13.4,M.steel,up);B(19.15,19.25,MT+2.5,MT+3.15,13.3,13.4,M.steel,up);
B(17.4,19,MT+2.5,MT+2.54,14,14.5,M.steel,up);
CY(.22,.04,15.2,MT+2.5,13.4,M.brass,up);CY(.025,1.3,15.2,MT+2.54,13.4,M.brass,up);CY(.3,.4,15.2,MT+3.8,13.4,glowWarm,up,.18);
S(17.4,18.9,MT+1.45,MT+1.75,15.6,17.1,M.leatherDark,.1,up);S(17.4,18.9,MT+1.75,MT+3.6,16.9,17.1,M.leatherDark,.08,up);
CY(.07,1.45,18.15,MT,16.35,M.steel,up);CY(.75,.08,18.15,MT+.04,16.35,M.steel,up);
plant(21.9,18.2,false,MT,up);

/* ---------- Architectural realism details ---------- */
const trimMat=new THREE.MeshPhysicalMaterial({map:T.wood,roughness:.34,metalness:.02,clearcoat:.12,clearcoatRoughness:.3});
// Recessed downlight bezels.
[[3.5,4],[8.5,4],[3.5,16],[8.5,16],[15.5,3.5],[21,3.5],[17,7.5],[27,5],[32,5],[27,13],[32,13],[18,16.5]].forEach(p=>{
  CY(.13,.018,p[0],CH-.018,p[1],M.frame,ceiling,undefined,false,24);
});
// Small, soft wall washers to lift vertical surfaces.
[[2.8,5.2,2.6],[2.8,12.8,2.6],[26.2,5.4,5.2],[33.2,11.7,4.7]].forEach(a=>{
  const l=new THREE.SpotLight(0xffead2,0.18,14,Math.PI/5,.65,2);l.position.set(a[0],a[1],a[2]);l.target.position.set(a[0]+1,2,a[2]+1);scene.add(l,l.target);
});
// Bed and lounge textiles gain a few soft pillows for scale and lived-in detail.
S(26.9,28.1,1.95,2.45,1.5,2.0,M.linen,.2);S(30.9,32.1,1.95,2.45,1.5,2.0,M.rust,.2);
S(7.65,8.55,1.42,1.95,8.9,9.7,M.linen,.18);S(8.55,9.38,1.42,1.95,12.0,12.8,M.rust,.16);
// Thin picture frames on the main brick wall.
function frameArt(x,y,z,w,h,rotY,matl){const fr=new THREE.Mesh(new THREE.BoxGeometry(w,h,.08),M.walnutDark);fr.position.set(x,y,z);fr.rotation.y=rotY||0;scene.add(fr);const art=new THREE.Mesh(new THREE.PlaneGeometry(w*.87,h*.82),matl||M.rust);art.position.set(x,y,z+(rotY?-.05:.05));art.rotation.y=rotY||0;scene.add(art);}
frameArt(5.5,10.2,-.08,2.2,3.0,0,new THREE.MeshStandardMaterial({color:lin('#CBB9A2'),roughness:.8}));
frameArt(7.9,10.3,-.08,1.7,2.4,0,new THREE.MeshStandardMaterial({color:lin('#6E7F86'),roughness:.8}));

/* ---------- Architectural finish + styling pass ---------- */
const plasterMat2=new THREE.MeshStandardMaterial({map:T.plaster,bumpMap:T.plasterB,bumpScale:.022,roughness:.93,metalness:0});
const trimMat2=mat('#D8D1C7',{roughness:.76});
const linenSheer2=new THREE.MeshStandardMaterial({color:lin('#F4EEE3'),transparent:true,opacity:.48,side:THREE.DoubleSide,roughness:1,depthWrite:false});
const blackSoft=mat('#171818',{roughness:.5,metalness:.32});

function finishBox(x0,x1,y0,y1,z0,z1,m,p){return B(x0,x1,y0,y1,z0,z1,m,p,false);}
// Fine skirting gives the room a finished residential scale.
finishBox(.18,RX-.18,0,.18,RZ-.13,RZ-.03,trimMat2);
finishBox(.18,RX-.18,0,.18,.03,.13,trimMat2);
finishBox(.03,.13,0,.18,.18,RZ-.18,trimMat2);
finishBox(RX-.13,RX-.03,0,.18,.18,RZ-.18,trimMat2);
// Slim ceiling shadow gap / cornice line.
finishBox(.15,RX-.15,CH-.10,CH,.02,.10,trimMat2);
finishBox(.02,.10,CH-.10,CH,.12,RZ-.12,trimMat2);
finishBox(RX-.10,RX-.02,CH-.10,CH,.12,RZ-.12,trimMat2);
// Warm architectural wall wash at the brick transition.
const wallWash2=new THREE.SpotLight(0xffe8cf,.30,18,Math.PI/6,.7,2);
wallWash2.position.set(11.2,11.8,5.6);wallWash2.target.position.set(11.2,4.2,5.8);scene.add(wallWash2,wallWash2.target);
// Minimal art / panel rhythm around the living area.
const panelMat2=mat('#BFB2A2',{roughness:.9});
for(const [x,y,w,h] of [[2.2,7.2,1.5,2.0],[4.05,7.5,1.1,1.55]]) frameArt(x,y,-.11,w,h,0,panelMat2);

/* Material detail and contact grounding */
for(const m of [M.sofa,M.linen,M.duvet,M.head,M.rust,M.olive]){m.bumpMap=T.fabric;m.bumpScale=.016;}
const contactTexture=new THREE.CanvasTexture(mkCanvas(128,128,(g,w,h)=>{const grad=g.createRadialGradient(w/2,h/2,9,w/2,h/2,w/2);grad.addColorStop(0,'rgba(30,24,17,.26)');grad.addColorStop(.55,'rgba(30,24,17,.11)');grad.addColorStop(1,'rgba(30,24,17,0)');g.fillStyle=grad;g.fillRect(0,0,w,h);}));
function contact(x,z,w,d,y,p){const m=new THREE.Mesh(new THREE.PlaneGeometry(w,d),new THREE.MeshBasicMaterial({map:contactTexture,transparent:true,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.set(x,y||.045,z);(p||scene).add(m);}
contact(8.5,11,4.1,8.8);contact(4.5,11,3.3,4.2);contact(29.5,3.8,8.4,8.4);contact(26.4,4.3,3.7,3.8,MT+.05,up);
// An open book and a tray, resting on the existing coffee table.
S(3.8,4.65,1.56,1.58,10.35,10.93,M.linen,.01);S(4.67,5.12,1.35,1.39,9.8,10.3,M.stone,.02);
const seamMat=mat('#B5AB98',{roughness:1});
B(7.28,9.1,1.78,1.792,10.96,11.01,seamMat);
// A continuous stair stringer and wall rail make the proposed stair read as an assembly.
const stringer=new THREE.Mesh(new THREE.BoxGeometry(14.2,.23,.16),M.steel);stringer.position.set(17.7,4.08,11.2);stringer.rotation.z=Math.atan2(MT,11.67);stringer.castShadow=true;stairG.add(stringer);
// Restrained nature print rather than flat colour blocks.
const artTex=new THREE.CanvasTexture(mkCanvas(256,384,(g,w,h)=>{g.fillStyle='#e9e1ce';g.fillRect(0,0,w,h);g.strokeStyle='#69735e';g.lineWidth=3;for(let i=0;i<7;i++){const x=50+i*24;g.beginPath();g.moveTo(125,350);g.quadraticCurveTo(x,190,x,45+i*18);g.stroke();for(let k=0;k<4;k++){g.fillStyle=k%2?'#92987a':'#798468';g.beginPath();g.ellipse(x+(k%2?12:-8),100+k*48,20,8,k%2?.7:-.7,0,Math.PI*2);g.fill();}}}));artTex.encoding=THREE.sRGBEncoding;
const artwork=new THREE.Mesh(new THREE.PlaneGeometry(2,2.8),new THREE.MeshStandardMaterial({map:artTex,roughness:1}));artwork.position.set(5.5,10.2,.025);scene.add(artwork);


return {walls,ceiling,up,upE,upW,upS,jaali,M,glowWarm,globeMat,downMat};
}
