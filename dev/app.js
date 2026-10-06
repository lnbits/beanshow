import * as THREE from 'three';
import {PALETTE} from './catalog.js';
import {fruitCanvas} from './fruit.js';
import {ROUNDS,FRUITS,DT,makeShow,beginRound,step,advanceShow,movingObstacle,blockWalls,floorAt,sectorSafe,matchPhase,crownHeight} from './sim.js';
const $=id=>document.getElementById(id), canvas=$('view');
let renderer;
try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:false});}catch{$('game-error').hidden=false;$('game-error').textContent='This game needs WebGL. Try a browser with hardware acceleration enabled.';throw Error('WebGL unavailable');}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
const scene=new THREE.Scene();scene.background=new THREE.Color('#b5eff4');scene.fog=new THREE.Fog('#b5eff4',85,190);
const camera=new THREE.PerspectiveCamera(52,1,.1,260);scene.add(new THREE.HemisphereLight('#ffffff','#8c86ce',2.3));
const sun=new THREE.DirectionalLight('#fff9df',3.1);sun.position.set(-20,40,-20);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-32,right:32,top:40,bottom:-30,near:1,far:100});sun.shadow.bias=-.0003;sun.shadow.normalBias=.035;scene.add(sun,sun.target);
let world=new THREE.Group();scene.add(world);let beans=new Map(),obstacleMeshes=[],tileMeshes=[],seesawMeshes=[],sectorMeshes=[],wallGroup=null,crown=null,slimeMesh=null,hero=null,confetti=[],playerMarker=null,state=null,show=null,phase='menu',colour=0,practice=false,paused=false,count=0,callback=()=>{},accumulator=0,lastTime=0,uiClock=0,ready=false,joystick={x:0,z:0},spectateId=0;
const keys=new Set(),touchKeys=new Set(),pressed=new Set();
const fruitImages=FRUITS.map((_,i)=>fruitCanvas(i).toDataURL()),fruitMaterials=FRUITS.map((_,i)=>{const texture=new THREE.CanvasTexture(fruitCanvas(i));texture.colorSpace=THREE.SRGBColorSpace;return new THREE.MeshBasicMaterial({map:texture,toneMapped:false});});
let matchHudKey='',matchAudioKey='';
function material(color,roughness=.36){return new THREE.MeshStandardMaterial({color,roughness,metalness:.03});}
const materials=new Map();function mat(color,roughness=.36){const key=color+roughness;if(!materials.has(key))materials.set(key,material(color,roughness));return materials.get(key);}
function mesh(geometry,color,parent=world){const m=new THREE.Mesh(geometry,mat(color));m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
function box(x,y,z,w,h,d,color,parent=world){const m=mesh(new THREE.BoxGeometry(w,h,d),color,parent);m.position.set(x,y,z);return m;}
function sphere(x,y,z,r,color,parent=world){const m=mesh(new THREE.SphereGeometry(r,20,14),color,parent);m.position.set(x,y,z);return m;}
function cylinder(x,y,z,r,h,color,parent=world,sides=32){const m=mesh(new THREE.CylinderGeometry(r,r,h,sides),color,parent);m.position.set(x,y,z);return m;}
function label(text,color='#293957',background='#ffffff',size=1,parent=world){const c=document.createElement('canvas');c.width=512;c.height=128;const ctx=c.getContext('2d');ctx.fillStyle=background;ctx.beginPath();ctx.roundRect(0,0,512,128,40);ctx.fill();ctx.fillStyle=color;ctx.font='900 58px Trebuchet MS';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(text,256,67,475);const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,toneMapped:false,depthTest:false}));sprite.scale.set(size*4,size,1);sprite.userData.texture=texture;parent.add(sprite);return sprite;}
function aimSun(z=0,race=false){
 // ponytail: fixed course-wide shadow frustum avoids camera-follow shimmer; cascades only if maps grow.
 sun.position.set(-20,45,z-25);sun.target.position.set(0,0,z);
 const extent=race?82:36;Object.assign(sun.shadow.camera,{left:-extent,right:extent,top:extent,bottom:-extent,far:180});sun.shadow.camera.updateProjectionMatrix();
}
function makePlayerMarker(){
 const c=document.createElement('canvas');c.width=128;c.height=192;const ctx=c.getContext('2d');
 ctx.fillStyle='#263057';ctx.strokeStyle='#ffffff';ctx.lineWidth=8;ctx.beginPath();ctx.roundRect(6,6,116,65,20);ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff';ctx.font='900 36px Trebuchet MS';ctx.textAlign='center';ctx.fillText('YOU',64,51);
 ctx.beginPath();ctx.moveTo(18,91);ctx.lineTo(110,91);ctx.lineTo(64,178);ctx.closePath();ctx.fillStyle='#ffdc4d';ctx.lineJoin='round';ctx.lineWidth=15;ctx.stroke();ctx.fill();ctx.strokeStyle='#263057';ctx.lineWidth=4;ctx.stroke();
 const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,toneMapped:false,depthTest:false,depthWrite:false,sizeAttenuation:false,fog:false}));sprite.scale.set(.05,.075,1);sprite.center.set(.5,0);sprite.renderOrder=1000;sprite.userData.texture=texture;world.add(sprite);return sprite;
}
function makeBean(color,id,parent=world){
 const g=new THREE.Group();parent.add(g);const body=mesh(new THREE.CapsuleGeometry(.58,.7,8,20),color,g);body.position.y=1.13;body.material=mat(color,.16);
 const face=sphere(0,1.34,.49,.49,'#fffdf3',g);face.scale.set(.87,.9,.22);
 for(const x of [-.17,.17]){const eye=sphere(x,1.37,.6,.08,'#293044',g);eye.scale.y=1.5;}
 const arms=[];for(const sign of [-1,1]){const arm=mesh(new THREE.CapsuleGeometry(.17,.45,4,10),color,g);arm.position.set(sign*.67,1.1,.05);arm.rotation.z=sign*.65;arms.push(arm);sphere(sign*.24,.18,.16,.24,color,g);}
 const shadow=mesh(new THREE.CircleGeometry(.66,20),'#6679a8',g);shadow.rotation.x=-Math.PI/2;shadow.position.y=.025;shadow.material=new THREE.MeshBasicMaterial({color:'#546491',transparent:true,opacity:.18,depthWrite:false});
 g.traverse(m=>{if(m.isMesh&&m!==body)m.castShadow=false;});g.userData={arms,body,shadow,id};return g;
}
function makeCrown(parent=world){const g=new THREE.Group();parent.add(g);cylinder(0,0,0,.9,.35,'#ffc62f',g);for(let i=0;i<6;i++){const a=i*Math.PI/3;const point=mesh(new THREE.ConeGeometry(.25,.9,4),'#ffe252',g);point.position.set(Math.cos(a)*.72,.45,Math.sin(a)*.72);sphere(Math.cos(a)*.72,.94,Math.sin(a)*.72,.12,'#fff182',g);}const jewel=sphere(0,.05,.92,.15,'#ff4f9e',g);return g;}
function disposeWorld(){scene.remove(world);world.traverse(o=>{o.geometry?.dispose();o.userData.texture?.dispose();if(o.material?.map&&!fruitMaterials.includes(o.material))o.material.map.dispose();});world=new THREE.Group();scene.add(world);beans.clear();obstacleMeshes=[];tileMeshes=[];seesawMeshes=[];sectorMeshes=[];hero=null;playerMarker=null;confetti=[];}
function scenery(length=0){
 slimeMesh=box(0,-5,length/2,240,1,240,'#f583d1');slimeMesh.material=mat('#f583d1',.15);
 for(let i=0;i<14;i++){const x=(i%2?1:-1)*(28+i%4*8),z=i*11-20;const cloud=new THREE.Group();world.add(cloud);for(let j=0;j<3;j++){const puff=sphere(x+j*2,9+(i%3)*3,z,2.8,'#ffffff',cloud);puff.castShadow=false;}
  if(i%3===0){sphere(x,17,z,2.6,PALETTE[i%6]);cylinder(x,10,z,.055,14,'#ffffff');}}
}
function platform(x,z,w,d,y=0,color='#61d8e8'){box(x,y-.55,z,w,1.1,d,color);box(x,y-.12,z,w+.08,.18,d+.08,color);}
function courseStripe(z,width=25){for(let x=-width/2;x<width/2;x+=1.7)box(x+.8,.015,z,1.6,.045,1.1,Math.round(x/1.7)%2?'#faf9fc':'#5e519e');}
function arch(z,title){box(-12,3,z,1,6,1,'#ff7eac');box(12,3,z,1,6,1,'#ff7eac');box(0,6,z,25,1.2,1,'#ffd950');const sign=label(title,'#faffff','#ab55df',1.8);sign.position.set(0,6.1,z);courseStripe(z);}
function buildCourse(s){
 matchHudKey=matchAudioKey='';
 disposeWorld();scenery(s.length);aimSun(s.isRace?s.length/2:0,s.isRace);
 if(s.isRace){
  if(s.id==='dizzy'){platform(0,-4,26,27);platform(0,99,26,17);for(const o of s.obstacles.filter(o=>o.type==='disc')){const m=cylinder(o.x,-.45,o.z,o.w/2,.9,(o.phase||o.z)%2?'#b186fa':'#ffc94d');const stripe=box(o.x,.018,o.z,o.w-.5,.07,.32,'#ffffff');m.userData.stripe=stripe;obstacleMeshes.push({o,m});}}
  else if(s.id==='seesaw'){platform(0,-8,26,23);platform(0,105,26,12);for(const t of s.seesaws){const group=new THREE.Group();group.position.set(t.x,0,t.z);world.add(group);box(0,-.4,0,t.w,.8,t.d,t.row%2?'#ffd157':'#aa88ef',group);box(0,.03,0,.22,.07,t.d,'#ffffff',group);cylinder(t.x,-1.4,t.z,.8,2,'#fa63a4');seesawMeshes.push({t,m:group});}}
  else if(s.id==='tiptoe'){platform(0,-3,26,36);platform(0,98,26,27);for(const t of s.tiles){const m=box(t.x,-.35,t.z,t.w-.1,.7,t.d-.1,'#ffcf55');tileMeshes.push({t,m});}}
  else if(s.id==='slime'){for(let i=0;i<26;i++)platform(0,i*4+1,26,4,i*4*.065,'#8b79e8');platform(0,-9,26,16);}
  else if(s.id==='gates'){platform(0,36.5,26,109);platform(0,102,26,16);}
  else{platform(0,44,26,120);}
  if(!['dizzy','tiptoe','seesaw','slime'].includes(s.id)){for(let i=0;i<9;i++)box(0,.012,i*12-4,25,.025,.18,'#a6edf3');}
  for(let side of [-1,1])for(let z=-12;z<s.length+6;z+=8){cylinder(side*13.5,1,z,.12,2.3,'#ffffff');const flag=box(side*13.5,2,z,.3,.7,1.7,z%16?'#ff80ba':'#ffcd52');}
  arch(-13,'LET’S GO!');arch(s.length,'FINISH');
  if(s.id==='mountain'){crown=makeCrown();crown.position.set(0,3,s.length+1);cylinder(0,.4,s.length+1,3,.8,'#a684ee');}
 }else if(s.id==='hex'||s.id==='ice'){
  for(const t of s.tiles){const m=mesh(new THREE.CylinderGeometry(1.2,1.2,.32,6),s.id==='ice'?'#95eafa':PALETTE[t.layer%6]);m.position.set(t.x,t.y-.18,t.z);tileMeshes.push({t,m});}
  for(let i=0;i<8;i++){const a=i*Math.PI/4;cylinder(Math.cos(a)*15,4,Math.sin(a)*15,.35,18,'#a38af2');}
 }else if(s.id==='jump'||s.id==='showdown'){
  for(let i=0;i<8;i++){const g=new THREE.CylinderGeometry(12,12,.8,40,1,false,i*Math.PI/4,Math.PI/4-.018);const m=mesh(g,i%2?'#9b84f5':'#83dbed');m.position.y=-.4;sectorMeshes.push({index:i,m});}
  cylinder(0,1,0,1.8,2,'#f8c957');
  for(let h of [1,3.2]){const o={x:0,z:0,w:24,d:.7,h:h,type:'jumpbar'},m=box(0,h,0,24,.5,.65,h===1?'#a4ec66':'#fc7baa');obstacleMeshes.push({o,m});}
 }else if(s.id==='match'){
  for(const t of s.tiles){const m=box(t.x,-.4,t.z,t.w,.8,t.d,'#937beb');const sign=new THREE.Mesh(new THREE.PlaneGeometry(5.1,5.1),fruitMaterials[t.fruit]);sign.rotation.x=-Math.PI/2;sign.rotation.z=Math.PI;sign.position.set(t.x,.035,t.z);world.add(sign);tileMeshes.push({t,m,sign});}
 }else if(s.id!=='roll'){platform(0,0,25,24,0,'#8378ec');for(let x of [-13,13]){cylinder(x,2,0,.2,4,'#ff80b8');}}
 if(s.id==='roll'){
  for(let lane=0;lane<5;lane++)for(let row=0;row<12;row++){const o={lane,row,type:'rollfloor'},m=box((lane-2)*5,-.35,(row-5.5)*2,4.95,.7,1.9,PALETTE[lane]);obstacleMeshes.push({o,m});}
 }
 for(const door of s.doors){const m=box(door.x,2,door.z,door.w,4,.5,'#ff93c5');box(door.x,4.15,door.z,door.w,.3,.8,'#ffffff');const face=label('?','#a4387c','#fff0f7',.55);face.position.set(door.x,2,door.z-.4);obstacleMeshes.push({o:door,m,face});}
 for(const o of s.obstacles.filter(o=>o.type!=='disc')){
  let m;if(o.type==='ball'||o.type==='pendulum'){m=sphere(o.x,o.h/2,o.z,o.w/2,o.type==='ball'?'#ffd65c':'#ff81b8');if(o.type==='pendulum')cylinder(o.x,5,o.z,.07,8,'#ffffff');}
  else if(o.type==='spinner'||o.type==='fan'){m=box(o.x,.85,o.z,o.w,.55,.7,o.type==='fan'?'#f767a6':'#b3e970');cylinder(o.x,.4,o.z,1,1,'#ffc651');}
  else{m=box(o.x,o.h/2,o.z,o.w,o.h,o.d,o.type==='gate'?'#ff7bb5':'#ffa652');}
  obstacleMeshes.push({o,m});
 }
 wallGroup=new THREE.Group();world.add(wallGroup);
 for(const p of s.players){const bean=makeBean(PALETTE[p.id===0?colour:p.id%6],p.id);beans.set(p.id,bean);if(p.id===0)playerMarker=makePlayerMarker();}
 const startX=camera.aspect<.8?s.players[0].x:0;camera.position.set(startX,s.id==='hex'?25:16,s.isRace?-25:-26);camera.lookAt(startX,s.id==='hex'?8:0,s.isRace?10:0);if(s.id==='match'&&camera.aspect<.8){camera.position.set(0,62,-36);camera.lookAt(0,0,8);}
}
function lobbyScene(){
 disposeWorld();state=null;aimSun(5);scene.fog.near=85;scenery(25);platform(-9,5,25,20,0,'#957cec');platform(-7,24,28,15,.3,'#65dcec');
 for(let i=0;i<12;i++){const b=makeBean(PALETTE[i%6],i);b.position.set((i%4-1)*3-9,0,Math.floor(i/4)*3+8);b.rotation.y=Math.PI+.4;beans.set(i+1,b);}
 hero=makeBean(PALETTE[colour],0);hero.scale.setScalar(3.3);hero.position.set(-9,.3,-3);hero.rotation.y=Math.PI+.45;
 crown=makeCrown();crown.position.set(-9,9,-3);crown.scale.setScalar(1.4);
 const hoop=mesh(new THREE.TorusGeometry(10,.6,16,60),'#ff81bb');hoop.position.set(-10,1,22);hoop.rotation.x=Math.PI/2;
 box(-10,5,24,22,1,1,'#ffd965');const sign=label('ONE GLORIOUS CROWN','#ffffff','#a267ea',1.8);sign.position.set(-10,5,24);
 camera.position.set(-3,12,-23);camera.lookAt(3,3,3);
}
function updateWorld(dt){
 if(!state){if(hero){hero.position.y=.3+Math.sin(performance.now()*.002)*.12;hero.rotation.y=Math.PI+.45+Math.sin(performance.now()*.0006)*.2;}if(crown)crown.rotation.y+=dt*.5;return;}
 if(phase==='ceremony'){for(const c of confetti){c.position.y-=dt*(1+c.userData.speed);c.rotation.x+=dt*2;if(c.position.y<0)c.position.y=15;}if(hero){hero.position.y=1.23+Math.max(0,Math.sin(state.time*3))*.6;hero.rotation.y+=dt*.2;}if(crown){crown.position.y=hero.position.y+4.3;crown.rotation.y+=dt;}return;}
 const s=state;if(s.id==='slime'&&slimeMesh)slimeMesh.position.y=-1+s.time*.07-.5;
 for(const p of s.players){const b=beans.get(p.id);if(!b)continue;b.visible=p.alive||p.y>-8;b.position.set(p.x,p.y,p.z);if(p.id===0&&playerMarker){playerMarker.position.set(p.x,p.y+2.3,p.z);playerMarker.visible=p.alive&&!p.done;}if(p.done){b.visible=false;continue;}
  const speed=Math.hypot(p.vx,p.vz);if(speed>.2){const target=Math.atan2(p.vx,p.vz),delta=Math.atan2(Math.sin(target-b.rotation.y),Math.cos(target-b.rotation.y));b.rotation.y+=delta*Math.min(1,dt*12);}
  b.rotation.z=p.stun>0?Math.sin(s.time*14)*.6:Math.sin(s.time*12+p.id)*Math.min(.1,speed*.015);b.rotation.x=p.dive>0?-1.25:0;
  b.userData.body.position.y=1.13+Math.abs(Math.sin(s.time*12+p.id))*.06*speed/8;b.userData.arms.forEach((a,i)=>a.rotation.x=Math.sin(s.time*12+p.id+i*Math.PI)*.55*speed/8);b.userData.shadow.visible=p.ground;
 }
 for(const {o,m,face} of obstacleMeshes){
  if(o.breakable!==undefined){m.visible=!o.broken;if(face)face.visible=!o.broken;continue;}
  if(o.type==='rollfloor'){m.visible=!!floorAt(s,m.position.x,m.position.z);continue;}
  if(o.type==='jumpbar'){m.rotation.y=-(o.h===1?s.time*(s.id==='showdown'?1.2:1)+.2:-s.time*.6+1);continue;}
  const moving=movingObstacle(s,o);if(o.type==='disc'){m.rotation.y+=o.rate*dt;m.userData.stripe.rotation.y+=o.rate*dt;}
  else if(o.type==='spinner'||o.type==='fan')m.rotation.y=-moving.angle;
  else{m.position.x=moving.x;m.position.z=moving.z;if(o.type==='gate'){m.position.y=moving.h>0?1.75:-3;m.visible=moving.h>0;}}
 }
 for(const {t,m,sign} of tileMeshes){m.visible=!t.dead;if(s.id==='tiptoe'){m.material=mat(t.revealed?(t.safe?'#84e7b1':'#fa6da6'):'#ffcf55');}
  if(s.id==='hex'||s.id==='ice'){m.material=mat(t.active?'#ffea92':s.id==='ice'?['#f4faff','#baeef7','#85daed'][t.health-1]:PALETTE[t.layer]);if(t.active)m.position.y=t.y-.18+Math.sin(s.time*35)*.03;}
  if(s.id==='match'){const p=matchPhase(s);m.visible=!p.drop||t.fruit===p.target;sign.visible=p.reveal&&m.visible;m.material=mat(p.reveal?['#ff6e8c','#ffe364','#ba81ed','#ffc060','#86d8ac','#ffac99'][t.fruit]:'#937beb');sign.material=fruitMaterials[t.fruit];}
 }
 for(const {t,m} of seesawMeshes)m.rotation.z=t.tilt;
 for(const {index,m} of sectorMeshes){/* Cylinder theta starts on +z; simulation angles start on +x. */const angle=Math.PI/2-(index+.5)*Math.PI/4;m.visible=sectorSafe(s,angle);}
 if(wallGroup&&s.id==='blocks'){while(wallGroup.children.length){const m=wallGroup.children[0];m.geometry.dispose();wallGroup.remove(m);}for(const w of blockWalls(s))box(w.x,w.h/2,w.z,w.w,w.h,w.d,w.h<1?'#c3ec62':'#ff9ece',wallGroup);}
 if(crown&&s.id==='mountain'){crown.position.y=crownHeight(s);crown.rotation.y+=dt;}

 const player=s.players.find(p=>p.id===spectateId&&p.alive&&!p.done)||s.players.find(p=>p.alive&&!p.done)||s.players[0];
 if(s.isRace){const y=s.id==='slime'?player.y:0;const desired=new THREE.Vector3(player.x*(camera.aspect<.8?1:.5),y+11,player.z-14);camera.position.lerp(desired,Math.min(1,dt*3));camera.lookAt(player.x*(camera.aspect<.8?1:.65),y+1.5,player.z+9);}
 else if(s.id==='match'&&camera.aspect<.8){camera.position.lerp(new THREE.Vector3(0,62,-36),Math.min(1,dt*3));camera.lookAt(0,0,8);}
 else{const height=s.id==='hex'?Math.max(0,player.y):0,followX=camera.aspect<.8?player.x:0;camera.position.lerp(new THREE.Vector3(camera.aspect<.8?followX:player.x*.18,height+23,-25+player.z*.12),Math.min(1,dt*2));camera.lookAt(followX,height-1,1);}
}
let audio=null,audioEnabled=true,musicClock=0,musicIndex=0;
function unlockAudio(){if(!audio)try{audio=new (window.AudioContext||window.webkitAudioContext)();}catch{}audio?.resume();}
function tone(f=440,d=.12,type='sine',gain=.06){if(!audio||!audioEnabled)return;const osc=audio.createOscillator(),env=audio.createGain();osc.type=type;osc.frequency.setValueAtTime(f,audio.currentTime);env.gain.setValueAtTime(0,audio.currentTime);env.gain.linearRampToValueAtTime(gain,audio.currentTime+.01);env.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);osc.connect(env);env.connect(audio.destination);osc.start();osc.stop(audio.currentTime+d);}
function jingle(win=true){[0,2,4,7,12].forEach((n,i)=>setTimeout(()=>tone((win?440:220)*2**(n/12),.25,'triangle',.1),i*110));}
function updateSound(dt){if(paused||!audioEnabled||!audio)return;musicClock+=dt;if(musicClock>.23){musicClock=0;const melody=[0,4,7,12,7,4,2,5,9,12,9,5,0,4,7,9];tone(220*2**(melody[musicIndex++%melody.length]/12),.19,'triangle',.022);if(musicIndex%4===0)tone(110,.17,'sine',.04);}}
function syncFullscreen(){const active=!!document.fullscreenElement;$('fullscreen').textContent=active?'⛶ EXIT FULLSCREEN':'⛶ FULLSCREEN';$('fullscreen').setAttribute('aria-pressed',String(active));resize();}
$('fullscreen').hidden=!document.fullscreenEnabled;
$('fullscreen').addEventListener('click',async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{$('connection').textContent='Fullscreen is unavailable in this browser. You can still play here.';}});
addEventListener('fullscreenchange',syncFullscreen);
function toggleSound(){audioEnabled=!audioEnabled;$('sound').textContent=audioEnabled?'♫ SOUND ON':'♫ SOUND OFF';$('sound').setAttribute('aria-pressed',String(audioEnabled));if(audioEnabled)unlockAudio();}
function setPhase(next){phase=next;$('match-cue').hidden=state?.id!=='match'||!['briefing','countdown','playing','paused'].includes(next);$('game').className=['countdown','playing','results','briefing','ceremony'].includes(next)?next:'';$('menu').hidden=next!=='menu';$('lobby').hidden=next!=='lobby';$('hud').hidden=!['briefing','countdown','playing','results'].includes(next);$('pause').hidden=next!=='playing';$('courses').hidden=next!=='courses';$('touch').hidden=next!=='playing'||!matchMedia('(pointer:coarse)').matches;$('overlay').hidden=!['briefing','results','ceremony','paused'].includes(next);$('countdown').hidden=next!=='countdown';}
function dialog(kicker,title,text,button,fn,extra=''){$('overlay-kicker').textContent=kicker;$('overlay-title').textContent=title;$('overlay-text').textContent=text;$('overlay-extra').textContent=extra;$('continue').textContent=button;callback=fn;setTimeout(()=>$('continue').focus(),30);}
function home(){paused=false;show=null;practice=false;keys.clear();touchKeys.clear();pressed.clear();setPhase('menu');lobbyScene();$('join').focus();}
function join(){if(!ready)return;unlockAudio();$('name').value=$('name').value.trim()||'Jelly Rookie';$('welcome').textContent=`${$('name').value}, your bean is ready for the spotlight.`;$('lobby-difficulty').textContent=$('difficulty').value.toUpperCase();setPhase('lobby');lobbyScene();$('ready').focus();}
function startShow(){show=makeShow((Date.now()^Math.floor(performance.now()*1000))>>>0,$('difficulty').value);practice=false;briefing();}
function briefing(id){state=beginRound(show,id);spectateId=0;buildCourse(state);setPhase('briefing');updateHud();dialog(practice?'PRACTICE · NO ELIMINATION FROM A SHOW':`ROUND ${show.round+1} OF 5`,state.def.name,state.def.tip,'LET’S GO →',startRound,`${state.n} contestants · ${state.def.kind==='final'?'One winner':state.id==='match'?'All survivors qualify · 3 memory waves':state.qualify+' qualify'} · ${state.def.time}s limit`);}
function startRound(){paused=false;count=3.6;keys.clear();pressed.clear();setPhase('countdown');$('view').focus();tone(440,.15);}
function endRound(){advanceShow(show,state);if(show.phase==='ceremony'){ceremony();return;}setPhase('results');const qualified=state.qualified.includes(0);jingle(qualified);dialog(`ROUND ${show.round} COMPLETE`,qualified?'QUALIFIED!':'ELIMINATED',qualified?`You made the cut. ${state.qualified.length} beans are moving on.`:'Your run ends here. You can follow the rest of the show or try again.',practice?'TRY THIS ROUND AGAIN →':'NEXT ROUND →',()=>practice?practiceRound(state.id):briefing(),state.timeout?'Time limit reached. Remaining places decided by progress / survival height and fewer falls.':'Places decided by course finishes / survival.');}
function ceremony(){
 setPhase('ceremony');const winner=show.winner,won=winner===0;jingle(won);disposeWorld();aimSun();scenery(0);platform(0,0,18,14,0,'#aa83ee');cylinder(0,.5,0,3.5,1,'#ff8abb');cylinder(0,1.1,0,2.7,.25,'#fff1a3');hero=makeBean(PALETTE[winner===0?colour:winner%6],winner);hero.position.set(0,1.2,0);hero.scale.setScalar(2);hero.rotation.y=Math.PI;crown=makeCrown();crown.position.set(0,6.4,0);crown.scale.setScalar(1.5);
 for(let i=0;i<100;i++){const c=box((Math.random()-.5)*25,Math.random()*15,(Math.random()-.5)*18,.14,.25,.04,PALETTE[i%6]);c.userData.speed=Math.random()*2;confetti.push(c);}
 camera.position.set(-9,9,-19);camera.lookAt(0,3,0);dialog('THE CROWN CEREMONY',won?'WHAT A BEAN!':'A NEW CHAMPION',winner===0?`${$('name').value} takes the crown!`:`Bot ${String(winner).padStart(2,'0')} takes the crown. Your next show is a fresh chance.`,practice?'PLAY AGAIN →':'NEW SHOW →',()=>practice?practiceRound(state.id):startShow(),state.timeout?'Final ended on the visible time-limit tiebreak.':'A winner, a crown, and a very happy jellybean.');
}
function pause(){if(phase==='paused'){paused=false;setPhase('playing');$('view').focus();return;}if(phase!=='playing')return;paused=true;setPhase('paused');dialog('TAKE A BREATHER','Show paused.','The whole solo show waits for you.','KEEP GOING →',pause);}
function practiceRound(id){show=makeShow(20261006,$('difficulty').value);show.ids=Array.from({length:ROUNDS.find(r=>r.id===id).kind==='final'?10:60},(_,i)=>i);show.plan=[id];show.round=ROUNDS.find(r=>r.id===id).kind==='final'?4:0;practice=true;matchHudKey='';matchAudioKey='';briefing(id);}
function humanInput(){return {x:(keys.has('KeyA')||keys.has('ArrowLeft')?1:0)-(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-joystick.x,z:(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0)+joystick.z,jump:keys.has('Space')||touchKeys.has('jump')||pressed.has('Space'),dive:keys.has('ShiftLeft')||keys.has('ShiftRight')||touchKeys.has('dive')||pressed.has('ShiftLeft')||pressed.has('ShiftRight'),grab:keys.has('KeyE')||touchKeys.has('grab')||pressed.has('KeyE')};}
function updateMatchCue(){
 const p=matchPhase(state),active=['briefing','countdown','playing','paused'].includes(phase);$('match-cue').hidden=!active;const key=`${p.cycle}:${p.stage}:${p.target}`;
 if(key!==matchHudKey){
  matchHudKey=key;const titles={memorise:'MEMORISE THE FRUIT',choose:'FIND THE MATCH!',drop:'STAY ON THE SAFE FRUIT',reset:'NEXT MEMORY WAVE',complete:'MEMORY COMPLETE'};$('match-stage').textContent=p.reset&&p.cycle===2?'ALL WAVES CLEARED':titles[p.stage];$('match-wave').textContent=`WAVE ${Math.min(3,p.cycle+1)} / 3`;
  const images=p.reveal?Array.from({length:p.fruitCount},(_,i)=>i):p.choose||p.drop?[p.target]:[];
  $('match-fruits').replaceChildren(...images.map(i=>{const img=document.createElement('img');img.src=fruitImages[i];img.alt=FRUITS[i];return img;}));
  $('match-target').textContent=p.choose||p.drop?FRUITS[p.target]:p.reset?(p.cycle===2?'Surviving beans qualify.':'Full floor returns for the next wave.'):`Remember where all ${p.fruitCount} fruits are.`;
  if(phase==='playing'&&key!==matchAudioKey){matchAudioKey=key;tone(p.choose?880:p.drop?220:560,.18,'triangle',.07);}
 }
 $('match-clock').textContent=p.reveal?`${p.remaining}s to remember`:p.choose?`Tiles drop in ${p.remaining}s`:p.drop?`${p.remaining}s until the floor returns`:p.reset?(p.cycle===2?`Results in ${p.remaining}s`:`New fruit layout in ${p.remaining}s`):'';
}
function updateHud(){if(!state)return;$('hud').dataset.round=state.id;const s=state,p=s.players.find(p=>p.id===0),alive=s.players.filter(p=>p.alive).length;
 $('round-number').textContent=practice?'PRACTICE':`ROUND ${Math.min(5,(show.round||0)+1)} / 5`;$('round-name').textContent=s.def.name;$('objective').textContent=s.isRace?(s.id==='mountain'?'JUMP + GRAB the crown!':'Race to the finish line!'):s.id==='match'?'Remember the tiles. Find the target fruit.':'Stay out of the slime!';$('score-label').textContent=s.isRace?'QUALIFIED':s.def.kind==='final'?'REMAINING':'SURVIVORS';$('score').textContent=s.isRace?`${s.order.length}/${s.qualify}`:s.def.kind==='final'||s.id==='match'?String(alive):`${alive} → ${s.qualify}`;$('timer').textContent=`◷ ${Math.ceil(Math.max(0,s.def.time-s.time))}s`;
 $('hint').hidden=s.id==='match';$('hint').textContent=s.def.tip;$('match-cue').hidden=s.id!=='match';if(s.id==='match')updateMatchCue();
 $('player-status').textContent=!p||!p.alive?'ELIMINATED · Spectating · Tab to switch':p?.done?'FINISHED · Waiting for the field':p?.stun>.1?'TUMBLING!':'';
 const ctx=$('map').getContext('2d');ctx.clearRect(0,0,160,160);ctx.fillStyle='#c6e7ee';if(s.id==='match'){for(const t of s.tiles)if(floorAt(s,t.x,t.z)){ctx.fillStyle='#9c8aee';ctx.fillRect(80-t.x*5-13.8,80-t.z*5-13.8,27.6,27.6);}}else ctx.fillRect(12,12,136,136);for(const q of s.players){if(!q.alive||q.done)continue;const x=80-q.x*(s.isRace?4.6:5),z=s.isRace?142-q.z/s.length*126:80-q.z*5;ctx.beginPath();ctx.arc(x,z,q.id===0?4:2,0,Math.PI*2);ctx.fillStyle=q.id===0?'#ee458f':'#535585';ctx.fill();}
 $('show-rail').replaceChildren(...Array.from({length:5},(_,i)=>{const el=document.createElement('span');el.textContent=String(i+1);el.className=i===show.round?'current':i<show.round?'past':'';return el;}));
}
function resize(){const w=$('game').clientWidth,h=$('game').clientHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(phase==='menu'||phase==='lobby'){if(w<500){camera.position.set(-9,17,-28);camera.lookAt(4,4,2);}else if(w<900){camera.position.set(-4,14,-26);camera.lookAt(4,4,3);}}}
function animate(time){requestAnimationFrame(animate);const wallElapsed=Math.min(1,(time-lastTime)/1000||0),elapsed=Math.min(.08,wallElapsed);lastTime=time;
 if(phase==='countdown'){const old=Math.ceil(count);count-=wallElapsed;const digit=Math.ceil(count);$('countdown').textContent=digit>0?String(Math.min(3,digit)):'GO!';if(digit!==old)tone(digit>0?500:880,.15,'triangle',.1);if(count<-.35){setPhase('playing');accumulator=0;}}
 if(phase==='playing'&&!paused){accumulator+=elapsed;while(accumulator>=DT&&!state.finished){const p=state.players.find(p=>p.id===0),falls=p?.falls||0,oldY=p?.y||0;step(state,{0:humanInput()});pressed.clear();if(p?.falls>falls)tone(140,.2,'sawtooth',.035);if(p?.jumped){tone(620,.09,'sine',.04);p.jumped=false;}accumulator-=DT;}if(state.finished)endRound();}
 if(phase==='ceremony'&&state)state.time+=elapsed;
 if(!paused)updateWorld(elapsed);updateSound(elapsed);uiClock+=elapsed;if(uiClock>.12&&state){updateHud();uiClock=0;}
 renderer.render(scene,camera);
}
$('join').addEventListener('click',join);$('ready').addEventListener('click',startShow);$('leave').addEventListener('click',home);$('sound').addEventListener('click',toggleSound);$('pause').addEventListener('click',pause);$('tour').addEventListener('click',()=>setPhase('courses'));$('close-courses').addEventListener('click',home);$('continue').addEventListener('click',()=>{unlockAudio();callback();});$('overlay-home').addEventListener('click',()=>{paused=false;practice=false;setPhase('lobby');lobbyScene();});document.querySelector('.brand').addEventListener('click',e=>{e.preventDefault();home();});
PALETTE.forEach((c,i)=>{const b=document.createElement('button');b.type='button';b.className=`swatch-${i}`;b.setAttribute('aria-label',['Pink','Cyan','Yellow','Purple','Mint','Orange'][i]+' bean');b.setAttribute('aria-pressed',String(i===0));b.addEventListener('click',()=>{colour=i;for(const [j,button] of [...$('swatches').children].entries())button.setAttribute('aria-pressed',String(j===i));lobbyScene();resize();});$('swatches').append(b);});
for(let i=0;i<60;i++){const bean=document.createElement('span');bean.title=i===0?'You':`Bot ${i}`;$('roster').append(bean);}
const icons=['✳','◎','▥','▤','⚖','▦','↗','◒','↻','▧','≋','◈','⬡','❄','✳','♛'];
ROUNDS.forEach((r,i)=>{const b=document.createElement('button');b.type='button';b.className='course-button';const icon=document.createElement('span');icon.className='course-icon';icon.textContent=icons[i];const title=document.createElement('strong');title.textContent=r.name;const subtitle=document.createElement('small');subtitle.textContent=`${r.kind.toUpperCase()} · PRACTISE →`;b.append(icon,title,subtitle);b.addEventListener('click',()=>{unlockAudio();practiceRound(r.id);});$('course-grid').append(b);});
addEventListener('keydown',e=>{if(['INPUT','SELECT'].includes(e.target.tagName))return;if(e.code==='Escape'){pause();return;}if(e.code==='Tab'&&phase==='playing'&&!state.players.find(p=>p.id===0)?.alive){e.preventDefault();const active=state.players.filter(p=>p.alive&&!p.done);const index=active.findIndex(p=>p.id===spectateId);spectateId=active[(index+1)%active.length]?.id||0;return;}if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code)&&['playing','countdown'].includes(phase))e.preventDefault();keys.add(e.code);if(['Space','ShiftLeft','ShiftRight','KeyE'].includes(e.code)&&phase==='playing')pressed.add(e.code);});
addEventListener('keyup',e=>keys.delete(e.code));addEventListener('blur',()=>{keys.clear();touchKeys.clear();pressed.clear();joystick={x:0,z:0};});document.addEventListener('visibilitychange',()=>{if(document.hidden&&phase==='playing')pause();});
for(const b of document.querySelectorAll('[data-control]')){b.addEventListener('pointerdown',e=>{e.preventDefault();b.setPointerCapture(e.pointerId);touchKeys.add(b.dataset.control);pressed.add({jump:'Space',dive:'ShiftLeft',grab:'KeyE'}[b.dataset.control]);});for(const type of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(type,()=>touchKeys.delete(b.dataset.control));}
const stick=$('stick');let stickPointer=null;function stickMove(e){if(e.pointerId!==stickPointer)return;const rect=stick.getBoundingClientRect(),dx=(e.clientX-rect.left-rect.width/2)/40,dy=(e.clientY-rect.top-rect.height/2)/40,length=Math.max(1,Math.hypot(dx,dy));joystick={x:dx/length,z:-dy/length};$('stick-knob').style.setProperty('--stick-x',`${joystick.x*32}px`);$('stick-knob').style.setProperty('--stick-y',`${-joystick.z*32}px`);}
stick.addEventListener('pointerdown',e=>{stickPointer=e.pointerId;stick.setPointerCapture(e.pointerId);stickMove(e);});stick.addEventListener('pointermove',stickMove);for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,()=>{stickPointer=null;joystick={x:0,z:0};$('stick-knob').style.setProperty('--stick-x','0px');$('stick-knob').style.setProperty('--stick-y','0px');});
addEventListener('resize',resize);lobbyScene();resize();requestAnimationFrame(animate);
(async()=>{try{const bridge=await window.beanBridge();const context=await bridge.request('context');if(context?.query?.test==='1')window.beanTest=diagnostics;let response=await bridge.request('api',{method:'GET',path:'/api/v1/ext/beanshow/manifest'});if(!response?.ok||response.data?.version!=='0.1.0')throw Error('Game manifest could not be verified. Reload to retry.');ready=true;$('join').disabled=false;$('connection').textContent='✓ LNbits ready · No entry fee';}catch(e){$('connection').textContent=e.message;}})();
// Read-only diagnostics plus explicit practice controls, enabled only in a development test query.
const diagnostics={rounds:ROUNDS.map(r=>r.id),practice:practiceRound,start:startRound,state:()=>state,show:()=>show,phase:()=>phase,pause,home,stepBot(seconds){if(!state)return;state.autoPlayer=true;for(let i=0;i<seconds*60&&!state.finished;i++)step(state);state.autoPlayer=false;updateWorld(.1);updateHud();if(state.finished)endRound();},preview(id){practiceRound(id);setPhase('playing');paused=true;state.time=id==='match'?2:0;updateWorld(.01);updateHud();},pose(x,z,y=0){const p=state.players[0];Object.assign(p,{x,z,y,vx:0,vz:0,vy:0,ground:true});updateWorld(.3);},overview(){camera.position.set(state.isRace?-42:-25,state.isRace?76:35,state.isRace?-28:-35);camera.lookAt(0,state.id==='hex'?5:0,state.isRace?46:0);},resume(){paused=false;setPhase('playing');},screenX(){const p=state.players.find(p=>p.id===0);return new THREE.Vector3(p.x,p.y+1,p.z).project(camera).x;},matchTime(time){state.time=time-DT;step(state,{0:{}});updateWorld(.01);updateHud();},matchView:()=>({phase:state?.id==='match'?matchPhase(state):null,visibleTiles:tileMeshes.filter(({m})=>m.visible).length,visibleFruit:tileMeshes.filter(({sign})=>sign?.visible).length}),marker:()=>({visible:playerMarker?.visible,position:playerMarker?.position.toArray(),depthTest:playerMarker?.material.depthTest,screenSizeFixed:playerMarker?.material.sizeAttenuation===false,toneMapped:playerMarker?.material.toneMapped}),renderer:()=>({calls:renderer.info.render.calls,triangles:renderer.info.render.triangles,shadowType:renderer.shadowMap.type})};

if(new URL(location.href).searchParams.get('test')==='1')window.beanTest=diagnostics;
