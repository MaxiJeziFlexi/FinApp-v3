const puppeteer = require('puppeteer');

class LoadTester {
  constructor(options = {}) {
    this.concurrentUsers = options.concurrentUsers || 10;
    this.testDuration = options.testDuration || 60000; // 1 minute
    this.baseUrl = options.baseUrl || 'http://localhost:3000';
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      responseTimes: [],
      errors: []
    };
  }

  async simulateUser(userId) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    const startTime = Date.now();
    const endTime = startTime + this.testDuration;
    
    console.log(`User ${userId} started simulation`);
    
    try {
      while (Date.now() < endTime) {
        await this.performUserActions(page, userId);
        await this.randomDelay(1000, 3000);
      }
    } catch (error) {
      this.results.errors.push({
        userId,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      await browser.close();
      console.log(`User ${userId} finished simulation`);
    }
  }

  async performUserActions(page, userId) {
    const actions = [
      () => this.loadDashboard(page),
      () => this.loadAnalytics(page),
      () => this.loadTransactions(page),
      () => this.loadInvestments(page),
      () => this.interactWithCharts(page),
      () => this.searchTransactions(page)
    ];

    // Randomly select and perform an action
    const action = actions[Math.floor(Math.random() * actions.length)];
    await action();
  }

  async loadDashboard(page) {
    const startTime = Date.now();
    try {
      await page.goto(`${this.baseUrl}/dashboard`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
    } catch (error) {
      this.recordFailure(error);
    }
  }

  async loadAnalytics(page) {
    const startTime = Date.now();
    try {
      await page.goto(`${this.baseUrl}/analytics`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      // Wait for charts to load
      await page.waitForSelector('canvas, svg', { timeout: 5000 }).catch(() => {});
      
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
    } catch (error) {
      this.recordFailure(error);
    }
  }

  async loadTransactions(page) {
    const startTime = Date.now();
    try {
      await page.goto(`${this.baseUrl}/transactions`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
    } catch (error) {
      this.recordFailure(error);
    }
  }

  async loadInvestments(page) {
    const startTime = Date.now();
    try {
      await page.goto(`${this.baseUrl}/investments`, {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const responseTime = Date.now() - startTime;
      this.recordSuccess(responseTime);
      
    } catch (error) {
      this.recordFailure(error);
    }
  }

  async interactWithCharts(page) {
    try {
      const charts = await page.$$('canvas, svg');
      if (charts.length > 0) {
        const chart = charts[Math.floor(Math.random() * charts.length)];
        await chart.hover();
        await this.randomDelay(500, 1500);
      }
    } catch (error) {
      // Chart interaction is optional
    }
  }

  async searchTransactions(page) {
    try {
      const searchInputs = await page.$$('input[type="search"], input[placeholder*="search" i], input[placeholder*="szukaj" i]');
      if (searchInputs.length > 0) {
        const input = searchInputs[0];
        await input.type('test search');
        await page.keyboard.press('Enter');
        await this.randomDelay(1000, 2000);
      }
    } catch (error) {
      // Search is optional
    }
  }

  recordSuccess(responseTime) {
    this.results.totalRequests++;
    this.results.successfulRequests++;
    this.results.responseTimes.push(responseTime);
  }

  recordFailure(error) {
    this.results.totalRequests++;
    this.results.failedRequests++;
    this.results.errors.push({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }

  async randomDelay(min, max) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min;
    await new Promise(resolve => setTimeout(resolve, delay));
  }

  calculateResults() {
    if (this.results.responseTimes.length > 0) {
      this.results.averageResponseTime = 
        this.results.responseTimes.reduce((a, b) => a + b, 0) / this.results.responseTimes.length;
    }

    this.results.responseTimes.sort((a, b) => a - b);
    const len = this.results.responseTimes.length;
    
    return {
      ...this.results,
      successRate: (this.results.successfulRequests / this.results.totalRequests * 100).toFixed(2),
      medianResponseTime: len > 0 ? this.results.responseTimes[Math.floor(len / 2)] : 0,
      p95ResponseTime: len > 0 ? this.results.responseTimes[Math.floor(len * 0.95)] : 0,
      p99ResponseTime: len > 0 ? this.results.responseTimes[Math.floor(len * 0.99)] : 0,
      minResponseTime: len > 0 ? Math.min(...this.results.responseTimes) : 0,
      maxResponseTime: len > 0 ? Math.max(...this.results.responseTimes) : 0
    };
  }

  async runLoadTest() {
    console.log(`Starting load test with ${this.concurrentUsers} concurrent users for ${this.testDuration/1000} seconds`);
    console.log(`Target URL: ${this.baseUrl}`);
    
    const startTime = Date.now();
    
    // Start concurrent user simulations
    const userPromises = [];
    for (let i = 0; i < this.concurrentUsers; i++) {
      userPromises.push(this.simulateUser(i + 1));
    }
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    const totalTime = Date.now() - startTime;
    const results = this.calculateResults();
    
    console.log('\n=== LOAD TEST RESULTS ===');
    console.log(`Total test time: ${(totalTime/1000).toFixed(2)} seconds`);
    console.log(`Concurrent users: ${this.concurrentUsers}`);
    console.log(`Total requests: ${results.totalRequests}`);
    console.log(`Successful requests: ${results.successfulRequests}`);
    console.log(`Failed requests: ${results.failedRequests}`);
    console.log(`Success rate: ${results.successRate}%`);
    console.log(`Average response time: ${results.averageResponseTime.toFixed(2)}ms`);
    console.log(`Median response time: ${results.medianResponseTime}ms`);
    console.log(`95th percentile: ${results.p95ResponseTime}ms`);
    console.log(`99th percentile: ${results.p99ResponseTime}ms`);
    console.log(`Min response time: ${results.minResponseTime}ms`);
    console.log(`Max response time: ${results.maxResponseTime}ms`);
    console.log(`Requests per second: ${(results.totalRequests / (totalTime/1000)).toFixed(2)}`);
    
    if (results.errors.length > 0) {
      console.log('\n=== ERRORS ===');
      results.errors.forEach((error, index) => {
        console.log(`${index + 1}. ${error.error} (${error.timestamp})`);
      });
    }
    
    return results;
  }
}

// Export for use in tests
module.exports = LoadTester;

// Run load test if called directly
if (require.main === module) {
  const loadTester = new LoadTester({
    concurrentUsers: process.env.CONCURRENT_USERS || 10,
    testDuration: process.env.TEST_DURATION || 60000,
    baseUrl: process.env.BASE_URL || 'http://localhost:3000'
  });
  
  loadTester.runLoadTest().catch(console.error);
}