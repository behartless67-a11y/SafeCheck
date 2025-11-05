// Try to load KV, fallback to in-memory if not available
let kv;

try {
  kv = require('@vercel/kv').kv;
} catch (e) {
  console.warn('KV not available, using in-memory storage');
  kv = null;
}

// Use global in-memory storage if available (for local dev server)
const getInMemoryAlerts = () => {
  if (!global.inMemoryAlerts) global.inMemoryAlerts = [];
  return global.inMemoryAlerts;
};
const setAlertCount = (count) => { global.alertCount = count; };

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    let deletedCount = 0;

    if (kv && process.env.KV_REST_API_URL) {
      // Clear KV storage
      // Get current count first
      const alertData = await kv.lrange('alerts', 0, -1);
      deletedCount = alertData.length;

      // Delete the list
      await kv.del('alerts');

      // Reset the counter
      await kv.set('alert_count', 0);

      console.log(`Cleared ${deletedCount} check-ins from KV storage`);
    } else {
      // Clear in-memory storage
      const alerts = getInMemoryAlerts();
      deletedCount = alerts.length;
      global.inMemoryAlerts = [];
      setAlertCount(0);

      console.log(`Cleared ${deletedCount} check-ins from in-memory storage`);
    }

    res.json({
      success: true,
      message: `Successfully cleared ${deletedCount} check-ins`,
      deletedCount
    });

  } catch (error) {
    console.error('Error clearing data:', error);
    res.status(500).json({
      error: 'Failed to clear data',
      details: error.message
    });
  }
};
