import { isApiUrlWithPath } from './api.ts';

const xhr = XMLHttpRequest;
const xhrPrototypeProxy = new Proxy(xhr.prototype, {
  get(target, prop, receiver) {
    const v = Reflect.get(...arguments);
    if (prop === 'responseText') {
      const u = new URL(receiver.responseURL);
      if (isApiUrlWithPath('/torrent/peers')) {
        XMLHttpRequest = xhr;
        const data = JSON.parse(v);
        if (data.code === '0') {
          (data.data as any[]).sort((a, b) => {
            return parseInt(a.left, 10) - parseInt(b.left, 10);
          });
          return JSON.stringify(data);
        }
      }
    }
    return v;
  }
});
const xhrProxy = new Proxy(xhr, {
  construct() {
    const o: any = Reflect.construct(...arguments);
    Object.setPrototypeOf(o, xhrPrototypeProxy);
    return o;
  }
});

export function hookXHR(enable) {
  XMLHttpRequest = enable ? xhrProxy : xhr;
}
