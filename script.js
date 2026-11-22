'use strict';
const $ = (id) => document.getElementById(id);
const stages = [...document.querySelectorAll('.stage')];
const config = typeof BIRTHDAY_CONTENT === 'undefined' ? {} : BIRTHDAY_CONTENT;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const music = $('backgroundMusic');
let stage = -1, musicOn = false;
const setMessage = (id, text) => {
  const el=$(id);if(!el)return;
  el.textContent=text;
  if (!reduceMotion && el.closest('.stage')?.classList.contains('active')) {
    el.animate([{opacity:0,filter:'blur(5px)'},{opacity:1,filter:'blur(0)'}],{duration:700,easing:'ease-out'});
  }
};
function applyContent(){
  (config.messages || []).forEach((m,i)=>setMessage('message'+i,m));
  (config.photos || []).forEach((file, index)=>{
    if (!file) return;
    document.querySelectorAll(`[data-photo="${index}"]`).forEach(slot=>putImage(slot,file));
    if(index===5) $('photoReveal').classList.add('has-picture');
  });
  (config.stickers || []).forEach((file,index)=>{
    if (!file) return;
    document.querySelectorAll(`[data-sticker="${index}"]`).forEach(slot=>putImage(slot,file));
  });
  (config.noteStickers || []).forEach((file,index)=>{
    if (!file) return;
    const note=document.querySelector(`.note-slot[data-note="${index}"]`);
    if (note) putImage(note,file);
  });
  renderStageGalleries(config.galleryByStage || []);
  if (Array.isArray(config.music) && config.music.some(Boolean)) $('soundControl').hidden=false;
}
function putImage(slot,filename){
  const img=document.createElement('img');img.src=filename;img.alt='';img.loading='eager';
  img.addEventListener('error',()=>{img.remove();slot.classList.remove('has-image')});
  slot.appendChild(img);slot.classList.add('has-image');
}

function renderStageGalleries(galleries){
  const placements=[
    ['mf tl small','mf tr medium','mf br small'],
    ['mf bl medium','mf tr small','mf tc small'],
    ['mf tl medium','mf br medium','mf lc small'],
    ['mf tr medium','mf bl small','mf rc small'],
    ['mf tl small','mf bc medium','mf tr small'],
    ['mf lc medium','mf rc medium','mf tc small']
  ];
  document.querySelectorAll('.memory-field').forEach((field,stageIndex)=>{
    const files=(galleries[stageIndex]||[]).filter(Boolean);
    const classes=placements[stageIndex % placements.length];
    files.forEach((file,i)=>{
      const frame=document.createElement('div');
      frame.className=classes[i % classes.length];
      frame.style.setProperty('--delay', `${220 + i*180}ms`);
      frame.style.setProperty('--rotate', `${(i%2===0?1:-1)*(4+i*1.6)}deg`);
      const img=document.createElement('img');
      img.src=file; img.alt=''; img.loading='eager';
      frame.appendChild(img);
      field.appendChild(frame);
    });
  });
}

