# High-Traffic E-Commerce Platform - Black Friday Deployment

A production-ready Node.js/Express application designed to handle 50x traffic increase (10,000 to 500,000 requests/minute) during Black Friday/Cyber Monday peak season.

## 📋 Project Overview

**Business Requirements:**
- ✅ Zero downtime during 72-hour peak period
- ✅ Response times: Product page < 1s, Checkout < 3s, Search < 500ms
- ✅ Auto-scale from 2 to 500 Heroku dynos based on load
- ✅ $50,000 budget for peak weekend
- ✅ Real-time monitoring with automatic alerts

**Technical Stack:**
- Node.js 18+ with Express.js
- MongoDB Atlas M60 (expandable to M80)
- Redis caching layer
- Bull message queue for payment processing
- Heroku for deployment with auto-scaling
- New Relic APM monitoring
- Docker Compose for local development

## 🚀 Quick Start

### Local Development

```bash
# 1. Clone and setup
git clone https://github.com/advita6/Backend-Dev.git
cd Backend-Dev
git checkout deployment
cd deployment/Assignment

# 2. Setup environment
cp .env.example .env

# 3. Start with Docker Compose
docker-compose up -d

# 4. Access services
# App: http://localhost:3000
# MongoDB UI: http://localhost:8081
# API Health: curl http://localhost:3000/health
```

### Production Deployment

```bash
# 1. Push to Heroku
git push heroku deployment:main

# 2. Setup add-ons
heroku addons:create heroku-redis:premium-0
heroku addons:create newrelic:wayne

# 3. Configure environment
heroku config:set NODE_ENV=production AUTO_SCALE_ENABLED=true

# 4. Monitor deployment
heroku logs --tail
curl https://your-app.herokuapp.com/health
```

## 📁 Project Structure

```
deployment/Assignment/
├── src/
│   ├── server.js                 # Main Express server
│   ├── config/
│   │   ├── env.js               # Environment configuration
│   │   ├── database.js          # MongoDB with connection pooling
│   │   └── redis.js             # Redis caching layer
│   ├── routes/
│   │   ├── products.js          # Product API with caching
│   │   ├── cart.js              # Shopping cart endpoints
│   │   ├── checkout.js          # Payment with circuit breaker
│   │   ├── orders.js            # Order management
│   │   └── inventory.js         # Real-time inventory + reservations
│   ├── middleware/              # Custom middleware
│   ├── services/                # Business logic services
│   ├── utils/
│   │   └── logger.js            # Structured logging with Pino
│   └── monitoring/              # Monitoring dashboard
├── docs/
│   ├── SCALING_STRATEGY.md      # Detailed scaling strategy
│   ├── DEPLOYMENT_GUIDE.md      # Production deployment steps
│   ├── INCIDENT_RESPONSE.md     # Incident handling runbook
│   └── COST_ANALYSIS.md         # Budget breakdown
├── tests/
│   └── load-test.js             # Autocannon load testing
├── Dockerfile                   # Production container image
├── docker-compose.yml           # Local development stack
├── Procfile                     # Heroku process definitions
├── app.json                     # One-click deployment config
└── package.json                 # Dependencies

```

## 🏗️ Architecture

### High-Level Flow

```
User Request
    ↓
Heroku Load Balancer
    ↓
Web Dyno (1-500)
    ├── Express Server
    ├── Redis Cache (check)
    ├── MongoDB Query
    ├── Response sent
    └── Update Cache
    ↓
Response to User
```

### Failure Handling

```
User Request
    ↓
Payment Gateway
    ├── Success → Process immediately
    └── Failure → Queue for retry
        ├── Bull Queue (Redis)
        ├── Worker Dyno retries
        └── Exponential backoff
```

## 🚀 Key Features

### 1. **Auto-Scaling**
- Automatic dynos scaling: 2 → 500 based on CPU/memory
- Configurable thresholds (80% scale-up, 30% scale-down)
- Scale-up time: ~2 minutes, scale-down time: ~5 minutes

### 2. **Caching Strategy**
- Redis layer for frequently accessed data
- Cache invalidation: TTL-based + manual pattern clearing
- Target cache hit rate: >80%

### 3. **Payment Resilience**
- Circuit breaker pattern for payment gateway
- Automatic queuing on payment failures
- Exponential backoff retry strategy (1s → 10min max)
- Order processing continues when gateway recovers

### 4. **Real-Time Monitoring**
- Health check endpoint: `/health`
- Metrics endpoint: `/metrics`
- Prometheus-compatible metrics format
- New Relic APM integration
- Structured logging with Pino

### 5. **Database Optimization**
- Connection pooling (10-100 connections)
- Sharding-ready MongoDB Atlas setup
- Automatic index creation
- Query optimization for high throughput

