import {ROUNDS} from './catalog.js';
export function showManifest(requestJson){
 try{const request=JSON.parse(requestJson);if(!request||typeof request!=='object'||Array.isArray(request))return JSON.stringify({ok:false,error:'Expected a JSON object.'});
 return JSON.stringify({ok:true,data:{version:'0.1.1',players:60,roundsPerShow:5,defaultDifficulty:'easy',mode:'solo-free',paidEnabled:false,multiplayerEnabled:false,rounds:ROUNDS}});
 }catch{return JSON.stringify({ok:false,error:'Invalid JSON request.'});}
}
