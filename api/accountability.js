const { loadBattenUsers } = require('./load-users');
const { loadStaffAndFaculty } = require('./load-staff');

// Load users once at cold start
const authorizedUsers = loadBattenUsers();
const staffAndFacultySet = loadStaffAndFaculty();

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
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get all check-ins from storage
    let alerts = [];

    if (kv && process.env.KV_REST_API_URL) {
      // Use KV storage
      const alertData = await kv.lrange('alerts', 0, -1);
      alerts = alertData.map(item => {
        // Handle both string and object responses from KV
        if (typeof item === 'string') {
          return JSON.parse(item);
        }
        return item;
      });
    } else {
      // Use in-memory storage
      alerts = getInMemoryAlerts();
    }

    // Create a set of computing IDs who have checked in
    const checkedInIds = new Set(alerts.map(alert => alert.computingId.toLowerCase()));

    // Categorize users
    const categorizedUsers = {
      staff: { checkedIn: [], notCheckedIn: [] },
      students: { checkedIn: [], notCheckedIn: [] }
    };

    // Process all authorized users
    Object.values(authorizedUsers).forEach(user => {
      const hasCheckedIn = checkedInIds.has(user.uid.toLowerCase());

      // Categorize as staff/faculty or student based on the staff list
      // Anyone in the staffAndFacultySet is staff, everyone else is a student
      const category = staffAndFacultySet.has(user.uid.toLowerCase()) ? 'staff' : 'students';

      const userInfo = {
        uid: user.uid,
        name: user.name,
        email: user.email
      };

      if (hasCheckedIn) {
        // Find the most recent check-in for this user
        const userAlerts = alerts.filter(a => a.computingId.toLowerCase() === user.uid.toLowerCase());
        const latestAlert = userAlerts.sort((a, b) =>
          new Date(b.timestamp) - new Date(a.timestamp)
        )[0];

        categorizedUsers[category].checkedIn.push({
          ...userInfo,
          location: latestAlert.location,
          notes: latestAlert.notes,
          timestamp: latestAlert.timestamp
        });
      } else {
        categorizedUsers[category].notCheckedIn.push(userInfo);
      }
    });

    // Sort all arrays by name
    ['staff', 'students'].forEach(category => {
      categorizedUsers[category].checkedIn.sort((a, b) => a.name.localeCompare(b.name));
      categorizedUsers[category].notCheckedIn.sort((a, b) => a.name.localeCompare(b.name));
    });

    // Calculate statistics
    const stats = {
      totalUsers: Object.keys(authorizedUsers).length,
      totalCheckedIn: checkedInIds.size,
      totalNotCheckedIn: Object.keys(authorizedUsers).length - checkedInIds.size,
      staff: {
        total: categorizedUsers.staff.checkedIn.length + categorizedUsers.staff.notCheckedIn.length,
        checkedIn: categorizedUsers.staff.checkedIn.length,
        notCheckedIn: categorizedUsers.staff.notCheckedIn.length
      },
      students: {
        total: categorizedUsers.students.checkedIn.length + categorizedUsers.students.notCheckedIn.length,
        checkedIn: categorizedUsers.students.checkedIn.length,
        notCheckedIn: categorizedUsers.students.notCheckedIn.length
      }
    };

    res.json({
      success: true,
      stats,
      users: categorizedUsers
    });

  } catch (error) {
    console.error('Error generating accountability report:', error);
    res.status(500).json({
      error: 'Failed to generate accountability report',
      details: error.message
    });
  }
};
