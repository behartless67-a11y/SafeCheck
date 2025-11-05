// Try to load KV, fallback to in-memory if not available
let kv;
try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  console.warn('KV not available, using in-memory storage');
  kv = null;
}

// Use global in-memory storage if available (for local dev server)
const getInMemoryAlerts = () => global.inMemoryAlerts || [];

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let alerts = [];

    if (kv && process.env.KV_REST_API_URL) {
      // Fetch from KV storage
      const alertData = await kv.lrange('alerts', 0, -1);
      alerts = alertData.map(item => {
        // Handle both string and object responses from KV
        if (typeof item === 'string') {
          return JSON.parse(item);
        }
        return item;
      });

      // Sort by timestamp (most recent first)
      alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    } else {
      // Use in-memory storage
      alerts = getInMemoryAlerts();
      // Sort by timestamp (most recent first)
      alerts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    res.json({ alerts });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    res.status(500).json({
      error: 'Failed to fetch alerts',
      alerts: []
    });
  }
};
