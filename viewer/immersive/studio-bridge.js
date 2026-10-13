(()=>{if(!window.walk){const fail=()=>parent.postMessage({source:'lantern-viewer',event:'unavailable'},location.origin);addEventListener('message',e=>{if(e.origin===location.origin&&e.source===parent&&e.data?.command==='hello')fail();});fail();return;}const emit=(event,data)=>parent.postMessage({source:'lantern-viewer',event,data},location.origin);let lastPinUpdate=0,pins=[],pinLayer=document.createElement('div');pinLayer.id='reviewPins';document.body.append(pinLayer);
function updatePins(){if(performance.now()-lastPinUpdate<250)return;lastPinUpdate=performance.now();const s=walk.state(),camera=walk.inspect.camera;pinLayer.replaceChildren();if(s.overview)return;for(const pin of pins.slice(0,80)){if(!pin.point||pin.point.length!==3)continue;const q=new THREE.Vector3(...pin.point),eye=camera.position,distance=q.distanceTo(eye);if(distance>35)continue;const projected=q.clone().project(camera);if(projected.z<0||projected.z>1||Math.abs(projected.x)>1||Math.abs(projected.y)>1)continue;const ray=new THREE.Raycaster(eye,q.clone().sub(eye).normalize());const hit=ray.intersectObject(walk.inspect.root,true).find(h=>h.object.visible&&(!h.object.material.transparent||h.object.material.opacity>.3));if(hit&&hit.distance<distance-.35)continue;const b=document.createElement('button');b.className='reviewPin';b.textContent='●';b.title=pin.title;b.setAttribute('aria-label','Open note: '+pin.title);b.style.left=(projected.x*.5+.5)*100+'%';b.style.top=(-projected.y*.5+.5)*100+'%';b.onclick=()=>emit('pin-open',pin.id);pinLayer.append(b);}}
document.addEventListener('walkupdate',e=>{emit('state',{room:e.detail.room,floor:e.detail.floor,overview:e.detail.overview,mode:e.detail.navigationMode,timeOfDay:e.detail.timeOfDay,quality:e.detail.quality});updatePins();});
document.addEventListener('walkroute',e=>{if(e.detail.arrived)emit('arrived',e.detail.arrived);});
document.addEventListener('studiopin',e=>{document.body.classList.remove('pinning');emit('pinned',{...walk.capture(),point:e.detail.point});});
addEventListener('message',e=>{if(e.origin!==location.origin||e.source!==parent||e.data?.source!=='lantern-studio')return;const {command,data,id}=e.data;let result=true;try{switch(command){
case 'hello':emit('ready',{nodes:walk.nodes,state:walk.state()});break;
case 'capture':walk.stop();result=walk.capture();break;
case 'restore':result=walk.restore(data);break;
case 'go':walk.setOverview(false);result=walk.go(data);break;
case 'place':walk.setOverview(false);walk.place(data);break;
case 'walk':walk.setMode('walk');document.querySelector('#houseCanvas').focus({preventScroll:true});document.querySelector('#welcome').classList.add('hidden');break;
case 'stop':walk.stop();break;
case 'explore':walk.setMode('view');document.querySelector('#houseCanvas').focus({preventScroll:true});break;
case 'rooms':document.querySelector('#roomButton').click();break;
case 'immersive':document.dispatchEvent(new CustomEvent('walkimmersive',{detail:data}));break;
case 'stairs':walk.stairs();break;
case 'plan':document.querySelector('#mapButton').click();break;
case 'overview':walk.setMode('view');walk.setOverview(data.on,data.level);document.querySelector('#welcome').classList.add('hidden');break;
case 'scheme':walk.scheme(data);break;
case 'pin':walk.setOverview(false);walk.setPin(data);document.body.classList.toggle('pinning',!!data);break;
case 'pins':pins=data;updatePins();break;
case 'settings':walk.settings(data);break;
case 'presentation':document.body.classList.toggle('presenting',!!data);document.querySelector('#welcome').classList.add('hidden');walk.setMode('view');break;
case 'mood':walk.mood(data);break;
case 'quality':walk.setQuality(data);document.querySelector('#qualityButton').textContent='Quality: '+data;break;
}emit('reply',{id,result});}catch(error){emit('reply',{id,error:String(error)});}});
const style=document.createElement('style');style.textContent=`
header,footer,#mini,.location,#welcome{display:none!important}.scrim{opacity:.25}
#walkControls{left:16px;bottom:18px;width:250px;padding:15px;border-radius:12px;max-height:calc(100% - 40px);overflow:auto;box-shadow:0 6px 24px #102d2526}
.controlTitle{gap:5px;font-size:13px}.controlTitle .dot{display:none}.controlTitle #exitWalk{display:none}.controlTitle #minimizeWalk{padding:6px;font-size:12px;text-decoration:none;border:1px solid #ced8cc;border-radius:5px}
.controlHint{font-size:12px;margin:10px 0}.moveGrid{grid-template-rows:repeat(3,36px);gap:4px}.moveGrid button{font-size:11px}.moveGrid button span{font-size:18px}.lookTitle{font-size:11px;margin-top:10px}.lookTitle span{display:none}.lookGrid button{height:36px}.lookGrid small{font-size:10px}#walkFeedback{font-size:11px;margin-bottom:0}
#mouseLookButton{width:100%;padding:9px;margin-bottom:11px;background:#233c32;color:white;border-radius:6px;font-size:13px}
.controls-collapsed #walkControls{display:none!important}#restoreWalk{position:absolute;left:16px;bottom:18px;z-index:15;width:auto;padding:10px 13px;border:1px solid #fff9;border-radius:24px;background:#fafbf9ed;color:#233c32;font-size:13px;box-shadow:0 2px 12px #0002}
#reviewPins{position:absolute;inset:0;pointer-events:none;z-index:5}.reviewPin{position:absolute;transform:translate(-50%,-50%);border:3px solid white;border-radius:50%;width:30px;height:30px;background:#af6b34;color:white;pointer-events:auto;box-shadow:0 2px 12px #0005}
.pinning #houseCanvas{cursor:crosshair}.presenting #walkControls,.presenting #restoreWalk,.presenting #routeStatus{display:none!important}#routeStatus{top:16px;max-width:calc(100vw - 32px);font-size:13px}#toast{bottom:20px;font-size:13px;z-index:20}#crosshair{display:none}body[data-navigation=walk] #crosshair{display:block}
dialog{border-radius:12px;max-height:calc(100dvh - 24px)}.roomItem b{font-size:15px}.roomItem small,.muted,details,dl{font-size:13px}.tabs button{font-size:13px}.roomItem .arrow{display:none}
@media(max-height:500px){#walkControls{width:236px;max-height:calc(100% - 24px);bottom:12px}.lookGrid,.lookTitle,#walkFeedback{display:none}.moveGrid{grid-template-rows:repeat(3,32px)}}
@media(max-width:700px){#walkControls{left:12px;bottom:12px;width:238px;max-height:calc(100% - 24px)}#restoreWalk{left:12px;bottom:12px}#routeStatus{top:12px}#toast{bottom:62px}.controlTitle b{font-size:13px}}
`;document.head.append(style);
emit('ready',{nodes:walk.nodes,state:walk.state()});
})();
