(()=>{
'use strict';
const panel=document.getElementById('chord-lab');if(!panel)return;
const $=id=>document.getElementById(id),en=panel.dataset.lang==='en';
const root=$('chord-root'),mode=$('chord-mode'),quality=$('chord-quality'),arp=$('chord-arp'),speed=$('chord-speed'),status=$('chord-status');
const names=['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'];
const keys=[...panel.querySelectorAll('[data-midi]')];
let context,master,voices=[],timers=[],generation=0;
const noteName=n=>names[n%12]+(Math.floor(n/12)-1);
function notes(single=false){const n=Number(root.value);if(single||mode.value==='none')return[n];const minor=quality.value==='minor';const steps=[0,minor?3:4,7];if(['seventh','ninth'].includes(mode.value))steps.push(minor?10:11);if(mode.value==='ninth')steps.push(14);return steps.map(x=>x+n);}
function refresh(){const ns=notes();$('chord-input').textContent=noteName(Number(root.value));$('chord-output').textContent=ns.map(noteName).join(' · ');quality.disabled=mode.value==='none';for(const k of keys){const selected=Number(k.dataset.midi)===Number(root.value);k.classList.toggle('selected',selected);k.setAttribute('aria-pressed',String(selected));}}
function silence(){generation++;for(const t of timers)clearTimeout(t);timers=[];for(const v of voices){try{v.gain.gain.cancelScheduledValues(context.currentTime);v.gain.gain.setTargetAtTime(0,context.currentTime,.008);v.osc.stop(context.currentTime+.04);}catch{}}voices=[];keys.forEach(k=>k.classList.remove('sounding'));}
function later(fn,delay){timers.push(setTimeout(fn,Math.max(0,delay)));}
async function play(single=false){silence();const token=generation;try{if(!context){const AC=window.AudioContext||window.webkitAudioContext;if(!AC)throw Error('unsupported');context=new AC();master=context.createGain();master.gain.value=.65;master.connect(context.destination);}if(context.state==='suspended')await context.resume();if(token!==generation)return;const ns=notes(single),arpeggiate=arp.checked&&!single,step=arpeggiate?Number(speed.value):0;const start=context.currentTime+.04;
ns.forEach((n,i)=>{const t=start+i*step,osc=context.createOscillator(),gain=context.createGain();osc.type='triangle';osc.frequency.value=440*Math.pow(2,(n-69)/12);const level=.15/Math.sqrt(ns.length);gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(level,t+.015);gain.gain.exponentialRampToValueAtTime(.0001,t+.95);osc.connect(gain);gain.connect(master);osc.start(t);osc.stop(t+1);const voice={osc,gain};voices.push(voice);osc.onended=()=>{osc.disconnect();gain.disconnect();voices=voices.filter(v=>v!==voice);};later(()=>{const k=keys.find(k=>Number(k.dataset.midi)%12===n%12);if(k)k.classList.add('sounding');},40+i*step*1000);});
status.textContent=(en?(single?'Single note: ':'Output: '):(single?'原始单音：':'生成音：'))+ns.map(noteName).join(' · ')+(arpeggiate?(en?' · Arpeggio':' · 琶音'):'');later(()=>{keys.forEach(k=>k.classList.remove('sounding'));status.textContent=en?'Finished. Choose another key or change the settings.':'播放结束。可以换一个根音或调整设置继续试听。';},1100+(ns.length-1)*step*1000);
}catch{status.textContent=en?'Audio could not start. Please try clicking a play button in a browser with audio support.':'暂时无法启动声音，请在支持音频的浏览器中点击试听按钮重试。';}}
$('chord-single').addEventListener('click',()=>play(true));$('chord-play').addEventListener('click',()=>play());$('chord-stop').addEventListener('click',()=>{silence();status.textContent=en?'Sound stopped.':'声音已停止。';});
for(const k of keys)k.addEventListener('click',()=>{root.value=k.dataset.midi;refresh();play();});
for(const el of[root,mode,quality,arp,speed])el.addEventListener('change',()=>{silence();refresh();status.textContent=en?'Settings updated. Press a key to listen.':'设置已更新，点击琴键或试听按钮即可发声。';});
const keyboard=['a','w','s','e','d','f','t','g','y','h','u','j'];document.addEventListener('keydown',e=>{if(e.repeat||e.ctrlKey||e.metaKey||e.altKey||document.querySelector('dialog[open]'))return;const target=e.target;if(target.closest('input,select,textarea,[contenteditable="true"]'))return;const rect=panel.getBoundingClientRect();if(rect.bottom<0||rect.top>window.innerHeight)return;const i=keyboard.indexOf(e.key.toLowerCase());if(i<0)return;e.preventDefault();root.value=String(60+i);refresh();play();});
document.addEventListener('visibilitychange',()=>{if(document.hidden)silence();});window.addEventListener('pagehide',silence);document.querySelectorAll('video').forEach(v=>v.addEventListener('play',silence));refresh();
})();