function playCurrentMusic(){
  const track=config.music?.[stage];
  if (!musicOn || !track) {music.pause();return;}
  const url=new URL(track,document.baseURI).href;
  if (music.src!==url) music.src=url;
  music.volume=.45;
  music.play().catch(()=>{musicOn=false;$('soundControl').setAttribute('aria-pressed','false')});
}
$('soundControl').addEventListener('click',()=>{musicOn=!musicOn;$('soundControl').setAttribute('aria-pressed',String(musicOn));playCurrentMusic();});
function showStage(number){
  if (number < 0 || number >= stages.length || number < stage) return;
  stage=number;
  stages.forEach((s,i)=>{s.classList.toggle('active',i===number);s.setAttribute('aria-hidden',String(i!==number));});
  if (number === 2) $('scrollArea').scrollTop=0;
  playCurrentMusic();
}
$('loginForm').addEventListener('submit',ev=>{
  ev.preventDefault();if (stage >= 0) return;
  $('loginButton').disabled=true;
  musicOn = true;
  $('soundControl').hidden = !(Array.isArray(config.music) && config.music.some(Boolean));
  $('soundControl').setAttribute('aria-pressed','true');
  // Start playback during the actual login click (required by most mobile browsers).
  const firstTrack=config.music?.[0];
  if(firstTrack){
    music.src=new URL(firstTrack,document.baseURI).href;
    music.volume=.45;
    music.play().catch(()=>{musicOn=false;$('soundControl').setAttribute('aria-pressed','false')});
  }
  $('blackout').classList.add('visible');
  setTimeout(()=>{$('login').classList.add('dismissed');$('story').classList.add('visible');$('story').setAttribute('aria-hidden','false');showStage(0)},reduceMotion?100:1250);
  setTimeout(()=>$('blackout').classList.remove('visible'),reduceMotion?180:2300);
});
$('next0').addEventListener('click',()=>showStage(1));
// Drag the dot to the empty ring; touch or keyboard can also use two taps.
let armed=false,drag=null,placed=false;
const dot=$('dot'),destination=$('destination');
dot.addEventListener('pointerdown',ev=>{if(placed)return;drag={x:ev.clientX,y:ev.clientY,moved:false};dot.setPointerCapture?.(ev.pointerId)});
dot.addEventListener('pointermove',ev=>{if(!drag||placed)return;const dx=ev.clientX-drag.x,dy=ev.clientY-drag.y; if(Math.hypot(dx,dy)>6)drag.moved=true;dot.style.transform=`translate(${dx}px,${dy}px)`});
dot.addEventListener('pointerup',ev=>{if(!drag||placed)return;const dragged=drag.moved;drag=null;if(dragged){const r=destination.getBoundingClientRect();if(ev.clientX>r.left-22 && ev.clientX<r.right+22 && ev.clientY>r.top-22 && ev.clientY<r.bottom+22){completeDot();return;}dot.style.transform='';}});
dot.addEventListener('pointercancel',()=>{drag=null;dot.style.transform=''});
dot.addEventListener('click',()=>{if(placed)return;armed=!armed;dot.classList.toggle('armed',armed);dot.setAttribute('aria-pressed',String(armed))});
destination.addEventListener('click',()=>{if(armed&&!placed)completeDot();});
function completeDot(){placed=true;dot.hidden=true;destination.classList.add('filled');setMessage('message1',config.afterPuzzle||'Like you and me.');$('next1').hidden=false;}
$('next1').addEventListener('click',()=>showStage(2));
// The messages physically leave the viewport in each scrolling direction.
// Only once the viewport is empty do we cover it with black, lock scrolling,
// reveal the next scene, and allow movement in the opposite direction.
let scrollPhase='down';
const scroller=$('scrollArea');
const blackCurtain=$('scrollBlackout');
const firstPanel=$('scrollFirstPanel');
const returnPanel=$('scrollReturnPanel');
const scrollMax=()=>scroller.scrollHeight-scroller.clientHeight;
function performScrollCurtain(direction){
  if(scrollPhase!==(direction==='down'?'down':'up'))return;
  scrollPhase='transitioning';
  const max=scrollMax();
  scroller.scrollTop=direction==='down'?max:0;
  scroller.classList.add('is-locked');
  blackCurtain.classList.add('visible');
  const fade=reduceMotion?25:400;
  window.setTimeout(()=>{
    if(direction==='down'){
      firstPanel.classList.add('not-visible');
      returnPanel.classList.add('revealed');
      returnPanel.setAttribute('aria-hidden','false');
      $('scrollDownMessage').textContent=config.scrollDown||'I wish I could keep every moment forever.';
    }else{
      returnPanel.classList.remove('revealed');
      returnPanel.setAttribute('aria-hidden','true');
      firstPanel.classList.remove('not-visible');
      setMessage('scrollMessage',config.scrollUp||'And I would choose you all over again.');
      $('scrollCue').hidden=true;
      $('next2').hidden=false;
    }
    window.setTimeout(()=>{
      blackCurtain.classList.remove('visible');
      if(direction==='down'){
        scrollPhase='up';
        scroller.classList.remove('is-locked');
      }else{
        scrollPhase='complete';
        // The final message remains locked in place until the arrow is pressed.
      }
    },reduceMotion?25:160);
  },fade);
}
scroller.addEventListener('scroll',()=>{
  if(stage!==2||scrollPhase==='transitioning'||scrollPhase==='complete')return;
  const max=scrollMax();
  if(max<10)return;
  const progress=scroller.scrollTop/max;
  if(scrollPhase==='down'&&progress>=.96)performScrollCurtain('down');
  else if(scrollPhase==='up'&&progress<=.04)performScrollCurtain('up');
});
// Make trackpad, touch, wheel and keyboard scrolling truly native.
$('next2').addEventListener('click',()=>showStage(3));
// A genuine continuous hold is mandatory: clicks/taps cannot bypass it.
const holdButton=$('holdButton');
const explosion=$('holdExplosion');
const fireworkCanvas=$('fireworkCanvas');
let holding=false,holdStart=0,holdFrame=0,revealed=false,holdPointer=null;
const HOLD_DURATION=1550;
function resetHold(){
  holding=false;
  if(holdFrame)cancelAnimationFrame(holdFrame);
  holdFrame=0;
  if(!revealed)holdButton.style.setProperty('--progress','0%');
}
function finishHold(){
  if(revealed)return;
  revealed=true;
  resetHold();
  holdButton.style.setProperty('--progress','100%');
  holdButton.disabled=true;
  beginFirework();
  window.setTimeout(()=>explosion.classList.add('blackout'),reduceMotion?75:1170);
  window.setTimeout(()=>{
    $('photoReveal').classList.add('revealed');
    setMessage('message3',config.afterPhoto||'Everything feels better with you.');
    holdButton.hidden=true;
    $('next3').hidden=false;
  },reduceMotion?125:1570);
  window.setTimeout(()=>explosion.classList.add('clearing'),reduceMotion?150:1950);
  window.setTimeout(()=>{explosion.classList.remove('active','blackout','clearing');stopFireworks();},reduceMotion?200:2750);
}
function tickHold(now){
  if(!holding||revealed)return;
  const ratio=Math.min(1,(now-holdStart)/HOLD_DURATION);
  holdButton.style.setProperty('--progress',`${ratio*100}%`);
  if(ratio>=1){finishHold();return;}
  holdFrame=requestAnimationFrame(tickHold);
}
function beginHold(){
  if(revealed||holding)return;
  holding=true;
  holdStart=performance.now();
  holdFrame=requestAnimationFrame(tickHold);
}
holdButton.addEventListener('pointerdown',ev=>{
  if(ev.pointerType==='mouse'&&ev.button!==0)return;
  ev.preventDefault();
  holdPointer=ev.pointerId;
  beginHold();
  try{holdButton.setPointerCapture(ev.pointerId)}catch(_e){}
});
holdButton.addEventListener('pointerup',ev=>{
  if(holdPointer===ev.pointerId){holdPointer=null;resetHold();}
});
for(const type of ['pointercancel','lostpointercapture']){
  holdButton.addEventListener(type,ev=>{
    if(holdPointer===ev.pointerId){holdPointer=null;resetHold();}
  });
}
holdButton.addEventListener('pointerleave',ev=>{
  if(ev.pointerType==='mouse'&&!holdButton.hasPointerCapture?.(ev.pointerId))resetHold();
});
holdButton.addEventListener('keydown',ev=>{
  if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();if(!ev.repeat)beginHold();}
});
holdButton.addEventListener('keyup',ev=>{
  if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();resetHold();}
});
holdButton.addEventListener('blur',resetHold);
holdButton.addEventListener('click',ev=>ev.preventDefault());
holdButton.addEventListener('contextmenu',ev=>ev.preventDefault());

