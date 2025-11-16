# 🐳 Docker Deployment Guide - CyberCache

## Quick Start with Docker

### Option 1: Using Docker Compose (Recommended)

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down
```

Access at: **http://localhost:5000** (backend) and **http://localhost:3000** (frontend served by backend)

### Option 2: Using Docker CLI

```bash
# Build image
docker build -t cybercache .

# Run container
docker run -d \
  -p 5000:5000 \
  -p 3000:3000 \
  -v $(pwd)/data:/app/data \
  -v $(pwd)/content:/app/content \
  -v $(pwd)/uploads:/app/uploads \
  --name cybercache \
  cybercache

# View logs
docker logs -f cybercache

# Stop container
docker stop cybercache

# Remove container
docker rm cybercache
```

---

## 📁 Directory Structure

```
cybercache/
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Docker Compose configuration
├── docker-entrypoint.sh    # Container startup script
├── .dockerignore          # Files to exclude from image
├── data/                  # Database storage (persistent)
├── content/               # Content files (watched)
└── uploads/               # User uploads (persistent)
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file for Docker Compose:

```bash
# AI API Keys (Optional)
OPENAI_API_KEY=sk-your-key-here
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Database Path
DATABASE_PATH=/app/data/cybercache.db
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  cybercache:
    build: .
    ports:
      - "5000:5000"  # Backend API
      - "3000:3000"  # Frontend (if separate)
    volumes:
      - ./data:/app/data          # Persistent database
      - ./content:/app/content    # Content files
      - ./uploads:/app/uploads    # Uploaded files
    environment:
      - OPENAI_API_KEY=${OPENAI_API_KEY}
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
    restart: unless-stopped
```

---

## 📦 Volume Management

### Persistent Data

Three volumes are mounted for data persistence:

1. **`./data`** → `/app/data`
   - Database file (`cybercache.db`)
   - Critical data - **backup regularly!**

2. **`./content`** → `/app/content`
   - Content files for auto-import
   - Drop files here to add them

3. **`./uploads`** → `/app/uploads`
   - User-uploaded files
   - Created via web interface

### Backup Volumes

```bash
# Backup database
docker cp cybercache:/app/data/cybercache.db ./backups/

# Or directly from volume
cp data/cybercache.db backups/cybercache-$(date +%Y%m%d).db
```

### Restore from Backup

```bash
# Stop container
docker-compose down

# Restore database
cp backups/cybercache-20240101.db data/cybercache.db

# Start container
docker-compose up -d
```

---

## 🚀 Deployment Scenarios

### Development

```bash
# Start with logs visible
docker-compose up

# Make changes and rebuild
docker-compose up --build
```

### Production

```bash
# Start in background
docker-compose up -d

# Check health
docker-compose ps

# View logs
docker-compose logs -f
```

### With Reverse Proxy (Nginx)

```nginx
server {
    listen 80;
    server_name cybercache.example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

---

## 🔒 Security Best Practices

### 1. Run as Non-Root User

Update Dockerfile:
```dockerfile
# Create app user
RUN useradd -m -u 1000 appuser && \
    chown -R appuser:appuser /app

# Switch to non-root user
USER appuser
```

### 2. Read-Only Root Filesystem

```yaml
services:
  cybercache:
    security_opt:
      - no-new-privileges:true
    read_only: true
    tmpfs:
      - /tmp
      - /var/tmp
```

### 3. Resource Limits

```yaml
services:
  cybercache:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 2G
        reservations:
          cpus: '0.5'
          memory: 512M
```

### 4. Network Isolation

```yaml
networks:
  cybercache_net:
    driver: bridge
    internal: true  # No external access

services:
  cybercache:
    networks:
      - cybercache_net
```

---

## 🔍 Monitoring & Logs

### View Logs

```bash
# All logs
docker-compose logs

# Follow logs
docker-compose logs -f

# Last 100 lines
docker-compose logs --tail=100

# Specific service
docker-compose logs cybercache
```

### Health Checks

```bash
# Check container health
docker-compose ps

# Manual health check
curl http://localhost:5000/api/health
```

### Resource Usage

```bash
# Container stats
docker stats cybercache

