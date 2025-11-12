# CyberCache Management Scripts

This directory contains scripts for managing the CyberCache application.

## 🚀 Quick Start

From the project root directory:

```bash
./setup   # First time only - installs dependencies
./start   # Start the application
```

## 📋 Management Scripts

After starting the application, you can use these scripts:

### `start.sh`
Starts both the backend API server and frontend development server.

```bash
./scripts/start.sh
```

**What it does:**
- Activates the Python virtual environment
- Starts the Flask backend API on port 5000
- Starts the Vite frontend dev server on port 3000
- Creates PID files for process management
- Logs output to `logs/backend.log` and `logs/frontend.log`

**Output:**
- Backend API: `http://localhost:5000`
- Frontend App: `http://localhost:3000`

---

### `stop.sh`
Stops both backend and frontend servers gracefully.

```bash
./scripts/stop.sh
```

**What it does:**
- Reads PID files to find running processes
- Terminates both servers
- Cleans up PID files
- Falls back to searching for processes if PID files are missing

---

### `restart.sh`
Restarts both servers (stops then starts).

```bash
./scripts/restart.sh
```

**What it does:**
- Runs `stop.sh` to terminate existing processes
- Waits 2 seconds for ports to be released
- Runs `start.sh` to start fresh instances

---

### `status.sh`
Shows the current status of both servers and recent logs.

```bash
./scripts/status.sh
```

**What it does:**
- Checks if processes are running
- Tests if backend API is responding
- Shows last 5 lines from each log file
- Displays PID information

**Example output:**
```
📊 CyberCache Status
========================================

📦 Backend:
   ✅ Running (PID: 12345)
   ✅ Responding at http://localhost:5000

🎨 Frontend:
   ✅ Running (PID: 12346)
   📍 http://localhost:3000
```

---

### `logs.sh`
Displays live logs from both servers.

```bash
./scripts/logs.sh
```

**What it does:**
- Tails both `logs/backend.log` and `logs/frontend.log`
- Shows real-time output from both servers
- Press `Ctrl+C` to exit

---

## 🗂️ Generated Files

The scripts create several files for managing the application:

### PID Files (process tracking)
- `.cybercache.pid` - Combined PID file with both process IDs
- `.backend.pid` - Backend process ID
- `.frontend.pid` - Frontend process ID

### Log Files
- `logs/backend.log` - Backend API logs
- `logs/frontend.log` - Frontend dev server logs

**Note:** PID files are automatically created in the project root and cleaned up by the stop script.

---

## 🚀 Quick Start Workflow

```bash
# Start the application
./scripts/start.sh

# In another terminal, check status
./scripts/status.sh

# View live logs
./scripts/logs.sh

# When done, stop the application
./scripts/stop.sh
```

---

## 🔧 Troubleshooting

### "Port already in use"
If you get port conflicts, stop any running instances:
```bash
./scripts/stop.sh
# Or manually kill processes on the ports
lsof -ti:5000 | xargs kill
lsof -ti:3000 | xargs kill
```

### "Process not found"
If PIDs become stale (e.g., after manual kills), the stop script will search for processes by name and clean them up.

### View detailed logs
```bash
# View full backend log
cat logs/backend.log

# View full frontend log
cat logs/frontend.log

# Follow logs in real-time
tail -f logs/backend.log logs/frontend.log
```

### Clear logs
```bash
# Clear all logs
rm -f logs/*.log

# Or truncate without deleting
> logs/backend.log
> logs/frontend.log
```

---

## 💡 Tips

1. **Background operation:** All servers run in the background, so you can close your terminal after starting
2. **Automatic restart:** If you modify backend code, restart with `./scripts/restart.sh`
3. **Frontend HMR:** Frontend uses Vite's Hot Module Replacement, so most changes don't require restart
4. **Health checks:** The status script verifies the backend is responding to requests

---

## 🐳 Docker Alternative

If you prefer Docker, use Docker Compose instead:

```bash
# Start with Docker
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

See [DOCKER.md](../DOCKER.md) for full Docker documentation.
