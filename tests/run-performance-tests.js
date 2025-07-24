#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const LoadTester = require('./load-test');

class PerformanceTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      tests: {},
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        totalDuration: 0
      }
    };
  }

  async checkServerRunning() {
    console.log('Checking if development server is running...');
    
    try {
      const response = await fetch('http://localhost:3000');
      if (response.ok) {
        console.log('✅ Development server is running');
        return true;
      }
    } catch (error) {
      console.log('❌ Development server is not running');
      console.log('Please start the server with: npm run dev');
      return false;
    }
  }

  async runJestTests(testFile, testName) {
    console.log(`\n🧪 Running ${testName}...`);
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const jest = spawn('npx', ['jest', testFile, '--verbose'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      jest.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data);
      });

      jest.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data);
      });

      jest.on('close', (code) => {
        const duration = Date.now() - startTime;
        const success = code === 0;
        
        this.results.tests[testName] = {
          success,
          duration,
          output,
          errorOutput,
          exitCode: code
        };

        this.results.summary.totalTests++;
        if (success) {
          this.results.summary.passedTests++;
          console.log(`✅ ${testName} completed successfully in ${duration}ms`);
        } else {
          this.results.summary.failedTests++;
          console.log(`❌ ${testName} failed in ${duration}ms`);
        }

        resolve(success);
      });
    });
  }

  async runLoadTest() {
    console.log('\n🚀 Running Load Test...');
    
    const startTime = Date.now();
    
    try {
      const loadTester = new LoadTester({
        concurrentUsers: 5, // Reduced for CI/local testing
        testDuration: 30000, // 30 seconds
        baseUrl: 'http://localhost:3000'
      });
      
      const loadResults = await loadTester.runLoadTest();
      const duration = Date.now() - startTime;
      
      this.results.tests['Load Test'] = {
        success: loadResults.successRate > 90, // 90% success rate threshold
        duration,
        loadResults,
        output: `Success Rate: ${loadResults.successRate}%, Avg Response: ${loadResults.averageResponseTime.toFixed(2)}ms`
      };

      this.results.summary.totalTests++;
      if (this.results.tests['Load Test'].success) {
        this.results.summary.passedTests++;
        console.log(`✅ Load Test completed successfully`);
      } else {
        this.results.summary.failedTests++;
        console.log(`❌ Load Test failed - Success rate below threshold`);
      }

      return this.results.tests['Load Test'].success;
    } catch (error) {
      const duration = Date.now() - startTime;
      
      this.results.tests['Load Test'] = {
        success: false,
        duration,
        error: error.message,
        output: `Error: ${error.message}`
      };

      this.results.summary.totalTests++;
      this.results.summary.failedTests++;
      console.log(`❌ Load Test failed: ${error.message}`);
      return false;
    }
  }

  async runLighthouseAudit() {
    console.log('\n💡 Running Lighthouse Performance Audit...');
    
    return new Promise((resolve) => {
      const startTime = Date.now();
      const lighthouse = spawn('npx', ['lighthouse', 'http://localhost:3000/dashboard', 
        '--only-categories=performance', '--output=json', '--quiet'], {
        stdio: 'pipe',
        cwd: process.cwd()
      });

      let output = '';
      let errorOutput = '';

      lighthouse.stdout.on('data', (data) => {
        output += data.toString();
      });

      lighthouse.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      lighthouse.on('close', (code) => {
        const duration = Date.now() - startTime;
        let success = false;
        let performanceScore = 0;

        try {
          if (code === 0 && output) {
            const results = JSON.parse(output);
            performanceScore = results.categories.performance.score * 100;
            success = performanceScore >= 70; // 70% threshold
          }
        } catch (error) {
          errorOutput += `Parse error: ${error.message}`;
        }

        this.results.tests['Lighthouse Audit'] = {
          success,
          duration,
          performanceScore,
          output: success ? `Performance Score: ${performanceScore.toFixed(1)}` : 'Failed to get score',
          errorOutput,
          exitCode: code
        };

        this.results.summary.totalTests++;
        if (success) {
          this.results.summary.passedTests++;
          console.log(`✅ Lighthouse Audit completed - Score: ${performanceScore.toFixed(1)}`);
        } else {
          this.results.summary.failedTests++;
          console.log(`❌ Lighthouse Audit failed or score below threshold`);
        }

        resolve(success);
      });
    });
  }

  generateReport() {
    const reportPath = path.join(__dirname, 'performance-report.json');
    const htmlReportPath = path.join(__dirname, 'performance-report.html');
    
    // Save JSON report
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    
    // Generate HTML report
    const htmlReport = this.generateHtmlReport();
    fs.writeFileSync(htmlReportPath, htmlReport);
    
    console.log(`\n📊 Performance reports generated:`);
    console.log(`   JSON: ${reportPath}`);
    console.log(`   HTML: ${htmlReportPath}`);
  }

  generateHtmlReport() {
    const { summary, tests } = this.results;
    
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Performance Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .summary-card { background: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; }
        .summary-card h3 { margin: 0 0 10px 0; color: #333; }
        .summary-card .value { font-size: 2em; font-weight: bold; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .test-result { margin-bottom: 20px; padding: 20px; border-radius: 8px; border-left: 4px solid #ddd; }
        .test-result.success { border-left-color: #28a745; background: #f8fff9; }
        .test-result.failure { border-left-color: #dc3545; background: #fff8f8; }
        .test-name { font-size: 1.2em; font-weight: bold; margin-bottom: 10px; }
        .test-details { font-size: 0.9em; color: #666; }
        .duration { font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Frontend Performance Test Report</h1>
            <p>Generated on: ${new Date(this.results.timestamp).toLocaleString()}</p>
        </div>
        
        <div class="summary">
            <div class="summary-card">
                <h3>Total Tests</h3>
                <div class="value">${summary.totalTests}</div>
            </div>
            <div class="summary-card">
                <h3>Passed</h3>
                <div class="value passed">${summary.passedTests}</div>
            </div>
            <div class="summary-card">
                <h3>Failed</h3>
                <div class="value failed">${summary.failedTests}</div>
            </div>
            <div class="summary-card">
                <h3>Success Rate</h3>
                <div class="value">${((summary.passedTests / summary.totalTests) * 100).toFixed(1)}%</div>
            </div>
        </div>
        
        <h2>Test Results</h2>
        ${Object.entries(tests).map(([testName, result]) => `
            <div class="test-result ${result.success ? 'success' : 'failure'}">
                <div class="test-name">${testName}</div>
                <div class="test-details">
                    <div>Status: <span class="${result.success ? 'passed' : 'failed'}">${result.success ? 'PASSED' : 'FAILED'}</span></div>
                    <div>Duration: <span class="duration">${result.duration}ms</span></div>
                    ${result.output ? `<div>Output: ${result.output}</div>` : ''}
                    ${result.performanceScore ? `<div>Performance Score: ${result.performanceScore.toFixed(1)}</div>` : ''}
                    ${result.loadResults ? `
                        <div>Load Test Results:</div>
                        <ul>
                            <li>Total Requests: ${result.loadResults.totalRequests}</li>
                            <li>Success Rate: ${result.loadResults.successRate}%</li>
                            <li>Average Response Time: ${result.loadResults.averageResponseTime.toFixed(2)}ms</li>
                            <li>95th Percentile: ${result.loadResults.p95ResponseTime}ms</li>
                        </ul>
                    ` : ''}
                </div>
            </div>
        `).join('')}
    </div>
</body>
</html>`;
  }

  async run() {
    console.log('🚀 Starting Frontend Performance Test Suite');
    console.log('==========================================');
    
    const startTime = Date.now();
    
    // Check if server is running
    const serverRunning = await this.checkServerRunning();
    if (!serverRunning) {
      console.log('\n❌ Cannot run tests without development server');
      process.exit(1);
    }

    // Run all tests
    const testFiles = [
      { file: './performance.test.js', name: 'Performance Tests' },
      { file: './component-performance.test.js', name: 'Component Performance Tests' }
    ];

    for (const test of testFiles) {
      if (fs.existsSync(path.join(__dirname, test.file))) {
        await this.runJestTests(test.file, test.name);
      } else {
        console.log(`⚠️  Test file ${test.file} not found, skipping...`);
      }
    }

    // Run load test
    await this.runLoadTest();

    // Run Lighthouse audit (if lighthouse is available)
    try {
      await this.runLighthouseAudit();
    } catch (error) {
      console.log(`⚠️  Lighthouse not available: ${error.message}`);
    }

    // Calculate total duration
    this.results.summary.totalDuration = Date.now() - startTime;

    // Generate reports
    this.generateReport();

    // Print summary
    console.log('\n📊 PERFORMANCE TEST SUMMARY');
    console.log('============================');
    console.log(`Total Tests: ${this.results.summary.totalTests}`);
    console.log(`Passed: ${this.results.summary.passedTests}`);
    console.log(`Failed: ${this.results.summary.failedTests}`);
    console.log(`Success Rate: ${((this.results.summary.passedTests / this.results.summary.totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${(this.results.summary.totalDuration / 1000).toFixed(2)}s`);

    // Exit with appropriate code
    const success = this.results.summary.failedTests === 0;
    process.exit(success ? 0 : 1);
  }
}

// Run if called directly
if (require.main === module) {
  const runner = new PerformanceTestRunner();
  runner.run().catch(console.error);
}

module.exports = PerformanceTestRunner;