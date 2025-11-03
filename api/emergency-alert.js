const { loadBattenUsers } = require('./load-users');
const { kv } = require('@vercel/kv');

// Load users once at cold start
const authorizedUsers = loadBattenUsers();

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

    // Get current alert count for ID generation
    const alertCount = await kv.get('alert_count') || 0;
    const newAlertId = alertCount + 1;

    // Store check-in
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

    // Save to KV storage
    await kv.lpush('alerts', JSON.stringify(alert));
    await kv.set('alert_count', newAlertId);

    console.log(`Check-in recorded for ${name} at ${location} (ID: ${alert.id})`);

    res.json({
      success: true,
      message: 'Location check-in recorded successfully',
      alertId: alert.id
    });

  } catch (error) {
    console.error('Error recording check-in:', error);
    res.status(500).json({
      error: 'Failed to record check-in',
      details: error.message
    });
  }
};
