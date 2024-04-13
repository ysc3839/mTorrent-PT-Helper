export let modifierState = false;
(() => {
  const onkey = (e: KeyboardEvent) => {
    if (!e.repeat) {
      modifierState = e.altKey || e.ctrlKey || e.metaKey || e.shiftKey;
    }
  };
  document.addEventListener('keydown', onkey);
  document.addEventListener('keyup', onkey);
})();
