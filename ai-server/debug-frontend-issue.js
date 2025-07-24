#!/usr/bin/env node

// Debug script to identify frontend connection issues
const http = require('http');
const https = require('https');

console.log('🔍 Debugging Frontend Connection Issues...\n');

// Test different ports and endpoints
const tests = [
    { name: 'Backend Port 8000', url: 'http://localhost:8000/' },
    { name: 'Old Port 4001', url: 'http://localhost:4001/' },
    { name: 'Login Endpoint (8000)', url: 'http://localhost:8000/api/login' },
    { name: 'Login Endpoint (4001)', url: 'http://localhost:4001/login' },
    { name: 'Chat Endpoint', url: 'http://localhost:8000/api/chat' },
    { name: 'Decision Tree', url: 'http://localhost:8000/api/decision-tree' }
];

async function testEndpoint(test) {
    return new Promise((resolve) => {
        const url = new URL(test.url);
        const client = url.protocol === 'https:' ? https : http;
        
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname,
            method: test.url.includes('login') || test.url.includes('chat') || test.url.includes('decision-tree') ? 'POST' : 'GET',
            timeout: 3000,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = client.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    name: test.name,
                    status: res.statusCode,
                    success: res.statusCode < 500,
                    response: data.substring(0, 100) + (data.length > 100 ? '...' : '')
                });
            });
        });

        req.on('error', (err) => {
            resolve({
                name: test.name,
                status: 'ERROR',
                success: false,
                error: err.code || err.message
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                name: test.name,
                status: 'TIMEOUT',
                success: false,
                error: 'Request timeout'
            });
        });

        // Send empty JSON for POST requests
        if (options.method === 'POST') {
            req.write('{}');
        }
        
        req.end();
    });
}

async function runTests() {
    console.log('Testing endpoints...\n');
    
    for (const test of tests) {
        const result = await testEndpoint(test);
        const status = result.success ? '✅' : '❌';
        const statusText = result.status === 'ERROR' ? result.error : 
                          result.status === 'TIMEOUT' ? 'TIMEOUT' : 
                          `HTTP ${result.status}`;
        
        console.log(`${status} ${result.name}: ${statusText}`);
        
        if (result.response && result.success) {
            console.log(`   Response: ${result.response}`);
        }
        if (result.error && !result.success) {
            console.log(`   Error: ${result.error}`);
        }
        console.log('');
    }
    
    // Provide recommendations
    console.log('🔧 RECOMMENDATIONS:\n');
    
    const port8000Working = tests.find(t => t.name === 'Backend Port 8000')?.success;
    const port4001Working = tests.find(t => t.name === 'Old Port 4001')?.success;
    
    if (port8000Working && !port4001Working) {
        console.log('✅ Backend is running on port 8000 (correct)');
        console.log('❌ Port 4001 is not responding (expected)');
        console.log('');
        console.log('🔧 FRONTEND FIX NEEDED:');
        console.log('   Update your React app to use:');
        console.log('   http://localhost:8000/api/login');
        console.log('   Instead of:');
        console.log('   http://localhost:4001/login');
        console.log('');
        console.log('📝 Search and replace in your frontend code:');
        console.log('   "http://localhost:4001" → "http://localhost:8000/api"');
    } else if (!port8000Working && !port4001Working) {
        console.log('❌ No backend server is running');
        console.log('');
        console.log('🚀 START BACKEND:');
        console.log('   cd /Users/maksbraziewicz/Desktop/logistics-dashboard/ai-server');
        console.log('   python3 main.py');
        console.log('');
        console.log('   Or use the startup script:');
        console.log('   ./start-system.sh');
    } else if (port4001Working) {
        console.log('⚠️  Backend is running on port 4001 (unexpected)');
        console.log('   Check if another service is running on 4001');
        console.log('   The main backend should be on port 8000');
    }
    
    console.log('');
    console.log('📋 NEXT STEPS:');
    console.log('1. Ensure backend runs on port 8000');
    console.log('2. Update frontend URLs to use port 8000');
    console.log('3. Add /api prefix to all endpoints');
    console.log('4. Test advisor functionality');
}

// Run the tests
runTests().catch(console.error);