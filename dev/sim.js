import {ROUNDS,FRUITS} from './catalog.js';
export {ROUNDS,FRUITS};
export const DT=1/60;
export function rng(seed){let n=seed>>>0;return ()=>{n+=0x6d2b79f5;let t=Math.imul(n^n>>>15,1|n);t^=t+Math.imul(t^t>>>7,61|t);return ((t^t>>>14)>>>0)/4294967296;};}
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const TAU=Math.PI*2;
export function makeShow(seed=Date.now(),difficulty='easy'){
 const random=rng(seed), pick=(items)=>items.splice(Math.floor(random()*items.length),1)[0];
 const races=ROUNDS.filter(r=>r.kind==='race'),survival=ROUNDS.filter(r=>r.kind==='survival');
 return {seed,difficulty,round:0,phase:'briefing',plan:[pick(races),pick(races),pick(survival),random()<.5?pick(races):pick(survival),pick(ROUNDS.filter(r=>r.kind==='final'))].map(r=>r.id),ids:Array.from({length:60},(_,i)=>i),history:[],winner:null};
}
export function beginRound(show,id=show.plan[show.round],ids=show.ids){
 const def=ROUNDS.find(r=>r.id===id);if(!def)throw Error('Unknown round');
 const random=rng(show.seed+show.round*7919),isRace=def.kind==='race'||id==='mountain';
 const n=ids.length,qualify=def.kind==='final'?1:Math.min([40,28,18,10][show.round]||10,n-1);
 const state={id,def,difficulty:show.difficulty,random,time:0,finished:false,qualify,n,isRace,width:26,length:id==='mountain'?90:104,players:[],order:[],eliminated:[],tiles:[],obstacles:[],doors:[],seesaws:[],path:[],winner:null,timeout:false};
 const easy=show.difficulty==='easy';
 for(let i=0;i<n;i++){
  const pid=ids[i],angle=i/n*TAU;
  state.players.push({id:pid,x:isRace?(i%10-4.5)*2.15:Math.cos(angle)*(4+i%3*2),z:isRace?-Math.floor(i/10)*2.3:Math.sin(angle)*(4+i%3*2),y:id==='hex'?12:0,vx:0,vz:0,vy:0,ground:true,alive:true,done:false,progress:0,checkpoint:0,stun:0,coyote:.1,jumpBuffer:0,dive:0,diveCooldown:0,grabCooldown:0,falls:0,skill:.55+random()*.4,speed:pid===0?7.8:(easy?5.1:7.0)+random()*1.3,mistake:0,think:0,tx:0,tz:0,jump:false,aimLane:Math.floor(random()*7),finishTime:null,layer:id==='hex'?2:0});
 }
 function box(x,z,w,d,h=2,type='box',extra={}){state.obstacles.push({x,z,w,d,h,type,...extra});}
 if(id==='doors')for(let row=0;row<4;row++){
  const safe=new Set([Math.floor(random()*7),Math.floor(random()*7),Math.floor(random()*7)]);
  for(let lane=0;lane<7;lane++)state.doors.push({x:(lane-3)*3.6,z:20+row*21,w:3.45,d:.6,h:4,breakable:safe.has(lane),broken:false,row,lane});
 }
 if(id==='gates')for(let row=0;row<4;row++)for(let lane=0;lane<5;lane++)box((lane-2)*5.1,22+row*20,4.9,.9,3.5,'gate',{phase:lane*1.6+row,duty:row===3?1.7:1.2});
 if(id==='whirlygig'){for(let z of [20,40,61,81])box(0,z,20,.6,.8,'spinner',{rate:z===81?2:1.4,phase:z});box(0,94,9,.6,6,'fan',{rate:1.7,phase:0});}
 if(id==='dizzy'){for(let row=0;row<6;row++)for(let col=0;col<3;col++)box((col-1)*8,16+row*14,11.5,11.5,.3,'disc',{rate:(row+col)%2?-.8:.8});for(let i=0;i<5;i++)box(0,45+i*10,2,2,2,'ball',{phase:i*2.3,rate:1.3});}
 if(id==='seesaw')for(let row=0;row<5;row++)for(let col=0;col<2;col++)state.seesaws.push({x:(col-.5)*12.5,z:13+row*19,w:12,d:16,tilt:0,row});
 if(id==='tiptoe'){
  let col=3;for(let row=0;row<12;row++){
   const old=col;col=clamp(col+Math.floor(random()*3)-1,0,6);state.path.push(col);
   for(let lane=0;lane<7;lane++)state.tiles.push({x:(lane-3)*3.5,z:18+row*5.8,w:3.5,d:5.8,y:0,safe:lane>=Math.min(old,col)&&lane<=Math.max(old,col),revealed:false,dead:false,row,col:lane,life:0});
  }
 }
 if(id==='slime')for(let row=0;row<7;row++)box((row%2?1:-1)*7,17+row*12,9,1.5,2.1,'pusher',{phase:row,rate:1.2});
 if(id==='hitparade'||id==='mountain'){
  for(let i=0;i<8;i++)box((i%3-1)*7,18+i*8,2.5,2.5,3,'pendulum',{phase:i*.7,rate:1.5});
  if(id==='mountain')for(let i=0;i<7;i++)box(0,20+i*9,2.5,2.5,2.5,'ball',{phase:i*1.7,rate:1});
 }
 if(id==='hex'||id==='ice')for(let layer=0;layer<(id==='hex'?3:1);layer++)for(let q=-5;q<=5;q++)for(let r=-5;r<=5;r++){
  const x=Math.sqrt(3)*1.22*(q+r/2),z=1.83*r;if(x*x+z*z>125)continue;
  state.tiles.push({x,z,w:2.44,d:2.44,y:id==='hex'?4+layer*4:0,layer,life:0,health:id==='ice'?3:1,dead:false,active:false});
 }
 if(id==='match')for(let x=0;x<4;x++)for(let z=0;z<4;z++)state.tiles.push({x:(x-1.5)*5.8,z:(z-1.5)*5.8,w:5.7,d:5.7,y:0,fruit:Math.floor(random()*6),dead:false});
 if(id==='match')state.players.forEach((p,i)=>{const tile=state.tiles[i%16];p.x=tile.x+(Math.floor(i/16)%3-1)*1.3;p.z=tile.z+(i%2?-.7:.7);});
 if(id==='roll')for(const p of state.players)if(!floorAt(state,p.x,p.z)){for(let d=.5;d<=12;d+=.5){const z=p.z+d;if(floorAt(state,p.x,z)){p.z=z;break;}}}
 return state;
}
export function movingObstacle(s,o){
 const t=s.time;
 if(o.type==='spinner'||o.type==='fan')return {...o,angle:t*o.rate+o.phase};
 if(o.type==='gate')return {...o,h:Math.sin(t*1.6+o.phase)>0?0:3.5};
 if(o.type==='pusher')return {...o,x:o.x+Math.sin(t*o.rate+o.phase)*5};
 if(o.type==='pendulum')return {...o,x:o.x+Math.sin(t*o.rate+o.phase)*4};
 if(o.type==='ball')return {...o,x:Math.sin(t*.7+o.phase)*10,z:o.z-(t*9+o.phase*9)%22};
 return o;
}
export function blockWalls(s){
 const walls=[];
 for(let i=0;i<3;i++){
  const cycle=Math.floor(s.time/5)-i,age=s.time-cycle*5;if(cycle<0||age>12)continue;
  const lane=(cycle%3-1)*7,z=24-age*4.7;
  if(cycle%4===3)walls.push({x:0,z,w:25,d:1.2,h:.8,type:'hurdle'});
  else{const left=lane-3.5,right=lane+3.5;if(left>-12.5)walls.push({x:(left-12.5)/2,z,w:left+12.5,d:1.2,h:4,type:'wall'});if(right<12.5)walls.push({x:(right+12.5)/2,z,w:12.5-right,d:1.2,h:4,type:'wall'});}
 }
 return walls;
}
export function matchPhase(s){const cycle=Math.floor(s.time/13),t=s.time%13;return {cycle,reveal:t<6,choose:t>=6&&t<9,drop:t>=9&&t<12,target:(s.tiles[cycle*3%s.tiles.length]||{}).fruit||0};}
export function sectorSafe(s,angle){
 if(s.id!=='showdown')return true;
 const sector=Math.floor(((angle+TAU)%TAU)/TAU*8),dropped=Math.min(6,Math.floor(s.time/10));return sector>=dropped;
}
export function floorAt(s,x,z,above=Infinity){
 if(s.isRace){
  if(x<-13||x>13||z<-17||z>s.length+9)return null;
  if(s.id==='seesaw'&&z>3&&z<99){const tile=s.seesaws.find(t=>Math.abs(x-t.x)<t.w/2&&Math.abs(z-t.z)<t.d/2);return tile?{y:(x-tile.x)*tile.tilt,tile}:null;}
  if(s.id==='tiptoe'&&z>15.1&&z<84.7){const tile=s.tiles.find(t=>Math.abs(x-t.x)<=t.w/2&&Math.abs(z-t.z)<=t.d/2);return tile&&!tile.dead?{y:0,tile}:null;}
  if(s.id==='gates'&&z>91&&z<94)return null;
  if(s.id==='dizzy'&&z>10&&z<91){const disc=s.obstacles.find(t=>t.type==='disc'&&Math.hypot(x-t.x,z-t.z)<=t.w/2);return disc?{y:0,disc}:null;}
  return {y:s.id==='slime'?Math.max(0,z*.065):0};
 }
 if(s.id==='hex'||s.id==='ice'){
  let nearest=null,dist=1.24;for(const t of s.tiles){if(t.dead||t.y>above+.1)continue;const d=Math.hypot(x-t.x,z-t.z);if(d<1.24&&(!nearest||t.y>nearest.y||(t.y===nearest.y&&d<dist))){nearest=t;dist=d;}}
  return nearest?{y:nearest.y,tile:nearest}:null;
 }
 if(s.id==='jump'||s.id==='showdown'){const radius=Math.hypot(x,z);return radius<12&&radius>1.8&&sectorSafe(s,Math.atan2(z,x))?{y:0}:null;}
 if(s.id==='match'){const phase=matchPhase(s),tile=s.tiles.find(t=>Math.abs(x-t.x)<2.85&&Math.abs(z-t.z)<2.85);return tile&&(phase.drop?tile.fruit===phase.target:true)?{y:0,tile}:null;}
 if(s.id==='roll'){
  if(Math.abs(x)>12.5||Math.abs(z)>12)return null;
  const lane=clamp(Math.floor((x+12.5)/5),0,4),phase=(z+s.time*(lane%2?2:-2)+lane*6+200)%24;
  return phase<4?null:{y:0,lane};
 }
 return Math.abs(x)<12.5&&Math.abs(z)<12?{y:0}:null;
}
function botInput(s,p){
 const random=s.random,easy=s.difficulty==='easy',dt=DT;
 p.think-=dt;p.mistake-=dt;
 if(p.think<=0){p.think=.12+(1-p.skill)*.45;if(random()<(easy?.025:.01)){p.mistake=.3+random()*.8;p.tx=p.x+(random()-.5)*6;}}
 let tx=p.tx,tz=p.tz,jump=false,grab=false;
 if(s.isRace){
  tz=p.z+8;tx=Math.sin(p.id*31+p.z*.03)*8;
  if(s.id==='doors'){
   const row=Math.floor((p.z-21)/21)+1,doors=s.doors.filter(d=>d.row===clamp(row,0,3));
   const known=doors.filter(d=>d.broken);const target=known.length?known[p.id%known.length]:doors[p.aimLane%doors.length];
   if(target&&target.z>p.z-1){tx=target.x;if(p.stun>.1)p.aimLane=(p.aimLane+1)%7;}
  }
  if(s.id==='gates')tx=(p.id%5-2)*5.1;
  if(s.id==='whirlygig'&&p.z>85)tx=p.id%2?10:-10;
  if(s.id==='dizzy'){const row=clamp(Math.floor((p.z-9)/14),0,5);tx=(p.id%3-1)*8;}
  if(s.id==='seesaw'){const row=clamp(Math.floor((p.z-5)/19),0,4),tile=s.seesaws[row*2+p.id%2];tx=tile.x;}
  if(s.id==='tiptoe'){
   const row=clamp(p.routeRow||0,0,12);
   tx=s.path[Math.min(row,11)]*3.5-10.5;tz=row===12?s.length+2:18+row*5.8;
   // ponytail: bots inspect the hidden path; online bots must use observable tiles.
   if(row<12&&Math.hypot(tx-p.x,tz-p.z)<1.1)p.routeRow=row+1;
   if(random()<.0003*(1-p.skill))tx+=(random()<.5?-1:1)*3.5;
  }
  if(s.id==='gates'&&p.z>89)jump=true;
  if(['dizzy','seesaw'].includes(s.id)&&p.ground&&!floorAt(s,p.x,p.z+.65,p.y+.5))jump=true;
  for(const original of s.obstacles){const o=movingObstacle(s,original);if(Math.abs(o.z-p.z)<5){
   if(o.type==='spinner')jump=true;
   else if(o.type!=='disc'&&o.h>0&&Math.abs(o.x-p.x)<o.w/2+1){tx=clamp(o.x+(p.id%2?1:-1)*(o.w/2+1.8),-11,11);if(o.type==='gate')jump=false;}
  }}
  if(s.id==='mountain'&&p.z>s.length-5){tx=0;jump=true;grab=true;}
 }else if(s.id==='hex'||s.id==='ice'){
  const floor=floorAt(s,p.x,p.z,p.y+.2);const available=s.tiles.filter(t=>!t.dead&&t.y<=p.y+.2&&t.y>=p.y-4.2&&(!t.active||t.health>1));
  const target=available.reduce((best,t)=>{const d=Math.hypot(t.x-p.x,t.z-p.z)+(t.y<p.y-1?3:0);return !best||d<best.d?{t,d}:best;},null);
  if(target){tx=target.t.x;tz=target.t.z;if(floor?.tile===target.t){const next=available.filter(t=>t!==target.t&&Math.hypot(t.x-p.x,t.z-p.z)<3.5);if(next.length){const t=next[p.id%next.length];tx=t.x;tz=t.z;}}}
  jump=!!floor?.tile?.active&&floor.tile.life<.25&&p.skill>.65;
 }else if(s.id==='jump'||s.id==='showdown'){
  const angle=s.id==='showdown'?Math.max(Math.floor(s.time/10),0)*TAU/8+1.5+p.id*.035:p.id*2.4;
  tx=Math.cos(angle)*8;tz=Math.sin(angle)*8;
  const a=Math.atan2(p.z,p.x),bar=s.time*(s.id==='showdown'?1.2:1)+.2;
  const diff=Math.atan2(Math.sin(a-bar),Math.cos(a-bar));jump=Math.abs(Math.sin(diff))<.3;
 }else if(s.id==='blocks'){
  const walls=blockWalls(s).filter(w=>w.z>p.z&&w.z-p.z<12);const cycle=Math.floor(s.time/5);tx=(cycle%3-1)*7;tz=-4+p.id%5;
  jump=walls.some(w=>w.h<1.2&&w.z-p.z<3.2);
 }else if(s.id==='roll'){
  let best=null;for(let lane=0;lane<5;lane++){const x=(lane-2)*5;if(floorAt(s,x,p.z)&&floorAt(s,x,p.z+1)){const d=Math.abs(x-p.x);if(!best||d<best.d)best={x,d};}}
  tx=best?best.x:0;tz=Math.sin(s.time*.3+p.id)*5;jump=!floorAt(s,p.x,p.z+Math.sign(p.vz)*2);
 }else if(s.id==='match'){
  const phase=matchPhase(s);const choices=s.tiles.filter(t=>t.fruit===phase.target);const target=choices[p.id%choices.length];
  if(phase.choose||phase.drop){tx=target.x+(p.id%3-1)*.5;tz=target.z;if(phase.choose&&random()<.001*(easy?2:1)){p.mistake=1.5;}}
  else{tx=Math.sin(p.id)*7;tz=Math.cos(p.id)*7;}
 }
 if(p.mistake>0){jump=false;tx+=Math.sin(p.id)*4;}
 p.tx=tx;p.tz=tz;
 const dx=tx-p.x,dz=tz-p.z,len=Math.hypot(dx,dz);
 return {x:len>.4?dx/Math.max(1,len):0,z:len>.4?dz/Math.max(1,len):0,jump:jump&&random()<p.skill,dive:false,grab};
}
function knock(p,dx,dz,power=9){if(p.stun>.35)return;p.vx+=dx*power;p.vz+=dz*power;p.vy=Math.max(p.vy,3.8);p.ground=false;p.stun=.65;}
function fail(s,p){p.falls++;if(s.isRace&&s.id!=='slime'){p.x=clamp(p.x,-10,10);p.z=p.checkpoint;if(s.id==='tiptoe')p.routeRow=0;if(s.id==='dizzy'){const discs=s.obstacles.filter(o=>o.type==='disc'&&o.z<p.progress).sort((a,b)=>b.z-a.z);const disc=discs.find(o=>Math.abs(o.x-p.x)<5.8)||discs[0];if(disc){p.x=disc.x;p.z=disc.z;}}if(s.id==='seesaw'&&p.checkpointX!==undefined)p.x=p.checkpointX;p.y=2+(s.id==='slime'?p.z*.065:0);p.vx=p.vz=p.vy=0;p.stun=.55;p.ground=false;}else{p.alive=false;p.deathTime=s.time;s.eliminated.push(p.id);if(!s.isRace){const alive=s.players.filter(q=>q.alive);if(alive.length<=s.qualify)finish(s,alive.map(q=>q.id));}}}
export function step(s,inputs={},dt=DT){
 if(s.finished)return;s.time+=dt;
 for(const tile of s.tiles)if(tile.active&&!tile.dead){tile.life-=dt;if(tile.life<=0){tile.health--;if(tile.health<=0)tile.dead=true;else tile.active=false;}}
 if(s.id==='seesaw')for(const tile of s.seesaws){let load=0;for(const p of s.players)if(p.alive&&p.ground&&Math.abs(p.x-tile.x)<6&&Math.abs(p.z-tile.z)<8)load+=(p.x-tile.x)*.008;tile.tilt+= (clamp(load,-.55,.55)-tile.tilt)*dt*2;}
 const walls=s.id==='blocks'?blockWalls(s):[];
 for(const p of s.players){
  if(s.finished)break;if(!p.alive||p.done)continue;
  const supplied=inputs[p.id];const input=supplied|| (p.id!==0||s.autoPlayer?botInput(s,p):{});
  const ax=clamp(Number(input.x)||0,-1,1),az=clamp(Number(input.z)||0,-1,1),len=Math.max(1,Math.hypot(ax,az));
  p.stun=Math.max(0,p.stun-dt);p.diveCooldown=Math.max(0,p.diveCooldown-dt);p.grabCooldown=Math.max(0,p.grabCooldown-dt);
  if(input.jump)p.jumpBuffer=.12;else p.jumpBuffer=Math.max(0,p.jumpBuffer-dt);
  if(p.ground)p.coyote=.1;else p.coyote-=dt;
  if(p.jumpBuffer>0&&p.coyote>0&&p.stun<.2){p.vy=8.6;p.ground=false;p.coyote=0;p.jumpBuffer=0;p.y+=.03;p.jumped=true;}
  if(input.dive&&p.diveCooldown===0){p.vx+=ax/len*7;p.vz+=az/len*7;if(!p.ground)p.vy=Math.min(p.vy,1.2);p.dive=.5;p.diveCooldown=1.2;}
  p.dive=Math.max(0,p.dive-dt);
  const acceleration=p.ground?12:3.5,steer=p.stun>0?.15:1;
  p.vx+=(ax/len*p.speed-p.vx)*Math.min(1,acceleration*dt)*steer;p.vz+=(az/len*p.speed-p.vz)*Math.min(1,acceleration*dt)*steer;
  const oldY=p.y;p.x+=p.vx*dt;p.z+=p.vz*dt;p.vy-=22*dt;p.y+=p.vy*dt;
  const floor=floorAt(s,p.x,p.z,Math.max(oldY,p.y)+.4);
  if(floor&&p.vy<=0&&p.y<=floor.y+.05&&oldY>=floor.y-.5){p.y=floor.y;p.vy=0;p.ground=true;p.layer=floor.tile?.layer||0;
   if(floor.disc){p.x+=(p.z-floor.disc.z)*floor.disc.rate*dt;p.z-=(p.x-floor.disc.x)*floor.disc.rate*dt;}
   if(floor.lane!==undefined)p.z+=(floor.lane%2?2:-2)*dt;
   if(floor.tile){const tile=floor.tile;if(s.id==='tiptoe'){tile.revealed=true;if(!tile.safe)tile.dead=true;}if((s.id==='hex'||s.id==='ice')&&!tile.active){tile.active=true;tile.life=s.id==='hex'?.65:.5;}}
  }else p.ground=false;
  if(s.id==='seesaw'&&floor?.tile&&p.ground){p.vx+=floor.tile.tilt*dt*12;p.checkpoint=floor.tile.z;p.checkpointX=floor.tile.x;}
  for(const door of s.doors){if(door.broken)continue;if(Math.abs(p.x-door.x)<door.w/2+.55&&Math.abs(p.z-door.z)<.85&&p.y<4){if(door.breakable){door.broken=true;p.vz*=.55;}else{p.z=door.z-.9;knock(p,0,-1,3);}}}
  for(const original of [...s.obstacles,...walls]){
   const o=movingObstacle(s,original);if(o.type==='disc'||o.h===0)continue;
   if(o.type==='spinner'||o.type==='fan'){
    const dx=p.x-o.x,dz=p.z-o.z,along=dx*Math.cos(o.angle)+dz*Math.sin(o.angle),across=-dx*Math.sin(o.angle)+dz*Math.cos(o.angle);
    if(Math.abs(along)<o.w/2&&Math.abs(across)<.8&&p.y<(o.type==='fan'?4:1.05))knock(p,-Math.sin(o.angle),Math.cos(o.angle),o.type==='fan'?15:9);
   }else if(Math.abs(p.x-o.x)<o.w/2+.55&&Math.abs(p.z-o.z)<o.d/2+.55&&p.y<o.h){
    if(o.type==='gate'){p.z=o.z-.95;p.vz=-1;}
    else if(o.type==='wall'){p.z=o.z-1.3;knock(p,0,-1,4);}
    else{const dx=p.x-o.x,dz=p.z-o.z,l=Math.hypot(dx,dz)||1;knock(p,dx/l,dz/l,8);}
   }
  }
  if(s.id==='jump'||s.id==='showdown'){
   const a=s.time*(s.id==='showdown'?1.2:1)+.2,dx=p.x*Math.cos(a)+p.z*Math.sin(a),across=-p.x*Math.sin(a)+p.z*Math.cos(a);
   if(Math.abs(across)<.65&&Math.abs(dx)<12&&p.y<1.15)knock(p,-Math.sin(a)*Math.sign(dx),Math.cos(a)*Math.sign(dx),9);
   const upper=-s.time*.6+1;if(Math.abs(-p.x*Math.sin(upper)+p.z*Math.cos(upper))<.85&&p.y>1.25)knock(p,-Math.sin(upper),Math.cos(upper),7);
  }
  if(input.grab&&p.grabCooldown===0){
   if(s.id==='mountain'&&p.z>s.length-3&&Math.abs(p.x)<2.3&&p.y+1.8>crownHeight(s)){p.done=true;p.finishTime=s.time;s.order.push(p.id);}
   else{const rival=s.players.find(q=>q!==p&&q.alive&&!q.done&&Math.hypot(q.x-p.x,q.z-p.z)<1.65);if(rival){rival.stun=Math.max(rival.stun,.2);rival.vx*=.5;rival.vz*=.5;}}
   p.grabCooldown=.4;
  }
  const slime=s.id==='slime'?-1+s.time*.07:-4;
  if(p.y<slime){fail(s,p);continue;}
  if(s.isRace){p.progress=Math.max(p.progress,p.z);if(s.id!=='tiptoe'&&s.id!=='seesaw'&&p.ground)p.checkpoint=Math.floor(Math.max(0,p.z-3)/20)*20;
   if(s.id!=='mountain'&&p.z>=s.length){p.done=true;p.finishTime=s.time;s.order.push(p.id);}
  }
 }
 // ponytail: 60 beans use a bounded O(n²) collision pass; use a grid for larger rooms.
 for(let i=0;i<s.players.length;i++)for(let j=i+1;j<s.players.length;j++){
  const a=s.players[i],b=s.players[j];if(!a.alive||!b.alive||a.done||b.done||Math.abs(a.y-b.y)>1.5)continue;
  const dx=b.x-a.x,dz=b.z-a.z,d=Math.hypot(dx,dz);if(d>0&&d<1.12){const push=(1.12-d)*.35;a.x-=dx/d*push;a.z-=dz/d*push;b.x+=dx/d*push;b.z+=dz/d*push;}
 }
 const alive=s.players.filter(p=>p.alive),active=alive.filter(p=>!p.done);
 if(s.def.kind==='final'&&!s.isRace&&alive.length<=1)finish(s,alive.map(p=>p.id));
 else if(s.isRace&&s.order.length>=s.qualify)finish(s,s.order.slice(0,s.qualify));
 else if(s.def.kind!=='final'&&!s.isRace&&alive.length<=s.qualify)finish(s,alive.map(p=>p.id));
 else if(s.isRace&&active.length===0)finish(s,s.order.slice(0,s.qualify));
 else if(s.time>=s.def.time){
  s.timeout=true;
  // A hard deadline is a visible score tiebreak, never a fake finish/crown grab.
  const ranked=s.players.slice().sort((a,b)=>Number(b.done)-Number(a.done)||Number(b.alive)-Number(a.alive)||(s.isRace?b.progress-a.progress:b.y-a.y)||a.falls-b.falls||a.id-b.id);
  finish(s,ranked.slice(0,s.qualify).map(p=>p.id));
 }
}
export function crownHeight(s){return 3+Math.sin(s.time*1.4)*1.2;}
function finish(s,ids){s.finished=true;s.qualified=ids;s.winner=s.def.kind==='final'?ids[0]??s.eliminated.at(-1)??s.players[0].id:null;}
export function advanceShow(show,s){
 if(!s.finished)throw Error('Round is still running');
 show.history.push({round:s.id,qualified:s.qualified,timeout:s.timeout,time:s.time});show.ids=s.qualified;
 if(s.def.kind==='final'||show.ids.length===0){show.winner=s.winner;show.phase='ceremony';}else{show.round++;show.phase='briefing';}
 return show;
}