# Disk usage
docker system df
```

---

## 🛠️ Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs

# Check if port is in use
lsof -i :5000

# Remove and recreate
docker-compose down
docker-compose up --build
```

### Database Issues

```bash
# Access container shell
docker-compose exec cybercache /bin/bash

# Check database
ls -lh /app/data/

# Reset database (WARNING: deletes all data)
docker-compose down
rm data/cybercache.db
docker-compose up -d
```

### Permission Issues

```bash
# Fix volume permissions
sudo chown -R 1000:1000 data/ content/ uploads/

# Or run container with your UID
docker-compose run --user=$(id -u):$(id -g) cybercache
```

### File Watcher Not Working

```bash
# Check if content directory is mounted
docker-compose exec cybercache ls -la /app/content

# Restart container
docker-compose restart
```

---

## 📊 Performance Optimization

### Build Optimization

```dockerfile
# Use specific Python version
FROM python:3.13-slim-bullseye

# Use pip cache
RUN pip install --no-cache-dir -r requirements.txt

# Multi-stage builds (already implemented)
```

### Runtime Optimization

```yaml
services:
  cybercache:
    environment:
      - PYTHONUNBUFFERED=1
      - PYTHONDONTWRITEBYTECODE=1
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## 🔄 Updates & Maintenance

### Update Application

```bash
# Pull latest code
git pull

# Rebuild and restart
docker-compose up -d --build

# Check logs
docker-compose logs -f
```

### Update Dependencies

```bash
# Update Python dependencies
docker-compose exec cybercache pip list --outdated

# Rebuild image with updated dependencies
docker-compose build --no-cache
```

### Clean Up

```bash
# Remove stopped containers
docker-compose down --remove-orphans

# Remove unused images
docker image prune -a

# Remove unused volumes
docker volume prune
```

---

## 📋 Common Commands Cheat Sheet

```bash
# Start
docker-compose up -d

# Stop
docker-compose down

# Restart
docker-compose restart

# Rebuild
docker-compose up -d --build

# Logs
docker-compose logs -f

# Shell access
docker-compose exec cybercache /bin/bash

# Run command
docker-compose exec cybercache python backend/migrate_to_database.py

# Check status
docker-compose ps

# View resource usage
docker stats cybercache

# Backup database
docker cp cybercache:/app/data/cybercache.db ./backup.db

# Restore database
docker cp ./backup.db cybercache:/app/data/cybercache.db
```

---

## 🌐 Production Deployment

### 1. Use Docker Swarm or Kubernetes

#### Docker Swarm
```bash
docker swarm init
docker stack deploy -c docker-compose.yml cybercache
```

#### Kubernetes
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cybercache
spec:
  replicas: 1
  template:
    spec:
      containers:
      - name: cybercache
        image: cybercache:latest
        ports:
        - containerPort: 5000
```

### 2. Use HTTPS

```yaml
services:
  cybercache:
    environment:
      - FORCE_HTTPS=true
```

### 3. Regular Backups

```bash
# Automated backup script
#!/bin/bash
docker cp cybercache:/app/data/cybercache.db \
  /backups/cybercache-$(date +%Y%m%d-%H%M%S).db

# Keep only last 7 days
find /backups -name "cybercache-*.db" -mtime +7 -delete
```

### 4. Monitoring

Use tools like:
- **Prometheus** for metrics
- **Grafana** for dashboards
- **ELK Stack** for logs

---

## ✅ Checklist for Production

- [ ] Use specific image tags (not `latest`)
- [ ] Run as non-root user
- [ ] Enable health checks
- [ ] Set resource limits
- [ ] Configure logging driver
- [ ] Set up automated backups
- [ ] Use HTTPS/TLS
- [ ] Implement monitoring
- [ ] Configure alerts
- [ ] Document deployment process
- [ ] Test disaster recovery

---

## 📚 Additional Resources

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/compose-file/)
- [Docker Security](https://docs.docker.com/engine/security/)
- [Best Practices](https://docs.docker.com/develop/dev-best-practices/)

---

**Your CyberCache is now Dockerized!** 🐳🗄️
