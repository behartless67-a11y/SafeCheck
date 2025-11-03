const fs = require('fs');
const path = require('path');

// Load and parse the CSV file
function loadBattenUsers() {
  const csvPath = path.join(__dirname, 'groupExportAll_FBS_Community.csv');

  try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');

    // Skip header row
    const users = {};

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse CSV line (handle quoted fields)
      const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
      if (!matches || matches.length < 4) continue;

      const uid = matches[0].replace(/"/g, '').trim();
      const mail = matches[1].replace(/"/g, '').trim();
      const universityID = matches[2].replace(/"/g, '').trim();
      const name = matches[3].replace(/"/g, '').trim();

      if (uid && mail && name) {
        users[uid.toLowerCase()] = {
          uid: uid,
          email: mail,
          universityID: universityID,
          name: name
        };
      }
    }

    console.log(`Loaded ${Object.keys(users).length} authorized Batten School users`);
    return users;

  } catch (error) {
    console.error('Error loading users CSV:', error.message);
    return {};
  }
}

module.exports = { loadBattenUsers };
