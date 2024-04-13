export let specialClass: string;

export function waitForContent(): Promise<Element> {
  const e = document.getElementsByClassName('mx-auto')[0];
  if (e) return Promise.resolve(e);
  return new Promise(resolve => {
    const root = document.getElementById('root')!;
    new MutationObserver(function (records) {
      for (const r of records) {
        for (const n of r.addedNodes) {
          if (n.nodeType === Node.ELEMENT_NODE && (n as Element).id === 'app-content') {
            this.disconnect();
            for (const c of (n as Element).classList) {
              if (c.startsWith('css-')) { // css-1rl0vao
                specialClass = c;
                break;
              }
            }
            const e = (n as Element).getElementsByClassName('mx-auto')[0];
            resolve(e);
            return;
          }
        }
      }
    }).observe(root, { childList: true });
  });
}
