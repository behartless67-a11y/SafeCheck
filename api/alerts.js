// NOTE: Since serverless functions are stateless, we can't share the alerts array
// between emergency-alert.js and this file. For production, use a database.
// For now, this is a placeholder that returns empty alerts.

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

  // NOTE: In production, fetch from database
  // For now, returning empty array since serverless functions can't share state
  res.json({
    alerts: [],
    note: 'In-memory storage on serverless - alerts reset on cold start. Use a database for production.'
  });
};
