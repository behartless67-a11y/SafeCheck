const { loadBattenUsers } = require('./load-users');

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
    const { computingId } = req.body;

    if (!computingId) {
      return res.status(400).json({ error: 'Computing ID is required' });
    }

    const userId = computingId.toLowerCase().trim();
    const user = authorizedUsers[userId];

    if (user) {
      res.json({
        success: true,
        user: {
          uid: user.uid,
          name: user.name,
          email: user.email
        }
      });
    } else {
      res.status(401).json({
        error: 'Not authorized. Computing ID not found in Batten School directory.'
      });
    }
  } catch (error) {
    console.error('Error validating user:', error);
    res.status(500).json({ error: 'Validation error' });
  }
};
