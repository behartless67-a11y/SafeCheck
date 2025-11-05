const fs = require('fs');
const path = require('path');

// Load and parse the staff CSV files
function loadStaffAndFaculty() {
  const staffSet = new Set();

  // Load staff CSV
  const staffCsvPath = path.join(__dirname, 'groupExportAll_FBS_StaffAll.csv');

  try {
    if (fs.existsSync(staffCsvPath)) {
      const csvContent = fs.readFileSync(staffCsvPath, 'utf-8');
      const lines = csvContent.split('\n');

      // Skip header row and empty rows
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // Parse CSV line (handle quoted fields)
        const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
        if (!matches || matches.length < 1) continue;

        const uid = matches[0].replace(/"/g, '').trim();

        // Skip group header lines or invalid entries
        if (uid && uid !== 'uid' && !uid.includes('groups:')) {
          staffSet.add(uid.toLowerCase());
        }
      }
    }
  } catch (error) {
    console.error('Error loading staff CSV:', error.message);
  }

  // Load all faculty CSV files
  const facultyFiles = [
    'groupExportAll_FBS_Faculty_Core.csv',
    'groupExportAll_FBS_Faculty_Adjunct.csv',
    'groupExportAll_FBS_Faculty_Affiliated.csv'
  ];

  facultyFiles.forEach(fileName => {
    const facultyCsvPath = path.join(__dirname, fileName);

    try {
      if (fs.existsSync(facultyCsvPath)) {
        const csvContent = fs.readFileSync(facultyCsvPath, 'utf-8');
        const lines = csvContent.split('\n');

        // Skip header row and empty rows
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;

          // Parse CSV line (handle quoted fields)
          const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          if (!matches || matches.length < 1) continue;

          const uid = matches[0].replace(/"/g, '').trim();

          // Skip group header lines or invalid entries
          if (uid && uid !== 'uid' && !uid.includes('groups:')) {
            staffSet.add(uid.toLowerCase());
          }
        }
      }
    } catch (error) {
      console.error(`Error loading ${fileName}:`, error.message);
    }
  });

  console.log(`Loaded ${staffSet.size} staff/faculty members`);
  return staffSet;
}

module.exports = { loadStaffAndFaculty };
