// Generate dummy check-in data for testing
const http = require('http');

const locations = [
  'Garrett Hall - 2nd Floor - Room 201',
  'Garrett Hall - 2nd Floor - Room 215',
  'Garrett Hall - 1st Floor - Room 104',
  'Garrett Hall - Basement - Room B12',
  'Monroe Hall - Room 301',
  'Clark Hall - Room 215',
  'Thornton Hall - Room 410',
  'Remote'
];

const notes = [
  'Safe and secure',
  'With team members',
  'Working from home office',
  'In meeting room',
  '',
  'At my desk',
  'Conference room'
];

// Mix of staff and students from the CSV
const testUsers = [
  // Staff
  { uid: 'bh4hb', name: 'Hartless, Ben (bh4hb)' },
  { uid: 'acm8k', name: 'Carter Mulligan, Anne Mitchell (acm8k)' },
  { uid: 'am3de', name: 'Crombie, Amanda Joan (am3de)' },
  { uid: 'bac7d', name: 'Crenshaw, Bryan A (bac7d)' },
  { uid: 'chm3b', name: 'Moore, Cindy (chm3b)' },
  { uid: 'cr9dh', name: 'Reinicke, Carey Masse (cr9dh)' },
  { uid: 'sh3bz', name: 'Hudson, Sally (sh3bz)' },
  { uid: 'eh4jc', name: 'Hill, Beth (eh4jc)' },
  { uid: 'jll4m', name: 'Ludovici, Jennifer Lynne (jll4m)' },
  { uid: 'kdt4d', name: 'Turner, Kim (kdt4d)' },

  // Students
  { uid: 'abn7ur', name: 'Metcalf, Drake Hudson (abn7ur)' },
  { uid: 'abn9xa', name: 'Scott, Anna McKinley (abn9xa)' },
  { uid: 'ach4hf', name: 'Hendrickson, Abigail Casey (ach4hf)' },
  { uid: 'adk7dq', name: 'Fitzpatrick, Braidon Payne (adk7dq)' },
  { uid: 'afg4tm', name: 'Gonzalez, Esteban Roberto (afg4tm)' },
  { uid: 'agw7cm', name: 'Williams, Brian Joshua (agw7cm)' },
  { uid: 'ajv5yx', name: 'Hadjimichael, Dionysios (ajv5yx)' },
  { uid: 'akg4hm', name: 'Theriot, Grace Nadine (akg4hm)' },
  { uid: 'akr9af', name: 'Rorem, Anna Katherine (akr9af)' },
  { uid: 'ama7wu', name: 'Hamilton, Trevor Lanier (ama7wu)' },
  { uid: 'ang5rg', name: 'Chang, Margaret Keli (ang5rg)' },
  { uid: 'aps2xf', name: 'Garcia, Emilia (aps2xf)' },
  { uid: 'apv4hp', name: 'Murphy, Lily (apv4hp)' },
  { uid: 'aqf7vf', name: 'de Andrade Lima, Joao Vitor (aqf7vf)' },
  { uid: 'ary6kp', name: 'Israel, Micah David Frank (ary6kp)' },
  { uid: 'asu6kd', name: 'Calhoun, Celia Shireen (asu6kd)' },
  { uid: 'awh2cx', name: 'Jones, Katherine Michelle (awh2cx)' },
  { uid: 'ayb3ns', name: 'Adams, Zach Lee (ayb3ns)' },
  { uid: 'bab3pz', name: 'Bonner, Bree Alexis (bab3pz)' },
  { uid: 'bap9rz', name: 'McCorkle, Maddie (bap9rz)' }
];

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
      hostname: 'localhost',
      port: 3000,
      path: '/api/emergency-alert',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        console.log(`✓ ${user.name} checked in at ${location}`);
        resolve();
      });
    });

    req.on('error', (error) => {
      console.error(`✗ Error for ${user.name}:`, error.message);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

async function generateDummyData() {
  console.log('Generating dummy check-in data...\n');

  for (let i = 0; i < testUsers.length; i++) {
    await sendCheckIn(testUsers[i], i);
    // Small delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n✓ Generated ${testUsers.length} check-ins successfully!`);
  console.log('\nView the accountability report at: http://localhost:3000/accountability.html');
}

generateDummyData().catch(console.error);
