(()=>{const o=document.getElementById('orb');if(!o)return;const ring=o.querySelector('.orb-ring'),cs=[...o.querySelectorAll('.orb-card')],N=cs.length,STEP=360/N,reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
let ang=0,tgt=0,drag=null,hover=false,idle=0,flipped=-1,vis=false,raf=0,last=0;
const R=()=>innerWidth<720?300:430;
const front=()=>((Math.round(-tgt/STEP)%N)+N)%N;
function flip(i,on){cs.forEach((c,k)=>c.classList.toggle('flip',on&&k===i));flipped=on?i:-1}
function snap(){tgt=Math.round(tgt/STEP)*STEP}
function go(d){flip(0,false);tgt=Math.round(tgt/STEP)*STEP-d*STEP;idle=0;kick()}
function render(){const r=R();cs.forEach((c,i)=>{const a=((i*STEP+ang)%360+360)%360,rad=a*Math.PI/180,z=Math.cos(rad),dep=(z+1)/2;
 c.style.transform=`rotateY(${a}deg) translateZ(${r}px)`;c.style.setProperty('--o',(z<0?Math.max(0,.3*(1+z*2)):.25+.75*Math.pow(dep,1.4)).toFixed(3));c.style.zIndex=Math.round(dep*100);c.style.pointerEvents=z>.55?'auto':'none';c.style.setProperty('--s',z>.9?1:.8)});
 ring.style.transform=`translateZ(${-r}px)`}
function tick(t){const dt=Math.min(.05,(t-last)/1000||.016);last=t;
 if(!drag){if(!reduce&&!hover&&flipped<0&&vis){idle+=dt;if(idle>3.2){idle=0;tgt-=STEP}}ang+=(tgt-ang)*(1-Math.pow(.0016,dt))}
 render();raf=vis&&(Math.abs(tgt-ang)>.02||drag||(!reduce&&!hover&&flipped<0))?requestAnimationFrame(tick):0}
function kick(){if(!raf&&vis){last=performance.now();raf=requestAnimationFrame(tick)}}
new IntersectionObserver(([e])=>{vis=e.isIntersecting;if(vis)kick()}).observe(o);
o.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')hover=true});o.addEventListener('pointerleave',()=>{hover=false;kick()});
o.addEventListener('pointerdown',e=>{if(e.target.closest('.orb-nav,a'))return;drag={x:e.clientX,y:e.clientY,a:tgt,m:0,on:false,id:e.pointerId,t:e.pointerType};});
o.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-drag.x;if(!drag.on){if(Math.abs(dx)<8)return;if(drag.t==='touch'&&Math.abs(dx)<Math.abs(e.clientY-drag.y)){drag=null;return}drag.on=true;o.setPointerCapture(e.pointerId);o.classList.add('drag')}
 drag.m=Math.max(drag.m,Math.abs(dx));if(drag.m>6)flip(0,false);tgt=ang=drag.a+dx*.28;kick()});
const up=()=>{if(!drag)return;const m=drag.m;drag=null;o.classList.remove('drag');if(m>6)snap();idle=0;kick();o._m=m};
o.addEventListener('pointerup',up);o.addEventListener('pointercancel',up);
cs.forEach((c,i)=>c.addEventListener('click',e=>{if(o._m>6){o._m=0;return}if(e.target.closest('a'))return;const f=front();if(i===f)flip(i,flipped!==i);else{flip(0,false);const d=((i-f+N)%N);tgt=Math.round(tgt/STEP)*STEP-(d>N/2?d-N:d)*STEP;kick()}}));
o.querySelector('.prev').addEventListener('click',()=>go(-1));o.querySelector('.next').addEventListener('click',()=>go(1));
o.tabIndex=0;o.addEventListener('keydown',e=>{if(e.key==='ArrowLeft')go(-1);else if(e.key==='ArrowRight')go(1);else if(e.key==='Enter'||e.key===' '){e.preventDefault();flip(front(),flipped!==front())}});
addEventListener('resize',render);render();})();
