// Procedural fruit pictures shared by the floor tiles and the target card.
import {FRUITS} from './catalog.js';
export function fruitCanvas(index){
 const c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');
 x.fillStyle='#fffaf1';x.beginPath();x.roundRect(4,4,504,504,48);x.fill();x.strokeStyle='#27304f';x.lineWidth=10;x.stroke();
 const circle=(a,b,r,color)=>{x.fillStyle=color;x.beginPath();x.arc(a,b,r,0,Math.PI*2);x.fill();};
 const leaf=(a,b)=>{x.fillStyle='#48ab68';x.beginPath();x.ellipse(a,b,42,18,-.5,0,Math.PI*2);x.fill();};
 if(index===0){x.strokeStyle='#389953';x.lineWidth=14;x.beginPath();x.moveTo(180,270);x.quadraticCurveTo(215,130,280,110);x.quadraticCurveTo(310,170,325,275);x.stroke();circle(180,295,72,'#ef4870');circle(325,295,72,'#d32f59');circle(160,270,15,'#ff9fb1');leaf(276,119);}
 if(index===1){x.fillStyle='#ffda48';x.strokeStyle='#d79d20';x.lineWidth=10;x.beginPath();x.moveTo(128,150);x.bezierCurveTo(180,370,370,350,397,130);x.bezierCurveTo(370,420,137,415,128,150);x.closePath();x.fill();x.stroke();x.fillStyle='#74613e';x.fillRect(119,134,23,30);}
 if(index===2){for(const [a,b] of [[210,190],[300,190],[168,250],[256,252],[344,250],[210,316],[300,316],[256,372]]){circle(a,b,43,'#9855dc');circle(a-12,b-12,9,'#c991f5');}leaf(255,122);}
 if(index===3){circle(256,272,133,'#ff9e36');circle(210,222,27,'#ffc979');leaf(288,131);x.strokeStyle='#82643b';x.lineWidth=13;x.beginPath();x.moveTo(256,146);x.lineTo(251,105);x.stroke();}
 if(index===4){x.beginPath();x.moveTo(95,190);x.lineTo(417,190);x.arc(256,190,161,0,Math.PI);x.closePath();x.fillStyle='#60bf76';x.fill();x.beginPath();x.moveTo(113,192);x.lineTo(399,192);x.arc(256,192,143,0,Math.PI);x.closePath();x.fillStyle='#ff7787';x.fill();for(const [a,b] of [[176,235],[257,230],[335,235],[215,285],[298,285],[257,319]])circle(a,b,6,'#35344e');}
 if(index===5){circle(207,267,110,'#ffaf83');circle(303,267,110,'#ff9579');x.strokeStyle='#df7867';x.lineWidth=8;x.beginPath();x.moveTo(259,176);x.quadraticCurveTo(218,267,259,356);x.stroke();leaf(273,143);}
 x.fillStyle='#27304f';x.font='900 46px Trebuchet MS';x.textAlign='center';x.fillText(FRUITS[index],256,469);return c;
}
