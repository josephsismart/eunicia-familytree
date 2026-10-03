import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      // List blobs and find the family data
      const { blobs } = await list();
      const dataBlob = blobs.find(b => b.pathname === 'familytree-data.json') || blobs.find(b => b.pathname.includes('family'));

      if (dataBlob) {
        const response = await fetch(dataBlob.url + '?ts=' + Date.now(), { cache: 'no-store' });
        const data = await response.json();
        return res.status(200).json(data);
      }

      return res.status(404).json({ error: 'No family data found' });
    }

    if (req.method === 'POST') {
      const { put } = await import('@vercel/blob');
      const data = req.body;

      const blob = await put('familytree-data.json', JSON.stringify(data), {
        access: 'public',
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      });

      return res.status(200).json(data);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
