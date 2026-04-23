# SCALING STRATEGY DOCUMENT

## Executive Summary
This document outlines the comprehensive scaling strategy for handling the 50x traffic increase (10,000 to 500,000 req/min) during Black Friday/Cyber Monday peak season.

## 1. HEROKU AUTO-SCALING CONFIGURATION

### Dyno Scaling
```
MIN_DYNOS=2
MAX_DYNOS=500
SCALE_UP_THRESHOLD=80% CPU
SCALE_DOWN_THRESHOLD=30% CPU
SCALE_UP_COOLDOWN=30 seconds
SCALE_DOWN_COOLDOWN=5 minutes
```

### Dyno Types
- **Web Dynos**: Standard-2x (2 cores, 2.5GB RAM)
- **Worker Dynos**: Standard-1x for message queue processing
- **Max dynos during peak**: 500 web dynos + 50 worker dynos

### Expected Capacity
- 1 Standard-2x dyno: ~5,000 req/min
- 500 dynos: ~2,500,000 req/min (5x buffer capacity)

## 2. DATABASE SCALING

### MongoDB Atlas M60 Configuration
```
- Storage: 60GB SSD
- RAM: 15GB
- Expandable to M80 (32GB RAM) during peak
```

### Connection Pooling
```
MIN_POOL_SIZE=10
MAX_POOL_SIZE=100
IDLE_TIMEOUT=60 seconds
```

### Performance Optimization
- **Indexes**: Product ID, user email, order status
- **Sharding**: None required for M60 (expandable if needed)
- **Caching**: 600+ seconds for product data
- **Read Preference**: Primary with secondary read preference for reporting

## 3. REDIS CACHE STRATEGY

### Cache Architecture
- **Provider**: Heroku Redis 30GB
- **TTL Settings**:
  - Product data: 600 seconds
  - Search results: 300 seconds
  - Cart data: 3600 seconds
  - Orders: 86400 seconds (24 hours)

### Cache Hit Rate Targets
- Product pages: >90%
- Search results: >80%
- Shopping carts: >70%

### Invalidation Strategy
- Automatic TTL expiration
- Manual invalidation on inventory changes
- Pattern-based clearing: `inventory:*` pattern

## 4. CDN CONFIGURATION

### Static Assets Delivery
- CloudFlare CDN for CSS, JS, images
- Cache Control: max-age=31536000 for versioned assets
- Gzip compression enabled
- Min-max compression size: 1KB-50MB

### Target Metrics
- CDN serving 90%+ of static assets
- Reduced origin server load by 60%
- First-byte-time < 500ms globally

## 5. LOAD BALANCING

### Heroku Load Balancer
- Automatic distribution across dynos
- Session affinity: Sticky sessions for shopping carts
- Health checks: Every 10 seconds
- Failed dyno removal: Automatic within 30 seconds

### Geographic Distribution
- US: Primary
- Europe: Secondary (via CDN)
- Asia: Tertiary (via CDN)

## 6. MESSAGE QUEUE SYSTEM

### Bull Queue Configuration
```
QUEUE_NAME=orders
QUEUE_CONCURRENCY=50
QUEUE_REDIS_URL=redis://...
```

### Order Processing Flow
1. **Normal scenario**: Immediate payment processing
2. **Payment gateway down**: Queue order for retry
3. **Retry strategy**: Exponential backoff (1s, 2s, 4s, 8s...)
4. **Max retries**: 10 with 30-minute maximum delay

### Performance Targets
- Queue processing: <100ms average per item
- Max queue size before alerts: 10,000 items

## 7. MONITORING & ALERTING

### Key Metrics
- Response time (p50, p95, p99)
- Error rate (target: < 0.1%)
- CPU utilization
- Memory usage
- Database connections
- Cache hit rate

### Alert Thresholds
```
Response Time > 2000ms: WARNING
Error Rate > 0.5%: CRITICAL
CPU > 85%: SCALE UP
Memory > 90%: SCALE UP
DB Connections > 90: ALERT
Cache Miss Rate > 30%: INVESTIGATE
```

### Dashboards
- Real-time performance dashboard (Grafana/Prometheus)
- New Relic APM monitoring
- Heroku metrics dashboard
- Custom health metrics endpoint

## 8. COST MANAGEMENT

### Budget Allocation
```
Total Budget: $50,000
Peak Weekend (72 hours): $40,000
Ramp-up/Ramp-down buffer: $10,000
```

### Hourly Cost Limit
```
Max per hour: $2,000
Alert if exceeded: YES
Auto-scale-down if over: YES (graceful)
```

### Cost Optimization
- Scale down when traffic drops below 80%
- Use smaller dynos during off-peak (Standard-1x)
- Scheduled scaling: Pre-plan known traffic patterns
- Database right-sizing: Use M60 normally, expand only when needed

## 9. RESILIENCE PATTERNS

### Circuit Breaker Pattern
```
Failure Threshold: 5 failures
Timeout: 30 seconds
States: CLOSED → OPEN → HALF_OPEN → CLOSED
```

### Retry Strategy
- Max retries: 3 (for critical operations)
- Exponential backoff with jitter
- Timeout per retry: 10 seconds

### Graceful Degradation
- Payment gateway failure: Queue for later
- Cache miss: Direct DB query (slower but works)
- Non-critical endpoint fails: 202 Accepted response

## 10. DEPLOYMENT CHECKLIST

### Pre-Peak Preparation
- [ ] Scale to minimum setup (10 dynos)
- [ ] Verify all integrations working
- [ ] Run load tests with 100,000 req/min
- [ ] Load tests with 500,000 req/min
- [ ] Verify payment queue works correctly
- [ ] Backup database
- [ ] Test rollback procedures

### During Peak
- [ ] Monitor dashboards continuously (24/7)
- [ ] Alert team on any threshold breach
- [ ] Manual scaling if auto-scale fails
- [ ] Track spending hourly
- [ ] Monitor cache effectiveness

### Post-Peak
- [ ] Scale down gradually
- [ ] Analyze performance metrics
- [ ] Review cost vs. revenue
- [ ] Document lessons learned
- [ ] Update for next quarter

## 11. ROLLBACK PROCEDURES

### Scenario 1: Critical Error
```bash
# Rollback to previous version
heroku rollbacks:create

# Monitor new deployment
watch heroku logs --tail
```

### Scenario 2: Database Issues
```bash
# Point to backup MongoDB seed
MONGODB_URI=mongodb://backup-replica-set

# Restart all dynos
heroku dynos:restart
```

### Scenario 3: Payment System Down
- Orders automatically queued
- Manual intervention only needed if queue grows > 50,000

## 12. PERFORMANCE TARGETS

### Response Times
- Product page load: < 1 second (p95)
- Checkout process: < 3 seconds (p95)
- Search results: < 500ms (p95)
- Health checks: < 100ms

### Availability
- Uptime target: 99.99% (< 25 seconds downtime in 72 hours)
- Error rate target: < 0.1%
- Successful payment processing: > 99.9%

### Scalability Metrics
- Auto-scale response time: < 2 minutes
- Request routing time: < 50ms
- Cache invalidation: < 100ms

---

**Document Version**: 1.0
**Last Updated**: April 2026
**Approval**: DevOps Lead
