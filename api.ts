export async function genDlToken(id: string): Promise<string | null> {
  const f = new FormData();
  f.set('id', id);
  const res = await fetch('/api/torrent/genDlToken', { method: 'POST', body: f });
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
  const res = await fetch('/api/torrent/peers', { method: 'POST', body: f });
  const data = await res.json();
  if (data.code !== '0') {
    console.error('getTorrentPeers API error:', data);
    return null;
  }
  return data.data;
}
