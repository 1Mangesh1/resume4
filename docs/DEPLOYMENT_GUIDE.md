# Deployment Guide - Resume Generator

## 🚀 Deployment Options

### 1. Single Container Deployment (Recommended)

- **Best for**: Small to medium applications
- **Resources**: 1GB RAM, 1 CPU core
- **Features**: Integrated LaTeX, health checks

### 2. Docker Compose Deployment

- **Best for**: Development and staging
- **Features**: Redis caching, Nginx proxy, monitoring

### 3. Production Deployment

- **Best for**: Production environments
- **Features**: Resource limits, security hardening, monitoring

## 🔧 Prerequisites

### System Requirements

- **Docker**: 20.10 or higher
- **Docker Compose**: 2.0 or higher
- **Memory**: Minimum 1GB RAM
- **Storage**: 2GB available space
- **Network**: Outbound internet access for AI API

### Environment Setup

```bash
# Install Docker (Ubuntu/Debian)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version
```

## 🏗️ Single Container Deployment

### Quick Start

```bash
# Clone repository
git clone <repository-url>
cd resume4

# Set environment variables
export GOOGLE_GENERATIVE_AI_API_KEY="your-api-key"

# Build and run
make build-prod
make run-prod

# Verify deployment
make health
```

### Manual Deployment

```bash
# Build production image
docker build -f Dockerfile.production -t resume-generator:latest .

# Run container
docker run -d \
  --name resume-app \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e DOCKERIZED=true \
  -e GOOGLE_GENERATIVE_AI_API_KEY="your-api-key" \
  --restart unless-stopped \
  resume-generator:latest

# Check health
curl http://localhost:3000/api/health
```

## 🐳 Docker Compose Deployment

### Development Stack

```bash
# Create environment file
cat > .env << EOF
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
NODE_ENV=development
EOF

# Start development stack
docker-compose up -d

# Check services
docker-compose ps
docker-compose logs resume-generator
```

### Production Stack

```bash
# Create production environment
cat > .env.prod << EOF
GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
NODE_ENV=production
EOF

# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# Start with monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

## ☁️ Cloud Deployment

### AWS ECS

```bash
# Build and push to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789.dkr.ecr.us-east-1.amazonaws.com

docker tag resume-generator:latest 123456789.dkr.ecr.us-east-1.amazonaws.com/resume-generator:latest
docker push 123456789.dkr.ecr.us-east-1.amazonaws.com/resume-generator:latest

# Create ECS task definition
# Deploy using ECS service
```

### Google Cloud Run

```bash
# Build and push to GCR
docker tag resume-generator:latest gcr.io/your-project/resume-generator:latest
docker push gcr.io/your-project/resume-generator:latest

# Deploy to Cloud Run
gcloud run deploy resume-generator \
  --image gcr.io/your-project/resume-generator:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_GENERATIVE_AI_API_KEY=your-api-key
```

### DigitalOcean Droplet

```bash
# Create droplet with Docker
doctl compute droplet create resume-app \
  --region nyc1 \
  --image docker-20-04 \
  --size s-2vcpu-2gb

# SSH and deploy
ssh root@droplet-ip
git clone <repository-url>
cd resume4
make deploy
```

## 🔐 Security Configuration

### SSL/TLS Setup

```bash
# Generate SSL certificates (Let's Encrypt)
sudo apt install certbot
sudo certbot certonly --standalone -d yourdomain.com

# Update nginx configuration
cat > nginx.prod.conf << EOF
server {
    listen 443 ssl;
    server_name yourdomain.com;

    ssl_certificate /etc/ssl/certs/fullchain.pem;
    ssl_certificate_key /etc/ssl/private/privkey.pem;

    location / {
        proxy_pass http://resume-generator:3000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
    }
}
EOF
```

### Firewall Configuration

```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Environment Security

```bash
# Create secure environment file
cat > .env.secure << EOF
GOOGLE_GENERATIVE_AI_API_KEY=your-secure-api-key
JWT_SECRET=your-jwt-secret
DATABASE_URL=your-database-url
REDIS_URL=your-redis-url
EOF

# Set secure permissions
chmod 600 .env.secure
```

## 📊 Monitoring Setup

### Health Checks

