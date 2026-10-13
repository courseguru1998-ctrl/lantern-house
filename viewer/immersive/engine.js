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
