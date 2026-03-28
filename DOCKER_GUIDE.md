# ALBEL Docker Setup Guide

## Prerequisites

- Docker 20.10+
- Docker Compose 2.0+
- No services should be running on ports 80, 5432, 8080

## Quick Start

### 1. Build Images

#### Option A: Build with Jib (Backend)
```bash
cd albelt-api
./mvnw clean compile jib:dockerBuild
```

#### Option B: Build Manually
```bash
cd albelt-api
./mvnw clean package -DskipTests
docker build -t albelt-api:0.0.1-SNAPSHOT .
```

#### Build Frontend
```bash
cd albelt-ui
docker build -t albelt-ui:latest .
```

### 2. Start All Services
```bash
docker-compose up -d
```

### 3. Verify Services
```bash
docker-compose ps

# Check logs
docker-compose logs -f albelt-api
docker-compose logs -f albelt-ui
docker-compose logs -f postgres
```

### 4. Access Application
- **Frontend**: http://localhost (port 80)
- **Backend**: http://localhost:8080/swagger-ui.html (API docs)
- **Database**: localhost:5432 (PostgreSQL)

## Docker Compose Services

### PostgreSQL Database
- **Container**: albel-postgres
- **Port**: 5432
- **Database**: albel_db
- **User**: albel_user
- **Password**: albel_secure_password_123
- **Data Persistence**: postgres_data volume

### Spring Boot API
- **Container**: albelt-api
- **Port**: 8080
- **Depends On**: postgres (healthy)
- **Auto Migrations**: Flyway runs automatically
- **Health Check**: Every 30 seconds
- **Logs**: Mounted at ./logs

### React UI
- **Container**: albelt-ui
- **Port**: 80
- **Depends On**: albelt-api
- **Nginx**: Reverse proxy + SPA routing

## Environment Configuration

### Backend (application.yml profiles)

**Development** (default):
```bash
SPRING_PROFILES_ACTIVE=development
```

**Production**:
```env
SPRING_PROFILES_ACTIVE=production
SPRING_DATASOURCE_URL=jdbc:postgresql://postgres:5432/albel_db
SPRING_DATASOURCE_USERNAME=albel_user
SPRING_DATASOURCE_PASSWORD=albel_secure_password_123
```

### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:8080/api
```

## Common Commands

### Stop All Services
```bash
docker-compose down
```

### Remove All Data (including database)
```bash
docker-compose down -v
```

### Rebuild Services
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### View Live Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f albelt-api
```

### Enter Container Shell
```bash
docker exec -it albelt-api /bin/sh
docker exec -it postgres psql -U albel_user -d albel_db
```

### Check Database
```bash
docker-compose exec postgres psql -U albel_user -d albel_db -c "\dt"
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port
lsof -i :8080  # macOS/Linux
netstat -ano | findstr :8080  # Windows

# Kill process
kill -9 <PID>  # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Database Connection Failed
```bash
# Check postgres health
docker-compose logs postgres

# Verify credentials
docker-compose exec postgres psql -U albel_user -d albel_db
```

### API Container Won't Start
```bash
# Check logs
docker-compose logs albelt-api

# Verify image exists
docker images | grep albelt-api

# Rebuild if needed
cd albelt-api
./mvnw clean compile jib:dockerBuild
docker-compose up -d
```

### Frontend Not Loading
```bash
# Check nginx config
docker-compose exec albelt-ui cat /etc/nginx/conf.d/default.conf

# Clear browser cache and refresh
```

## Production Deployment

### Update docker-compose.yml

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: <STRONG_PASSWORD>
    restart: always
  
  albelt-api:
    environment:
      SPRING_PROFILES_ACTIVE: production
      SPRING_DATASOURCE_PASSWORD: <STRONG_PASSWORD>
    restart: always
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
  
  albelt-ui:
    restart: always
```

### Enable HTTPS

Add Nginx reverse proxy with SSL:

```nginx
server {
    listen 443 ssl;
    server_name albel.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        proxy_pass http://albelt-ui;
    }
}
```

### Database Backup

```bash
docker-compose exec postgres pg_dump -U albel_user albel_db > backup.sql
```

### Database Restore

```bash
cat backup.sql | docker-compose exec -T postgres psql -U albel_user albel_db
```

## Performance Tuning

### Backend (JVM)
Edit docker-compose.yml:
```yaml
albelt-api:
  environment:
    _JAVA_OPTIONS: "-Xmx1g -Xms512m -XX:+UseG1GC"
```

### Database Connection Pool
Edit application.yml:
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
```

### Database Indexes
Already configured in Flyway migrations (V4__create_indexes.sql)

## Monitoring & Health Checks

### API Health Endpoint
```bash
curl http://localhost:8080/actuator/health
```

### API Metrics
```bash
curl http://localhost:8080/actuator/metrics
```

### Container Resource Usage
```bash
docker stats
```

## Development Tips

### Hot Reload Backend
Not available in Docker (would need volume mounts + dev tools)

For development, run backend locally:
```bash
cd albelt-api
./mvnw spring-boot:run
```

And frontend in dev mode:
```bash
cd albelt-ui
npm run dev
```

### Debug Backend
```bash
docker-compose exec albelt-api jps -l
```

## Security Notes

🔒 **For production**:
1. Change PostgreSQL password in docker-compose.yml
2. Use environment variables from CI/CD pipeline
3. Enable HTTPS with SSL certificates
4. Set SPRING_PROFILES_ACTIVE=production
5. Configure firewall rules
6. Use private networks where possible
7. Enable database backups
8. Monitor logs and alerts

## Cleanup

Remove everything:
```bash
docker-compose down -v
docker rmi albelt-api:0.0.1-SNAPSHOT albelt-ui:latest
docker volume prune
docker network prune
```

---

**Questions?** Check logs with `docker-compose logs -f <service>`
