const apiUrls = (() => {
  let urls: URL[] = [];
  try {
    urls = (_APIHOSTS as string[]).map(u => new URL(u));
  } catch (e) {
    console.warn('get _APIHOSTS error:', e);
  }
  urls.push(new URL(location.origin + '/api'));
  return urls;
})();

export function isApiUrlWithPath(u: URL, path: string) {
  for (const a of apiUrls) {
    if (u.origin === a.origin && u.pathname === a.pathname + path)
      return true;
  }
  return false;
}

function getApiUrl() {
  return localStorage.getItem("apiHost") || apiUrls[(Math.random() * apiUrls.length) | 0].href;
}

function getAuth() {
  return localStorage.getItem("auth")!;
}

function getApiFetchOptions(): RequestInit {
  return { method: 'POST', headers: { authorization: getAuth() } };
}

export async function genDlToken(id: string): Promise<string | null> {
  const f = new FormData();
  f.set('id', id);
  const opts = getApiFetchOptions();
  opts.body = f;
  const res = await fetch(getApiUrl() + '/torrent/genDlToken', opts);
  const data = await res.json();
  if (data.code !== '0') {
    console.error('genDlToken API error:', data);
    return null;
  }
  return data.data;
}

export async function getTorrentPeers(id: string): Promise<any> {
  const f = new FormData();
  f.set('id', id);
  const opts = getApiFetchOptions();
  opts.body = f;
  const res = await fetch(getApiUrl() + '/torrent/peers', opts);
  const data = await res.json();
  if (data.code !== '0') {
    console.error('getTorrentPeers API error:', data);
    return null;
  }
  return data.data;
}
