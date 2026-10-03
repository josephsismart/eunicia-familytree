import { list, put } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const BLOB_PATH = 'wishlists.json';

  async function getWishlists() {
    try {
      const { blobs } = await list();
      const blob = blobs.find(b => b.pathname === BLOB_PATH);
      if (blob) {
        // cache-bust: Vercel Blob public URLs are CDN-cached, so append a timestamp for a fresh read
        const response = await fetch(blob.url + '?ts=' + Date.now(), { cache: 'no-store' });
        return await response.json();
      }
    } catch (e) {}
    return {};
  }

  async function saveWishlists(data) {
    await put(BLOB_PATH, JSON.stringify(data), {
      access: 'public',
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    });
  }

  try {
    if (req.method === 'GET') {
      const wishlists = await getWishlists();
      return res.status(200).json(wishlists);
    }

    if (req.method === 'POST') {
      const { memberId, item } = req.body;
      if (!memberId || !item) return res.status(400).json({ error: 'memberId and item required' });

      const wishlists = await getWishlists();
      if (!wishlists[memberId]) wishlists[memberId] = [];
      wishlists[memberId].push({ text: item, id: Date.now().toString(), addedAt: new Date().toISOString() });
      await saveWishlists(wishlists);
      return res.status(200).json(wishlists);
    }

    if (req.method === 'DELETE') {
      const { memberId, itemId } = req.body;
      if (!memberId || !itemId) return res.status(400).json({ error: 'memberId and itemId required' });

      const wishlists = await getWishlists();
      if (wishlists[memberId]) {
        wishlists[memberId] = wishlists[memberId].filter(i => i.id !== itemId);
      }
      await saveWishlists(wishlists);
      return res.status(200).json(wishlists);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