// Silver-white fireworks on black: dramatic but restrained, no pink or cosmos.
let fireworkAnimation=0,fireworkParticles=[];
function beginFirework(){
  explosion.classList.remove('clearing','blackout');
  explosion.classList.add('active');
  if(reduceMotion)return;
  const ctx=fireworkCanvas.getContext('2d');
  const ratio=Math.min(2,window.devicePixelRatio||1);
  const width=window.innerWidth,height=window.innerHeight;
  fireworkCanvas.width=Math.round(width*ratio);
  fireworkCanvas.height=Math.round(height*ratio);
  fireworkCanvas.style.width=width+'px';fireworkCanvas.style.height=height+'px';
  ctx.setTransform(ratio,0,0,ratio,0,0);
  fireworkParticles=[];
  let seed=2719;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  const buttonRect=holdButton.getBoundingClientRect();
  const centerX=buttonRect.left+buttonRect.width/2;
  const centerY=buttonRect.top+buttonRect.height/2;
  const extent=Math.max(width,height);
  const bursts=[{x:centerX,y:centerY,at:0,count:240,speed:extent*.018},
    {x:width*.29,y:height*.35,at:110,count:190,speed:extent*.016},
    {x:width*.72,y:height*.64,at:210,count:210,speed:extent*.018},
    {x:width*.72,y:height*.20,at:320,count:155,speed:extent*.014}];
  const begin=performance.now();
  const draw=(now)=>{
    const elapsed=now-begin;
    ctx.clearRect(0,0,width,height);
    for(const burst of bursts){
      if(burst.done||elapsed<burst.at)continue;
      burst.done=true;
      for(let i=0;i<burst.count;i++){
        const angle=random()*Math.PI*2;
        const velocity=burst.speed*(.42+random()*.75);
        fireworkParticles.push({x:burst.x,y:burst.y,vx:Math.cos(angle)*velocity,vy:Math.sin(angle)*velocity,
          life:1,size:.7+random()*2.8,drag:.969+random()*.013,brightness:Math.floor(210+random()*45)});
      }
    }
    ctx.globalCompositeOperation='lighter';
    for(const particle of fireworkParticles){
      if(particle.life<=0)continue;
      particle.x+=particle.vx;particle.y+=particle.vy;
      particle.vx*=particle.drag;particle.vy=particle.vy*particle.drag+.015;
      particle.life-=.013+particle.size*.0017;
      const alpha=Math.max(0,particle.life);
      ctx.beginPath();ctx.fillStyle=`rgba(${particle.brightness},${particle.brightness},${particle.brightness},${Math.min(.95,alpha)})`;
      ctx.arc(particle.x,particle.y,particle.size*alpha,0,Math.PI*2);ctx.fill();
      if(particle.size>1.4){
        ctx.beginPath();ctx.strokeStyle=`rgba(240,240,240,${alpha*.25})`;
        ctx.lineWidth=Math.max(.3,particle.size*.4);
        ctx.moveTo(particle.x,particle.y);
        ctx.lineTo(particle.x-particle.vx*2.8,particle.y-particle.vy*2.8);
        ctx.stroke();
      }
    }
    ctx.globalCompositeOperation='source-over';
    if(elapsed<1600)fireworkAnimation=requestAnimationFrame(draw);
  };
  fireworkAnimation=requestAnimationFrame(draw);
}
function stopFireworks(){
  if(fireworkAnimation)cancelAnimationFrame(fireworkAnimation);
  fireworkAnimation=0;fireworkParticles=[];
  fireworkCanvas.getContext('2d')?.clearRect(0,0,fireworkCanvas.width,fireworkCanvas.height);
}
$('next3').addEventListener('click',()=>showStage(4));
// Each sticker placeholder reveals only a single centered message.
const opened=new Set();
document.querySelectorAll('.note-slot').forEach(b=>b.addEventListener('click',()=>{
 const i=Number(b.dataset.note);opened.add(i);b.classList.add('seen');setMessage('notesMessage',config.notes?.[i]||'I love you.');
 if(opened.size===3)$('next4').hidden=false;
}));
$('next4').addEventListener('click',()=>showStage(5));
// Very dense full-screen out-of-focus camera lights, never photos or a space scene.
// Staggered entrance, a gentle scale rebound, then subtle floating motion.
function prepareBokeh(){
  const layer=$('bokehBurst');
  const colors=['82,158,255','253,189,93','81,205,183','245,126,77',
                '157,154,238','163,210,104','104,207,246','235,208,128'];
  const placements=[];
  let seed=10919;
  const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296};
  for(let row=0;row<11;row++)for(let col=0;col<16;col++){
    const x=-3+(col+.18+random()*.75)*106/16;
    const y=-4+(row+.18+random()*.75)*108/11;
    placements.push({x,y,size:10+random()*16,rgb:colors[Math.floor(random()*colors.length)],order:random()});
  }
  const delayOrder=placements.map((p,i)=>i).sort((a,b)=>placements[a].order-placements[b].order);
  delayOrder.forEach((index,i)=>{
    const p=placements[index];const light=document.createElement('span');
    light.className='bokeh';
    light.style.setProperty('--x',p.x.toFixed(2)+'%');
    light.style.setProperty('--y',p.y.toFixed(2)+'%');
    light.style.setProperty('--size',p.size.toFixed(2)+'vmin');
    light.style.setProperty('--rgb',p.rgb);
    light.style.setProperty('--delay',(i*12+Math.floor(random()*15))+'ms');
    light.style.setProperty('--duration',(460+Math.floor(random()*230))+'ms');
    light.style.setProperty('--float-duration',(2800+Math.floor(random()*2300))+'ms');
    light.style.setProperty('--float-x',(random()*14-7).toFixed(1)+'px');
    light.style.setProperty('--float-y',(random()*16-8).toFixed(1)+'px');
    light.innerHTML='<span class="bokeh-orb"></span>';
    layer.appendChild(light);
  });
}
prepareBokeh();
let giftDelay = 0;
$('finishButton').addEventListener('click',()=>{
  setMessage('finalMessage',config.finalMessage||'Happy Birthday, my love.\nI love you so much.');
  $('finishButton').hidden=true;
  $('bokehBurst').classList.add('active');
  // First the lights fill the screen; then the gift arrives underneath the final message.
  window.clearTimeout(giftDelay);
  giftDelay=window.setTimeout(()=>{
    const gift=$('giftButton');
    gift.hidden=false;
    gift.classList.add('appearing');
  },reduceMotion?150:2350);
});

const birthdayVideo=$('birthdayVideo');
const videoOverlay=$('videoOverlay');
let wasMusicPlayingBeforeVideo=false;
$('giftButton').addEventListener('click',()=>{
  wasMusicPlayingBeforeVideo=!music.paused;
  music.pause();
  videoOverlay.hidden=false;
  birthdayVideo.currentTime=0;
  // This is called directly from a user tap/click, allowing audio on most browsers.
  birthdayVideo.play().catch(()=>{ /* Native video controls still permit manual play. */ });
  $('videoClose').focus({preventScroll:true});
});
function closeBirthdayVideo(){
  if(videoOverlay.hidden)return;
  birthdayVideo.pause();
  birthdayVideo.currentTime=0;
  videoOverlay.hidden=true;
  if(wasMusicPlayingBeforeVideo && musicOn)playCurrentMusic();
  $('giftButton').focus({preventScroll:true});
}
$('videoClose').addEventListener('click',closeBirthdayVideo);
document.addEventListener('keydown',ev=>{
  if(ev.key==='Escape'&&!videoOverlay.hidden){ev.preventDefault();closeBirthdayVideo();}
});
applyContent();
