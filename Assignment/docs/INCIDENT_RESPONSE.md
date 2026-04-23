# MONITORING & INCIDENT RESPONSE RUNBOOK

## 1. MONITORING SETUP

### Key Metrics to Monitor

#### 1.1 Application Performance
```
Metric                  | Alert Threshold | P95 Target
---------------------------------------------------
Response Time          | > 2000ms        | < 1000ms
Error Rate             | > 0.5%          | < 0.1%
Requests/sec           | Monitor         | 100k+
Throughput (MB/s)      | Monitor         | Varies
P99 Latency            | > 5000ms        | < 3000ms
```

#### 1.2 Infrastructure
```
Metric                  | Warning | Critical
---------------------------------------------
CPU Usage             | > 70%   | > 90%
Memory Usage          | > 80%   | > 95%
Disk Usage            | > 80%   | > 95%
Network I/O           | Monitor | Very High
```

#### 1.3 Database
```
Metric                  | Alert Threshold
-------------------------------------------
Connection Pool        | > 90% utilization
Query Latency          | > 500ms (p95)
Active Connections     | > 80
Replication Lag        | > 1 second
Storage Used           | > 85% capacity
```

#### 1.4 Cache
```
Metric                  | Alert Threshold
-------------------------------------------
Cache Hit Rate         | < 70%
Evicted Keys           | > 1000/sec
Memory Usage           | > 90%
Commands/sec           | Monitor
```

### Monitoring Tools

#### New Relic APM
```bash
# Access: heroku addons:open newrelic

# Key Dashboards:
- Overview: Response time, throughput, error rate
- Transactions: Slowest endpoints
- Errors: Error distribution
- Databases: Query performance
- Infrastructure: CPU, memory, disk
```

#### Prometheus + Grafana
```bash
# Metrics endpoint: /metrics
# Scrape interval: 15 seconds
# Retention: 15 days
```

#### Heroku Logs
```bash
# Real-time logs
heroku logs --tail -a ecommerce-black-friday

# Search logs
heroku logs --grep "error" -a ecommerce-black-friday

# Export logs
heroku logs --ps api --tail > api.log
```

## 2. ALERT CONFIGURATION

### Slack Integration
```bash
# Configure Slack notifications
heroku log-drains:add syslog://your-slack-webhook
```

### Alert Rules

#### CRITICAL (Immediate action required)
- Error rate > 1%
- Response time p99 > 5000ms
- Database down
- Payment gateway down + queue > 500 items
- Out of memory

#### HIGH (Action within 15 minutes)
- Error rate > 0.5%
- Response time p95 > 2000ms
- Cache hit rate < 50%
- CPU > 85%
- Database connections > 90%

#### MEDIUM (Action within 1 hour)
- Response time p95 > 1500ms
- Cache hit rate < 70%
- Storage used > 85%
- Minor errors appearing

## 3. COMMON INCIDENTS & RESPONSES

### Incident 1: High Response Times

**Symptoms:**
- P95 latency > 2000ms
- Response time metric spiking

**Investigation Steps:**
```bash
# 1. Check server logs
heroku logs --tail -a ecommerce-black-friday

# 2. Check current load
curl https://ecommerce-black-friday.herokuapp.com/metrics

# 3. Check database performance
# - Query New Relic APM
# - Look for slow queries
# - Check connection pool status

# 4. Check cache hit rate
# - Query /metrics endpoint
# - Look for REDIS stats
```

**Resolution:**
```
a) If CPU high:
   - Scale up dynos: heroku ps:scale web=20
   - Check for infinite loops in code

b) If DB connections maxed:
   - Increase pool size (if possible)
   - Reduce query complexity
   - Add database indexes

c) If cache hit rate low:
   - Clear cache: heroku redis:clear
   - Analyze cache invalidation
   - Increase cache TTL
```

### Incident 2: Payment System Failures

**Symptoms:**
- Checkout endpoint returns 503
- /checkout/queue/status shows > 100 items

**Investigation:**
```bash
# 1. Check circuit breaker status
curl https://ecommerce-black-friday.herokuapp.com/checkout/queue/status

# 2. Verify external service
curl -I https://api.payment.local/health

# 3. Check queued orders
# See response: pendingOrders count
```

**Resolution:**
```
a) If payment gateway is down:
   - Confirm status with payment provider
   - Orders will auto-retry every minute
   - Estimated recovery time: [provider dependent]
   - NO USER ACTION NEEDED: Orders queued safely

b) If too many retries accumulating:
   - Increase queue concurrency
   - heroku config:set QUEUE_CONCURRENCY=100
   - Monitor weekly until resolved

c) If circuit breaker stuck OPEN:
   - Check logs: grep "Circuit breaker"
   - After 30s timeout, should transition to HALF_OPEN
   - Force clear if needed: Restart dyno
```

