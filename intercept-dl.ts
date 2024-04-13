import { modifierState } from './keystate.ts';

(() => {
  navigation!.addEventListener('navigate', e => {
    console.log('navigate', e);
    if (!modifierState && e.cancelable && !e.hashChange && e.navigationType === 'push') {
      const url = e.destination.url, u = new URL(url);
      if (u.origin === location.origin && u.pathname === '/api/rss/dl') {
        e.preventDefault();
        navigator.clipboard.writeText(url);
      }
    }
  });
})();
