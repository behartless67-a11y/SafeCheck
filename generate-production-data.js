// Generate dummy check-in data for production testing
const https = require('https');
const fs = require('fs');
const path = require('path');

const PRODUCTION_URL = 'safe-check-n8vya7uto-ben-hartless-projects.vercel.app';

const locations = [
  'Garrett Hall - 2nd Floor - Room 201',
  'Garrett Hall - 2nd Floor - Room 215',
  'Garrett Hall - 1st Floor - Room 104',
  'Garrett Hall - Basement - Room B12',
  'Monroe Hall - Room 301',
  'Clark Hall - Room 215',
  'Thornton Hall - Room 410',
  'Rice Hall - Room 130',
  'Olsson Hall - Room 228',
  'Remote'
];

const notes = [
  'Safe and secure',
  'With team members',
  'Working from home office',
  'In meeting room',
  '',
  'At my desk',
  'Conference room',
  'Library',
  'Common area'
];

// Load users from the CSV file
function loadUsersFromCSV() {
  const csvPath = path.join(__dirname, 'api', 'groupExportAll_FBS_Community.csv');
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = csvContent.split('\n');

  const users = [];

  // Skip header row and empty rows
  for (let i = 1; i < lines.length && users.length < 100; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Parse CSV line (handle quoted fields)
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    if (!matches || matches.length < 3) continue;

    const uid = matches[0].replace(/"/g, '').trim();
    const displayName = matches[3].replace(/"/g, '').trim();

    // Skip group header lines or invalid entries
    if (uid && uid !== 'uid' && !uid.includes('groups:') && displayName) {
      users.push({
        uid: uid,
        name: displayName
      });
    }
  }

  console.log(`Loaded ${users.length} users from CSV`);
  return users;
}

function sendCheckIn(user, index) {
  return new Promise((resolve, reject) => {
    const location = locations[index % locations.length];
    const note = notes[index % notes.length];

    const postData = JSON.stringify({
      computingId: user.uid,
      name: user.name,
      location: location,
      notes: note,
      timestamp: new Date().toISOString()
    });

    const options = {
      hostname: PRODUCTION_URL,
      path: '/api/emergency-alert',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log(`[${index + 1}/100] ✓ ${user.name} checked in at ${location}`);
          resolve();
        } else {
          console.error(`[${index + 1}/100] ✗ Failed for ${user.name}: ${res.statusCode}`);
          reject(new Error(`HTTP ${res.statusCode}`));
        }
      });
    });

    req.on('error', (error) => {
      console.error(`[${index + 1}/100] ✗ Error for ${user.name}:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function generateProductionData() {
  console.log('Generating 100 check-ins for production...\n');
  console.log(`Target: https://${PRODUCTION_URL}\n`);

  const users = loadUsersFromCSV();

  if (users.length === 0) {
    console.error('No users loaded from CSV!');
    return;
  }

  for (let i = 0; i < users.length; i++) {
    try {
      await sendCheckIn(users[i], i);
      // Small delay between requests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));
    } catch (error) {
      console.error(`Failed to send check-in for ${users[i].name}`);
      // Continue with next user
    }
  }

  console.log(`\n✓ Generated ${users.length} check-ins successfully!`);
  console.log(`\nView at:`);
  console.log(`  Admin Dashboard: https://${PRODUCTION_URL}/admin`);
  console.log(`  Accountability Report: https://${PRODUCTION_URL}/accountability`);
}

generateProductionData().catch(console.error);