### Incident 3: Database Connection Exhaustion

**Symptoms:**
- New connections refused
- "Too many connections" errors
- Response time high

**Investigation:**
```bash
# 1. Check connection pool status
curl https://ecommerce-black-friday.herokuapp.com/metrics

# 2. Check active connections
# MongoDB: db.currentOp()
# Verify in New Relic: Database → Connections

# 3. Identify connection leaks
heroku logs | grep "connection"
```

**Resolution:**
```
a) If leak detected:
   - Restart dynos: heroku ps:restart
   - Should clear zombie connections
   - Monitor for recurrence

b) If consistently maxed:
   - Increase MONGODB_POOL_SIZE
   - heroku config:set MONGODB_POOL_SIZE=150
   - Restart dyno to apply

c) If still failing:
   - Increase MongoDB cluster size
   - Scale to M80 or implement sharding
   - Contact MongoDB Atlas support
```

### Incident 4: Memory Leak

**Symptoms:**
- Memory usage growth over hours
- Dyno crashes/restarts
- P error: "FATAL ERROR: CALL_AND_RETRY_LAST"

**Investigation:**
```bash
# 1. Check memory trend
# New Relic → Infrastructure → Memory

# 2. Check for memory warnings
heroku logs | grep "memory\|heap"

# 3. Take heap snapshot
# New Relic → Application Monitoring → Profile
```

**Resolution:**
```
a) Temporary fix:
   - Scale out (add more dynos)
   - Increase dyno size: Standard-2x → Standard-1x
   - heroku ps:scale web=20:standard-2x

b) Permanent fix:
   - Identify memory leak in code
   - Review release notes for known issues
   - Update to latest Node.js version
   - Deploy fix and restart

c) Emergency:
   - If affecting many dynos
   - Consider rollback to previous version
   - heroku rollbacks:create
```

### Incident 5: 5xx Error Rate Spike

**Symptoms:**
- Sudden increase in 500, 502, 503 errors
- Error rate > 1%
- User complaints of timeouts

**Investigation:**
```bash
# 1. Check recent deployments
heroku releases -a ecommerce-black-friday

# 2. Search for errors
heroku logs --grep "ERROR\|error" --tail

# 3. Check critical services
curl https://ecommerce-black-friday.herokuapp.com/health

# 4. Check database connectivity
curl https://ecommerce-black-friday.herokuapp.com/metrics
```

**Resolution:**
```
a) If caused by recent deployment:
   - Rollback immediately
   - heroku rollbacks:create
   - Investigate failed changes

b) If database unreachable:
   - Check MONGODB_URI connection
   - Verify MongoDB Atlas cluster status
   - Check firewall rules

c) If queue backed up:
   - Restart worker dynos
   - heroku ps:restart worker
   - Increase worker concurrency

d) If random errors:
   - Check disk space: df -h
   - Check logs for specific errors
   - Contact Heroku support if infrastructure issue
```

## 4. ESCALATION PROCEDURES

### Severity Levels

**P1 (Critical)**: Immediate escalation
- Service completely down
- Payment processing broken
- > 5% error rate
- Revenue impact

**P2 (High)**: Escalate within 15 minutes
- Performance degradation
- Payment delays
- 1-5% error rate

**P3 (Medium)**: Escalate within 1 hour
- Performance issues
- Monitoring alerts
- Non-critical feature issues

### Escalation Chain
1. On-Call DevOps Engineer
2. Platform Lead
3. VP Engineering
4. CTO (if P1 and > 30 minutes unresolved)

## 5. POST-INCIDENT ANALYSIS

### Post-Mortem Template

```
Incident ID: INC-XXXX
Date: YYYY-MM-DD
Severity: P1/P2/P3
Duration: HH:MM

What happened:
[Description of incident]

Root cause:
[Actual root cause, not symptom]

Timeline:
- HH:MM Detection
- HH:MM Investigation started
- HH:MM Root cause identified
- HH:MM Resolution started
- HH:MM Service restored

What we did right:
[Good practices followed]

What we could improve:
[Lessons learned]

Follow-up actions:
1. [Action item]
2. [Action item]
```

### Continuous Improvement
- Weekly review of critical incidents
- Monthly monitoring strategy updates
- Quarterly alert threshold tuning
- Annual disaster recovery testing

---

**Incident Response Runbook v1.0** | Last Updated: April 2026
