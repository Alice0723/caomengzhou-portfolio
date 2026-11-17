const host = document.querySelector('#museum-world');
if (host) {
  const en = host.dataset.lang === 'en';
  const stage = host.querySelector('.scene-stage');
  const slides = [...stage.querySelectorAll('.scene-image')];
  const buttons = [...host.querySelectorAll('[data-world-face]')];
  const title = host.querySelector('.world-title');
  const caption = host.querySelector('.world-caption');
  const labels = en
    ? ['The museum lover', 'The concert-going me', 'The music technologist']
    : ['文博的我', '追星的我', '音乐科技的我'];
  const captions = en
    ? ['Clay, history, and a little curiosity.', 'A bowl of savory congee, a sea of lights.', 'Turning sound and ideas into experiences.']
    : ['在器物与历史之间，收藏好奇心。', '一碗咸粥，装下灯海与彩带。', '让声音、程序与想象，一起发生。'];

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let active = -1;
  let transition;
  let outgoing;
  let captionTransition;
  function select(index) {
    const next = (index + slides.length) % slides.length;
    if (next === active) return;
    const previous = active;
    transition?.cancel();
    captionTransition?.cancel();
    outgoing?.removeAttribute('data-outgoing');
    active = next;
    slides.forEach((slide, i) => slide.setAttribute('aria-hidden', String(i !== active)));
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === active)));
    title.textContent = labels[active];
    caption.textContent = captions[active];

    const incoming = slides[active];
    if (previous < 0 || reduced.matches || !incoming.animate) return;
    outgoing = slides[previous];
    outgoing.setAttribute('data-outgoing', '');
    const direction = (active - previous + slides.length) % slides.length === 1 ? 1 : -1;
    const animation = incoming.animate(
      [{opacity: 0, transform: `translateX(${8 * direction}px)`}, {opacity: 1, transform: 'translateX(0)'}],
      {duration: 480, easing: 'cubic-bezier(.22,.61,.36,1)'}
    );
    transition = animation;
    animation.onfinish = () => {
      if (transition === animation) outgoing.removeAttribute('data-outgoing');
    };
    captionTransition = caption.animate([{opacity: .45}, {opacity: 1}], {duration: 420, easing: 'ease-out'});
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
  select(0);
}
