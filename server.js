const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;

// MIME types
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.csv': 'text/csv'
};

// In-memory storage for alerts (simulating serverless storage)
global.inMemoryAlerts = [];
global.alertCount = 0;

const server = http.createServer(async (req, res) => {
  console.log(`${req.method} ${req.url}`);

  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes
  if (req.url.startsWith('/api/')) {
    const apiPath = req.url.split('?')[0];
    const apiFile = apiPath.replace('/api/', '') + '.js';
    const apiFilePath = path.join(__dirname, 'api', apiFile);

    try {
      // Clear require cache to allow hot reloading
      delete require.cache[require.resolve(apiFilePath)];

      const handler = require(apiFilePath);

      // Collect POST body
      let body = '';
      req.on('data', chunk => {
        body += chunk.toString();
      });

      req.on('end', async () => {
        // Parse JSON body if present
        if (body && req.headers['content-type']?.includes('application/json')) {
          try {
            req.body = JSON.parse(body);
          } catch (e) {
            req.body = {};
          }
        } else {
          req.body = {};
        }

        // Create response wrapper
        const mockRes = {
          statusCode: 200,
          headers: {},
          setHeader(name, value) {
            this.headers[name] = value;
          },
          status(code) {
            this.statusCode = code;
            return this;
          },
          json(data) {
            const json = JSON.stringify(data);
            res.writeHead(this.statusCode, {
              'Content-Type': 'application/json',
              ...this.headers
            });
            res.end(json);
          },
          end() {
            res.writeHead(this.statusCode, this.headers);
            res.end();
          }
        };

        await handler(req, mockRes);
      });

    } catch (error) {
      console.error('API Error:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Internal Server Error', details: error.message }));
    }
    return;
  }

  // Static file serving
  let filePath = '.' + req.url;
  if (filePath === './') {
    filePath = './public/index.html';
  } else if (filePath === './admin') {
    filePath = './public/admin.html';
  } else if (filePath === './accountability') {
    filePath = './public/accountability.html';
  } else if (!filePath.startsWith('./public/')) {
    filePath = './public' + req.url;
  }

  const extname = String(path.extname(filePath)).toLowerCase();
  const contentType = MIME_TYPES[extname] || 'application/octet-stream';

  fs.readFile(filePath, (error, content) => {
    if (error) {
      if (error.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end('<h1>404 - File Not Found</h1>', 'utf-8');
      } else {
        res.writeHead(500);
        res.end('Server Error: ' + error.code + ' ..\n');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log('='.repeat(60));
  console.log('🚀 SafeCheck Local Development Server');
  console.log('='.repeat(60));
  console.log(`\n✅ Server running at http://localhost:${PORT}/`);
  console.log(`\n📋 Available pages:`);
  console.log(`   - Main check-in: http://localhost:${PORT}/`);
  console.log(`   - Admin dashboard: http://localhost:${PORT}/admin.html`);
  console.log(`   - Accountability: http://localhost:${PORT}/accountability.html`);
  console.log(`\n🔧 API endpoints:`);
  console.log(`   - POST /api/validate-user`);
  console.log(`   - POST /api/emergency-alert`);
  console.log(`   - GET /api/alerts`);
  console.log(`   - GET /api/accountability`);
  console.log(`\n⚠️  Using in-memory storage (data will be lost on restart)`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
  console.log('='.repeat(60));
});
