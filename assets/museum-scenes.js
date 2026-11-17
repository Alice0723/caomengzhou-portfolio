const host = document.querySelector('#museum-world');
if (host) {
  const en = host.dataset.lang === 'en';
  const stage = host.querySelector('.scene-stage');
  const slides = [...stage.querySelectorAll('.scene-image')];
  const buttons = [...host.querySelectorAll('[data-world-face]')];
  const title = host.querySelector('.world-title');
  const caption = host.querySelector('.world-caption');
  const status = host.querySelector('.world-status');
  const labels = en
    ? ['The museum lover', 'The concert-going me', 'The music technologist']
    : ['文博的我', '追星的我', '音乐科技的我'];
  const captions = en
    ? ['Clay, history, and a little curiosity.', 'A bowl of savory congee, a sea of lights.', 'Turning sound and ideas into experiences.']
    : ['在器物与历史之间，收藏好奇心。', '一碗咸粥，装下灯海与彩带。', '让声音、程序与想象，一起发生。'];

  let active = 0;
  function select(index) {
    active = (index + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== active)));
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
    title.textContent = labels[active];
    caption.textContent = captions[active];
    status.textContent = '';
  }

  buttons.forEach((button, i) => button.addEventListener('click', () => select(i)));
  host.addEventListener('keydown', event => {
    if (!stage.contains(event.target) && !buttons.includes(event.target)) return;
    if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
    event.preventDefault();
    select(active + (event.key === 'ArrowRight' ? 1 : -1));
    if (buttons.includes(event.target)) buttons[active].focus();
  });

  let touchStart;
  stage.addEventListener('pointerdown', event => {
    if (event.pointerType !== 'mouse' && event.isPrimary) {
      touchStart = {x: event.clientX, y: event.clientY};
      stage.setPointerCapture(event.pointerId);
    }
  });
  stage.addEventListener('pointercancel', () => { touchStart = undefined; });
  stage.addEventListener('pointerup', event => {
    if (!touchStart || !event.isPrimary) return;
    const x = event.clientX - touchStart.x;
    const y = event.clientY - touchStart.y;
    touchStart = undefined;
    if (Math.abs(x) > 38 && Math.abs(x) > Math.abs(y)) select(active + (x < 0 ? 1 : -1));
  });

  const motion = matchMedia('(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
  stage.addEventListener('pointermove', event => {
    if (!motion.matches || event.pointerType !== 'mouse') return;
    const bounds = stage.getBoundingClientRect();
    stage.style.setProperty('--scene-x', ((event.clientX - bounds.left) / bounds.width - .5) * 9 + 'px');
    stage.style.setProperty('--scene-y', ((event.clientY - bounds.top) / bounds.height - .5) * 7 + 'px');
  });
  stage.addEventListener('pointerleave', () => {
    stage.style.removeProperty('--scene-x');
    stage.style.removeProperty('--scene-y');
  });
  let audio;host.querySelector('[data-world-sound]').addEventListener('click',async()=>{try{const face=active;audio??=new(window.AudioContext||window.webkitAudioContext)();await audio.resume();const now=audio.currentTime;const pitches=face===0?[105]:face===1?[523.25,659.25,783.99]:[261.63,329.63,392,523.25];pitches.forEach((f,i)=>{const o=audio.createOscillator(),g=audio.createGain(),t=now+i*.12;o.type=face===0?'sine':'triangle';o.frequency.setValueAtTime(f,t);if(face===0)o.frequency.exponentialRampToValueAtTime(45,t+.25);g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.11,t+.012);g.gain.exponentialRampToValueAtTime(.0001,t+.8);o.connect(g);g.connect(audio.destination);o.start(t);o.stop(t+.85);o.onended=()=>{o.disconnect();g.disconnect();};});status.textContent=en?'A small sound from this world.':'听见这张展景的小小回声。';}catch{status.textContent=en?'Audio is unavailable in this browser.':'当前浏览器暂时无法播放声音。';}});
  select(0);
}