```bash
# Basic health check script
cat > health-check.sh << EOF
#!/bin/bash
response=\$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health)
if [ \$response = "200" ]; then
    echo "Service healthy"
    exit 0
else
    echo "Service unhealthy: HTTP \$response"
    exit 1
fi
EOF

chmod +x health-check.sh

# Setup cron for monitoring
crontab -e
# Add: */5 * * * * /path/to/health-check.sh
```

### Logging Configuration

```bash
# Setup log rotation
cat > /etc/logrotate.d/resume-app << EOF
/var/log/resume-app/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    copytruncate
}
EOF
```

### Prometheus Monitoring

```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: "resume-generator"
    static_configs:
      - targets: ["resume-generator:3000"]
    metrics_path: "/metrics"
```

## 🔄 CI/CD Pipeline

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy Resume Generator

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Build and push Docker image
        env:
          DOCKER_REGISTRY: ${{ secrets.DOCKER_REGISTRY }}
        run: |
          echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin $DOCKER_REGISTRY
          docker build -f Dockerfile.production -t $DOCKER_REGISTRY/resume-generator:${{ github.sha }} .
          docker push $DOCKER_REGISTRY/resume-generator:${{ github.sha }}

      - name: Deploy to production
        run: |
          # Deploy commands here
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - build
  - deploy

build:
  stage: build
  script:
    - docker build -f Dockerfile.production -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

deploy:
  stage: deploy
  script:
    - docker pull $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
    - docker stop resume-app || true
    - docker rm resume-app || true
    - docker run -d --name resume-app -p 3000:3000 $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA
```

## 🔧 Troubleshooting

### Common Issues

#### Container Won't Start

```bash
# Check Docker logs
docker logs resume-app

# Check system resources
free -h
df -h
docker system df
```

#### SSL Certificate Issues

```bash
# Verify certificate
openssl x509 -in /etc/ssl/certs/fullchain.pem -text -noout

# Test SSL connection
openssl s_client -connect yourdomain.com:443
```

#### Performance Issues

```bash
# Monitor container resources
docker stats resume-app

# Check application metrics
curl http://localhost:3000/metrics
```

### Recovery Procedures

#### Container Recovery

```bash
# Restart container
make restart

# Full redeploy
make clean
make deploy
```

#### Data Recovery

```bash
# Backup volumes
make backup-volumes

# Restore from backup
docker run --rm -v resume_uploads:/restore alpine sh -c "cd /restore && tar -xzf /backup/volumes-backup-*.tar.gz"
```

## 📈 Performance Optimization

### Resource Limits

```yaml
# docker-compose.prod.yml
services:
  resume-generator:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: "0.5"
        reservations:
          memory: 512M
          cpus: "0.25"
```

### Caching Strategy

```bash
# Redis configuration
redis-cli CONFIG SET maxmemory 256mb
redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

### Database Optimization

```sql
-- Database indexes
CREATE INDEX idx_resumes_user_id ON resumes(user_id);
CREATE INDEX idx_resumes_created_at ON resumes(created_at);
```

## 🔄 Backup and Recovery

### Automated Backups

```bash
# Backup script
cat > backup.sh << EOF
#!/bin/bash
DATE=\$(date +%Y%m%d_%H%M%S)
docker exec resume-app tar -czf /tmp/backup_\$DATE.tar.gz /app/uploads /app/temp
docker cp resume-app:/tmp/backup_\$DATE.tar.gz ./backups/
aws s3 cp ./backups/backup_\$DATE.tar.gz s3://your-backup-bucket/
EOF

# Schedule backups
crontab -e
# Add: 0 2 * * * /path/to/backup.sh
```

### Disaster Recovery

```bash
# Restore procedure
aws s3 cp s3://your-backup-bucket/backup_latest.tar.gz ./
docker cp backup_latest.tar.gz resume-app:/tmp/
docker exec resume-app tar -xzf /tmp/backup_latest.tar.gz -C /
```

---

## 📞 Support and Maintenance

### Update Procedures

1. **Test updates** in staging environment
2. **Backup current deployment**
3. **Deploy new version**
4. **Verify functionality**
5. **Monitor for issues**

### Support Contacts

- **Technical Issues**: Check container logs first
- **Performance Issues**: Monitor resource usage
- **Security Issues**: Review access logs

### Maintenance Schedule

- **Daily**: Health checks, log review
- **Weekly**: Security updates, backup verification
- **Monthly**: Performance review, capacity planning
- **Quarterly**: Security audit, disaster recovery testing

Generated for Resume Generator v1.0.0
