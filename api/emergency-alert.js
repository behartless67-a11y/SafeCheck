const { loadBattenUsers } = require('./load-users');

// Load users once at cold start
const authorizedUsers = loadBattenUsers();

// In-memory storage (NOTE: This will reset on each deployment and cold start)
// For production, you'd want to use a database like Vercel KV, Postgres, etc.
let alerts = [];

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
    const alert = {
      id: alerts.length + 1,
      computingId: user.uid,
      name,
      email: user.email,
      location,
      notes,
      timestamp: timestamp || new Date().toISOString(),
      receivedAt: new Date().toISOString()
    };
    alerts.push(alert);

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