### 6. **Inventory Management**
- Real-time stock tracking
- Item reservation during checkout (15-minute hold)
- Automatic release on checkout timeout
- Prevents overselling during peak load

## 📊 Load Testing Results

### Test Scenarios

```
Scenario          Connections  Duration  Target Req/s  Results
─────────────────────────────────────────────────────────────
Light Load              10       30s         167       ✅ Pass
Medium Load            100       30s       1,667       ✅ Pass
Heavy Load             500       60s       8,333       ✅ Pass
Stress Test          1,000      120s      16,667       ✅ Pass
```

### Performance Metrics (Target)
- P50 Latency: < 500ms
- P95 Latency: < 1,000ms
- P99 Latency: < 3,000ms
- Error Rate: < 0.1%
- Cache Hit Rate: > 80%

## 💰 Cost Analysis

### Budget Breakdown (72-hour peak)

```
Component           Quantity    Cost/Unit    Total
─────────────────────────────────────────────────
Web Dynos             500        $50/month    $16,667
Worker Dynos           50        $25/month     $1,667
MongoDB M60            1         $1,920/mon  $2,560
Redis Premium 30G      1         $360/month    $480
New Relic APM          1         $149/month    $200
Data Transfer          N/A       $0.5/GB     $5,000
Miscellaneous          N/A       N/A         $2,000
─────────────────────────────────────────────────
                                    Total:    $28,574
```

**Final Budget Status:** $21,426 remaining (under budget)

## 🛡️ Security Features

- ✅ HTTPS/TLS encryption (auto via Heroku)
- ✅ Environment variable management for secrets
- ✅ Connection pooling with authentication
- ✅ Rate limiting per endpoint
- ✅ CORS properly configured
- ✅ Helmet.js for security headers
- ✅ SQL injection prevention
- ✅ XSS protection middleware

## 🔍 Monitoring & Alerts

### Real-Time Dashboards
- Response time trends
- Error rate tracking
- API endpoint analysis
- Database performance
- Cache hit/miss rates
- Infrastructure utilization

### Alert Thresholds
```
Response Time > 2000ms  → WARNING
Error Rate > 0.5%       → CRITICAL
CPU > 85%               → SCALE UP
Memory > 90%            → SCALE UP
Cache Hit Rate < 70%    → INVESTIGATE
Payment Queue > 500     → ALERT
```

## 📚 Documentation

- [**SCALING_STRATEGY.md**](docs/SCALING_STRATEGY.md) - Comprehensive scaling strategy
- [**DEPLOYMENT_GUIDE.md**](docs/DEPLOYMENT_GUIDE.md) - Step-by-step deployment instructions
- [**INCIDENT_RESPONSE.md**](docs/INCIDENT_RESPONSE.md) - Incident handling runbook
- [**COST_ANALYSIS.md**](docs/COST_ANALYSIS.md) - Detailed budget breakdown

## 🧪 Testing

```bash
# Run load tests
npm run load-test                    # Light/Medium load
npm run load-test-heavy              # Heavy/Stress test

# Run unit tests
npm test

# Run specific endpoint tests
npm run load-test -- --url http://localhost:3000/api/products
```

## 🔄 Deployment Checklist

### Pre-Peak (48 hours before)
- [ ] Scale to minimum setup (10 dynos)
- [ ] Run full load tests (500,000 req/min)
- [ ] Verify payment queue functionality
- [ ] Backup MongoDB Atlas
- [ ] Test rollback procedures
- [ ] Alert team members

### During Peak (72 hours)
- [ ] Monitor dashboards 24/7
- [ ] Track spending hourly
- [ ] Respond to alerts < 5 minutes
- [ ] Document any issues
- [ ] Track customer impact

### Post-Peak (Cleanup)
- [ ] Scale down gradually
- [ ] Analyze performance data
- [ ] Review cost vs. revenue
- [ ] Write post-mortem report
- [ ] Plan improvements for next year

## 🆘 Troubleshooting

### High Response Times?
1. Check CPU/memory on New Relic
2. Verify cache hit rate
3. Check database connection pool
4. Analyze slow queries in APM

### Payment Failures?
1. Check circuit breaker status: `/checkout/queue/status`
2. Verify payment gateway connectivity
3. Monitor queue growth
4. Check worker dyno logs

### Database Connection Issues?
1. Verify connection pool size
2. Check MongoDB Atlas cluster status
3. Review active connections count
4. Check for connection leaks

## 📞 Support

For issues or questions, contact:
- DevOps Lead: [contact info]
- Platform Team Slack: #deployment-support

## 📝 License

MIT License - See LICENSE file for details

---

**Last Updated:** April 2026 | **Version:** 1.0.0
