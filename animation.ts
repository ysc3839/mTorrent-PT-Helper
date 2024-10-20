function waitAnimationFrame() {
  return new Promise(r => requestAnimationFrame(r));
}

function waitAnimationEnd(e: HTMLElement) {
  return new Promise<void>(resolve => {
    const onEnd = () => {
      e.removeEventListener('transitionend', onEnd, true);
      e.removeEventListener('animationend', onEnd, true);
      resolve();
    };
    e.addEventListener('transitionend', onEnd, true);
    e.addEventListener('animationend', onEnd, true);
  });
}

export async function doAnimation(e: HTMLElement, name: string, enter: boolean) {
  const origCls = e.className;
  const dir = enter ? 'enter' : 'leave';
  const animCls = origCls + ` ${name} ${name}-${dir} ${name}-${dir}-`;
  e.className = animCls + 'prepare';
  await waitAnimationFrame();
  e.className = animCls + 'start';
  await waitAnimationFrame();
  e.className = animCls + 'active';
  await waitAnimationEnd(e);
  e.className = origCls;
}
