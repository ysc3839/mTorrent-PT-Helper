export function E(tag: string | null, attr: any, ...nodes: (string | Node)[]) {
  const ns = attr?.xmlns,
    e = tag ? (ns ? document.createElementNS(ns, tag) : document.createElement(tag)) : new DocumentFragment();
  if (attr) {
    delete attr.xmlns;
    for (const k in attr) {
      const v = attr[k];
      if (typeof v === 'function') {
        e.addEventListener(k, v);
      } else {
        (e as HTMLElement).setAttribute(k, v);
      }
    }
  }
  e.append(...nodes);
  return e;
}
