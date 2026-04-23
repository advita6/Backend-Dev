# DEPLOYMENT GUIDE

## Quick Start

### 1. Local Development Setup

```bash
# Clone repository
git clone https://github.com/advita6/Backend-Dev.git
cd Backend-Dev
git checkout deployment

# Navigate to assignment
cd deployment/Assignment

# Copy environment file
cp .env.example .env

# Install dependencies
npm install

# Start with Docker Compose
docker-compose up -d

# Server runs on http://localhost:3000
```

### 2. Docker Containers Started
- **App**: http://localhost:3000
- **MongoDB**: localhost:27017 (Mongo Express: http://localhost:8081)
- **Redis**: localhost:6379

### 3. Database Verification

```bash
# Check MongoDB
docker exec ecommerce-mongo mongosh
```

## Production Deployment

### Prerequisites
- Heroku CLI installed
- Git repository
- MongoDB Atlas account (M60 minimum)
- Heroku Redis plan

### Deployment Steps

#### 1. Login to Heroku
```bash
heroku login
heroku apps:create ecommerce-black-friday
```

#### 2. Add Required Add-ons
```bash
# MongoDB Atlas (not Heroku managed)
# Configure MONGODB_URI env variable manually on Heroku Dashboard

# Redis
heroku addons:create heroku-redis:premium-0 -a ecommerce-black-friday

# New Relic (optional)
heroku addons:create newrelic:wayne -a ecommerce-black-friday
```

#### 3. Set Environment Variables
```bash
heroku config:set \
  NODE_ENV=production \
  JWT_SECRET=$(openssl rand -hex 32) \
  SESSION_SECRET=$(openssl rand -hex 32) \
  AUTO_SCALE_ENABLED=true \
  MIN_DYNOS=2 \
  MAX_DYNOS=500 \
  NEW_RELIC_APP_NAME=ecommerce-platform \
  -a ecommerce-black-friday
```

#### 4. Configure MongoDB URI
```bash
# Get connection string from MongoDB Atlas
# Set via Heroku Dashboard or CLI:
heroku config:set MONGODB_URI='mongodb+srv://user:pass@cluster.mongodb.net/ecommerce' \
  -a ecommerce-black-friday
```

#### 5. Deploy Application
```bash
# Add Heroku remote
heroku git:remote -a ecommerce-black-friday

# Deploy
git push heroku deployment:main

# Watch logs
heroku logs --tail -a ecommerce-black-friday
```

#### 6. Verify Deployment
```bash
# Health check
curl https://ecommerce-black-friday.herokuapp.com/health

# Metrics
curl https://ecommerce-black-friday.herokuapp.com/metrics

# Scale worker dyno for message processing
heroku ps:scale worker=5 -a ecommerce-black-friday
```

## Auto-Scaling Configuration

### Heroku Labs: Autoscaling

Enable if available:
```bash
heroku labs:enable autoscaling -a ecommerce-black-friday

# Or use Autoscale addon:
heroku addons:create autoscale:standard  -a ecommerce-black-friday
```

### Manual Scaling
```bash
# Scale web dynos
heroku ps:scale web=10 -a ecommerce-black-friday

# Scale worker dynos
heroku ps:scale worker=5 -a ecommerce-black-friday

# View current formation
heroku ps -a ecommerce-black-friday
```

## Database Setup

### MongoDB Atlas Configuration

1. **Create M60 Cluster**
   - Go to MongoDB Atlas console
   - Create cluster with M60 tier
   - Enable auto-backup
   - Whitelist Heroku IPs (or allow all 0.0.0.0)

2. **Create Application Database User**
   ```
   Username: ecommerce_app
   Password: [generate strong password]
   Database: ecommerce
   Roles: dbOwner
   ```

3. **Get Connection String**
   - Format: `mongodb+srv://user:pass@cluster.mongodb.net/database`
   - Set as MONGODB_URI in Heroku

4. **Create Indexes** (for performance)
   ```javascript
   db.products.createIndex({ "id": 1 })
   db.orders.createIndex({ "email": 1 })
   db.orders.createIndex({ "status": 1 })
   db.inventory.createIndex({ "productId": 1 })
   ```

## Redis Setup

### Heroku Redis
- Already added as add-on
- Automatically configured via `REDIS_URL` environment variable
- Premium tier recommended for peak traffic
- Memory limit alerts configured

## SSL/TLS Configuration

### Automatic SSL via Heroku
```bash
# Heroku provides automatic SSL certificates
# All traffic automatically redirected to HTTPS
# Certificate auto-renews every 90 days

# Verify SSL
curl -I https://ecommerce-black-friday.herokuapp.com
```

### Custom Domain with SSL
```bash
# Add custom domain
heroku domains:add www.ecommerce.com -a ecommerce-black-friday

# Configure DNS:
# CNAME www.ecommerce.com -> ecommerce-black-friday.herokuapp.com
```

## Monitoring Setup

### New Relic Integration
```bash
# New Relic addon provides:
# - APM monitoring
# - Real-time dashboards
# - Automatic alerting
# - Performance analysis

# Access New Relic dashboard via Heroku:
heroku addons:open newrelic -a ecommerce-black-friday
```

### Application Health Checks
```bash
# Built-in health endpoint
curl https://ecommerce-black-friday.herokuapp.com/health

# Response example:
{
  "status": "UP",
  "uptime": 3600.5,
  "environment": "production"
}
```

## Security Checklist

- [ ] Environment variables secured (never commit .env)
- [ ] HTTPS enforced (automatic via Heroku)
- [ ] Database user with restricted permissions created
- [ ] Connection pooling enabled
- [ ] Secrets rotation scheduled (quarterly)
- [ ] API rate limiting configured
- [ ] CORS properly configured
- [ ] SQL injection prevention (using parameterized queries)
- [ ] XSS protection (helmet middleware enabled)

## Deployment Validation

### Pre-Deployment Tests
```bash
# Run locally first
npm start

# Run load tests
npm run load-test

# Run unit tests
npm test
```

### Post-Deployment Verification
```bash
# Health check
heroku ps -a ecommerce-black-friday

# Log review
heroku logs -a ecommerce-black-friday --lines=100

# Database connectivity test
curl https://ecommerce-black-friday.herokuapp.com/metrics

# Simulate traffic
npm run load-test -- --url https://ecommerce-black-friday.herokuapp.com
```

## Cost Monitoring

### Track Daily Costs
```bash
# View Heroku billable hours
heroku billing -a ecommerce-black-friday

# Set billing alerts on Heroku Dashboard
# Recommended: Alert if over $500/day
```

### Cost Optimization Tips
1. Scale down when traffic is predictable
2. Use Standard-1x dynos during off-peak
3. Terminate unused add-ons after peak
4. Monitor database storage usage

---

**Deployment Guide v1.0** | Last Updated: April 2026
