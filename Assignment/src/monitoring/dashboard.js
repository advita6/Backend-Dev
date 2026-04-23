const express = require('express');
const router = express.Router();
const path = require('path');

// Serve the dashboard UI
router.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Black Friday Monitoring Dashboard</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #0f172a; color: #f8fafc; margin: 0; padding: 20px; }
        .grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background-color: #1e293b; border-radius: 12px; padding: 20px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #334155; }
        .card h2 { margin-top: 0; font-size: 1.25rem; color: #38bdf8; border-bottom: 1px solid #334155; padding-bottom: 10px; }
        .stat { font-size: 2.5rem; font-weight: bold; margin: 10px 0; color: #f1f5f9; }
        .stat-label { font-size: 0.875rem; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.05em; }
        .status-up { color: #4ade80; }
        .status-down { color: #f87171; }
        .status-warning { color: #fbbf24; }
        .chart-container { height: 200px; position: relative; }
        header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
        .badge { padding: 4px 12px; border-radius: 9999px; font-size: 0.875rem; font-weight: 600; }
        .badge-live { background-color: #4ade8020; color: #4ade80; border: 1px solid #4ade8040; animation: pulse 2s infinite; }
        @keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.5; } 100% { opacity: 1; } }
    </style>
</head>
<body>
    <header>
        <h1>🚀 Black Friday Ops Center</h1>
        <div class="badge badge-live">LIVE MONITORING</div>
    </header>

    <div class="grid">
        <div class="card">
            <h2>System Health</h2>
            <div id="health-status" class="stat status-up">UP</div>
            <div class="stat-label">Server Status</div>
            <div id="uptime" style="margin-top: 10px; font-size: 0.875rem; color: #94a3b8;">Uptime: 0h 0m 0s</div>
        </div>
        <div class="card">
            <h2>Traffic</h2>
            <div id="request-rate" class="stat">0</div>
            <div class="stat-label">Requests Per Minute</div>
        </div>
        <div class="card">
            <h2>Latency</h2>
            <div id="avg-latency" class="stat">0ms</div>
            <div class="stat-label">Average Response Time</div>
        </div>
        <div class="card">
            <h2>Infrastructure</h2>
            <div id="dynos" class="stat">10</div>
            <div class="stat-label">Active Dynos</div>
        </div>
    </div>

    <div class="grid" style="margin-top: 20px;">
        <div class="card">
            <h2>Response Time History</h2>
            <div class="chart-container">
                <canvas id="latencyChart"></canvas>
            </div>
        </div>
        <div class="card">
            <h2>Database Performance</h2>
            <div id="db-state" class="stat-label">State: Connected</div>
            <div id="db-pool" class="stat-label">Active Pool: 50</div>
            <div style="margin-top: 20px;">
                <canvas id="dbChart"></canvas>
            </div>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('latencyChart').getContext('2d');
        const latencyChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'P95 Latency (ms)',
                    data: [],
                    borderColor: '#38bdf8',
                    backgroundColor: '#38bdf820',
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: '#334155' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
                plugins: { legend: { display: false } }
            }
        });

        async function updateMetrics() {
            try {
                const response = await fetch('/metrics');
                const data = await response.json();
                
                document.getElementById('health-status').innerText = 'UP';
                document.getElementById('uptime').innerText = \`Uptime: \${Math.floor(data.process.uptime / 3600)}h \${Math.floor((data.process.uptime % 3600) / 60)}m \${Math.floor(data.process.uptime % 60)}s\`;
                
                // Simulated request rate for demo
                const simulatedRate = Math.floor(Math.random() * 50000) + 450000;
                document.getElementById('request-rate').innerText = simulatedRate.toLocaleString();
                
                const simulatedLatency = Math.floor(Math.random() * 100) + 150;
                document.getElementById('avg-latency').innerText = \`\${simulatedLatency}ms\`;
                
                // Update chart
                const now = new Date().toLocaleTimeString();
                if (latencyChart.data.labels.length > 20) {
                    latencyChart.data.labels.shift();
                    latencyChart.data.datasets[0].data.shift();
                }
                latencyChart.data.labels.push(now);
                latencyChart.data.datasets[0].data.push(simulatedLatency);
                latencyChart.update();
                
            } catch (error) {
                console.error('Failed to fetch metrics:', error);
                document.getElementById('health-status').innerText = 'ERROR';
                document.getElementById('health-status').className = 'stat status-down';
            }
        }

        setInterval(updateMetrics, 5000);
        updateMetrics();
    </script>
</body>
</html>
  `);
});

module.exports = router;
