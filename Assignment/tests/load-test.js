/**
 * Load Testing Script
 * Tests system performance under various load scenarios
 */

const autocannon = require('autocannon');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const RESULTS_DIR = 'test-results';

// Ensure results directory exists
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR);
}

const scenarios = [
  {
    name: 'Light Load (10 req/sec)',
    config: {
      url: BASE_URL,
      connections: 10,
      pipelining: 1,
      duration: 30,
      requests: [
        {
          path: '/api/products',
          method: 'GET',
        },
      ],
    },
  },
  {
    name: 'Medium Load (100 req/sec)',
    config: {
      url: BASE_URL,
      connections: 100,
      pipelining: 100,
      duration: 30,
      requests: [
        { path: '/api/products', method: 'GET', weight: 40 },
        { path: '/api/products/1', method: 'GET', weight: 30 },
        { path: '/api/cart/session123/add', method: 'POST', weight: 20, body: JSON.stringify({ productId: '1', quantity: 1, price: 299.99 }) },
        { path: '/api/inventory/1', method: 'GET', weight: 10 },
      ],
    },
  },
  {
    name: 'Heavy Load (500 req/sec)',
    config: {
      url: BASE_URL,
      connections: 500,
      pipelining: 500,
      duration: 60,
      requests: [
        { path: '/api/products', method: 'GET', weight: 30 },
        { path: '/api/products/search/query?q=smart', method: 'GET', weight: 25 },
        { path: '/api/cart/session123/add', method: 'POST', weight: 25, body: JSON.stringify({ productId: '1', quantity: 1, price: 299.99 }) },
        { path: '/api/inventory/check', method: 'POST', weight: 10, body: JSON.stringify({ items: [{ productId: '1', quantity: 1 }] }) },
        { path: '/api/health', method: 'GET', weight: 10 },
      ],
    },
  },
  {
    name: 'Stress Test (1000 req/sec)',
    config: {
      url: BASE_URL,
      connections: 1000,
      pipelining: 1000,
      duration: 120,
      requests: [
        { path: '/api/products', method: 'GET', weight: 25 },
        { path: '/api/cart/session123/add', method: 'POST', weight: 30, body: JSON.stringify({ productId: '1', quantity: 1, price: 299.99 }) },
        { path: '/api/checkout/pay', method: 'POST', weight: 20, body: JSON.stringify({ orderId: 'ORD-1234', amount: 299.99, paymentMethod: 'credit_card' }) },
        { path: '/api/inventory/reserve', method: 'POST', weight: 15, body: JSON.stringify({ reservationId: 'RES-1234', items: [{ productId: '1', quantity: 1 }] }) },
        { path: '/api/health', method: 'GET', weight: 10 },
      ],
    },
  },
];

const formatResults = (title, results) => {
  return `
=================================
${title}
=================================
Duration: ${results.duration}s
Requests Completed: ${results.requests.total}
Requests/sec: ${results.requests.mean}
Throughput (MB/s): ${results.throughput.average}
Latency:
  - Mean: ${results.latency.mean}ms
  - Median: ${results.latency.p50}ms
  - p95: ${results.latency.p95}ms
  - p99: ${results.latency.p99}ms
Errors: ${results.errors}
Timeouts: ${results.timeouts}
=================================
`;
};

const runScenario = async (scenario, index) => {
  return new Promise((resolve) => {
    console.log(`\n📊 Running scenario ${index + 1}/${scenarios.length}: ${scenario.name}\n`);
    
    const instance = autocannon({ ...scenario.config }, (err, results) => {
      if (err) {
        console.error('Error running test:', err);
        resolve(null);
        return;
      }
      
      const formatted = formatResults(scenario.name, results);
      console.log(formatted);
      
      // Save results to file
      const filename = path.join(RESULTS_DIR, `${scenario.name.replace(/\s+/g, '_')}-${Date.now()}.json`);
      fs.writeFileSync(filename, JSON.stringify(results, null, 2));
      console.log(`✓ Results saved to ${filename}\n`);
      
      resolve(results);
    });
    
    // Print progress
    autocannon.track(instance, { renderProgressBar: true });
  });
};

const runAllScenarios = async () => {
  console.log('🚀 Starting Load Testing Suite');
  console.log(`Target: ${BASE_URL}\n`);
  
  const allResults = [];
  
  for (let i = 0; i < scenarios.length; i++) {
    const results = await runScenario(scenarios[i], i);
    if (results) {
      allResults.push({
        scenario: scenarios[i].name,
        results,
      });
    }
  }
  
  // Generate summary report
  const summaryFile = path.join(RESULTS_DIR, `summary-${Date.now()}.json`);
  fs.writeFileSync(summaryFile, JSON.stringify(allResults, null, 2));
  
  console.log('\n✓ All tests completed!');
  console.log(`✓ Summary saved to ${summaryFile}`);
};

// Run tests
runAllScenarios().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
