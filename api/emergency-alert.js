const { loadBattenUsers } = require('./load-users');

// Load users once at cold start
const authorizedUsers = loadBattenUsers();

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
const getAlertCount = () => global.alertCount || 0;
const setAlertCount = (count) => { global.alertCount = count; };

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

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { computingId, name, location, notes, timestamp } = req.body;

    // Validate required fields
    if (!computingId || !name || !location) {
      return res.status(400).json({
        error: 'Computing ID, name, and location are required'
      });
    }

    // Verify user is authorized
    const userId = computingId.toLowerCase().trim();
    const user = authorizedUsers[userId];

    if (!user) {
      return res.status(401).json({
        error: 'Unauthorized: Computing ID not found'
      });
    }

    // Store check-in
    let newAlertId;

    if (kv && process.env.KV_REST_API_URL) {
      // Use KV storage
      const currentCount = await kv.get('alert_count') || 0;
      newAlertId = currentCount + 1;

      const alert = {
        id: newAlertId,
        computingId: user.uid,
        name,
        email: user.email,
        location,
        notes,
        timestamp: timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString()
      };

      await kv.lpush('alerts', JSON.stringify(alert));
      await kv.set('alert_count', newAlertId);
    } else {
      // Fallback to in-memory storage
      const currentCount = getAlertCount();
      newAlertId = currentCount + 1;
      setAlertCount(newAlertId);

      const alert = {
        id: newAlertId,
        computingId: user.uid,
        name,
        email: user.email,
        location,
        notes,
        timestamp: timestamp || new Date().toISOString(),
        receivedAt: new Date().toISOString()
      };

      getInMemoryAlerts().push(alert);
    }

    console.log(`Check-in recorded for ${name} at ${location} (ID: ${newAlertId})`);

    res.json({
      success: true,
      message: 'Location check-in recorded successfully',
      alertId: newAlertId
    });

  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({
      error: 'Failed to record check-in',
      details: error.message
    });
  }
};
