const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const net = require('net');

console.log('\x1b[35m%s\x1b[0m', '=====================================================');
console.log('\x1b[35m%s\x1b[0m', '      🚀 Starting DiscordX Full-Stack Services       ');
console.log('\x1b[35m%s\x1b[0m', '=====================================================');
console.log(' [1] REST API Server:            http://localhost:5000');
console.log(' [2] Independent Socket Server:  http://localhost:5001');
console.log(' [3] Frontend Web Client:        http://localhost:5173');
console.log('-----------------------------------------------------\n');

const isWindows = process.platform === 'win32';
const bunPath = 'bun';
const runningProcesses = [];

// Helper to spawn service
function startService(name, color, cwd, cmd, args) {
  const child = spawn(cmd, args, {
    cwd: path.resolve(__dirname, cwd),
    shell: true,
    env: { ...process.env, FORCE_COLOR: '1' }
  });

  runningProcesses.push(child);

  child.stdout?.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach((line) => {
      console.log(`${color}[${name}]\x1b[0m ${line}`);
    });
  });

  child.stderr?.on('data', (data) => {
    const lines = data.toString().split('\n').filter(Boolean);
    lines.forEach((line) => {
      console.error(`${color}[${name} Error]\x1b[0m ${line}`);
    });
  });

  child.on('exit', (code) => {
    console.log(`${color}[${name}]\x1b[0m Process exited with code ${code}`);
  });

  return child;
}

// Check if MongoDB is already listening on 27017
function checkMongoPort(callback) {
  const socket = new net.Socket();
  socket.setTimeout(1500);

  socket.on('connect', () => {
    socket.destroy();
    callback(true);
  });

  socket.on('timeout', () => {
    socket.destroy();
    callback(false);
  });

  socket.on('error', () => {
    socket.destroy();
    callback(false);
  });

  socket.connect(27017, '127.0.0.1');
}

function launchAll() {
  const mongoBinary = 'C:\\Program Files\\MongoDB\\Server\\9.0\\bin\\mongod.exe';
  const dataDir = path.resolve(__dirname, 'data', 'db');

  checkMongoPort((isMongoRunning) => {
    if (isMongoRunning) {
      console.log('\x1b[32m[Database]\x1b[0m MongoDB is already running on port 27017.');
    } else if (fs.existsSync(mongoBinary)) {
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      console.log('\x1b[33m[Database]\x1b[0m Launching local MongoDB server on port 27017...');
      startService('MongoDB', '\x1b[34m', '.', `"${mongoBinary}"`, ['--dbpath', `"${dataDir}"`, '--port', '27017']);
    } else {
      console.log('\x1b[33m[Database Warning]\x1b[0m MongoDB not detected on 127.0.0.1:27017. If you use MongoDB Atlas, configure MONGODB_URI in server/.env');
    }

    // Start API Server, Socket Server, and Client
    setTimeout(() => {
      startService('API', '\x1b[36m', 'server', 'node', ['index.js']);
      startService('SOCKET', '\x1b[33m', 'socket-server', 'node', ['index.js']);
      startService('CLIENT', '\x1b[32m', 'client', bunPath, ['run', 'dev']);
    }, 1000);
  });
}

launchAll();

const shutdown = () => {
  console.log('\n\x1b[31m[System] Shutting down all DiscordX processes...\x1b[0m');
  runningProcesses.forEach((child) => {
    try {
      if (isWindows) {
        spawn('taskkill', ['/pid', child.pid, '/f', '/t']);
      } else {
        child.kill('SIGTERM');
      }
    } catch {}
  });
  process.exit(0);
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
