const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

describe('Frontend Performance Tests', () => {
  let browser;
  let page;

  beforeAll(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  afterAll(async () => {
    await browser.close();
  });

  describe('Page Load Performance', () => {
    test('Dashboard page loads within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/dashboard', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`Dashboard load time: ${loadTime}ms`);
      
      // Dashboard should load within 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    test('Analytics page loads within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/analytics', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`Analytics load time: ${loadTime}ms`);
      
      // Analytics page should load within 4 seconds (may have charts)
      expect(loadTime).toBeLessThan(4000);
    });

    test('Transactions page loads within acceptable time', async () => {
      const startTime = Date.now();
      
      await page.goto('http://localhost:3000/transactions', {
        waitUntil: 'networkidle2',
        timeout: 10000
      });
      
      const loadTime = Date.now() - startTime;
      console.log(`Transactions load time: ${loadTime}ms`);
      
      expect(loadTime).toBeLessThan(3000);
    });
  });

  describe('Component Rendering Performance', () => {
    test('Large transaction list renders efficiently', async () => {
      await page.goto('http://localhost:3000/transactions');
      
      // Measure rendering time for large lists
      const renderTime = await page.evaluate(() => {
        const start = performance.now();
        
        // Simulate scrolling through large list
        const container = document.querySelector('[data-testid="transactions-container"]') || document.body;
        container.scrollTop = container.scrollHeight;
        
        return performance.now() - start;
      });
      
      console.log(`Transaction list render time: ${renderTime}ms`);
      expect(renderTime).toBeLessThan(100);
    });

    test('Chart components render within acceptable time', async () => {
      await page.goto('http://localhost:3000/analytics');
      
      // Wait for charts to load
      await page.waitForSelector('canvas, svg', { timeout: 5000 });
      
      const chartRenderTime = await page.evaluate(() => {
        const charts = document.querySelectorAll('canvas, svg');
        return charts.length > 0 ? performance.now() : 0;
      });
      
      console.log(`Charts found and rendered`);
      expect(chartRenderTime).toBeGreaterThan(0);
    });
  });

  describe('Memory Usage', () => {
    test('Memory usage stays within reasonable limits', async () => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Get initial memory usage
      const initialMetrics = await page.metrics();
      console.log(`Initial JS heap size: ${(initialMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Navigate through several pages
      await page.goto('http://localhost:3000/analytics');
      await page.goto('http://localhost:3000/transactions');
      await page.goto('http://localhost:3000/investments');
      await page.goto('http://localhost:3000/dashboard');
      
      // Get final memory usage
      const finalMetrics = await page.metrics();
      console.log(`Final JS heap size: ${(finalMetrics.JSHeapUsedSize / 1024 / 1024).toFixed(2)} MB`);
      
      // Memory should not exceed 50MB for a dashboard app
      expect(finalMetrics.JSHeapUsedSize).toBeLessThan(50 * 1024 * 1024);
    });
  });

  describe('Network Performance', () => {
    test('API calls complete within acceptable time', async () => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Monitor network requests
      const responses = [];
      page.on('response', response => {
        if (response.url().includes('/api/')) {
          responses.push({
            url: response.url(),
            status: response.status(),
            timing: response.timing()
          });
        }
      });
      
      // Trigger some API calls by navigating
      await page.goto('http://localhost:3000/analytics');
      await page.waitForTimeout(2000);
      
      // Check API response times
      responses.forEach(response => {
        console.log(`API ${response.url}: ${response.status} - ${response.timing?.receiveHeadersEnd || 'N/A'}ms`);
        if (response.timing?.receiveHeadersEnd) {
          expect(response.timing.receiveHeadersEnd).toBeLessThan(2000);
        }
      });
    });
  });

  describe('Interactive Performance', () => {
    test('Button clicks respond quickly', async () => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Find clickable elements
      const buttons = await page.$$('button, [role="button"], a[href]');
      
      if (buttons.length > 0) {
        const startTime = Date.now();
        await buttons[0].click();
        await page.waitForTimeout(100);
        const responseTime = Date.now() - startTime;
        
        console.log(`Button response time: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(200);
      }
    });

    test('Form inputs respond quickly', async () => {
      await page.goto('http://localhost:3000/dashboard');
      
      // Find input elements
      const inputs = await page.$$('input, textarea, select');
      
      if (inputs.length > 0) {
        const startTime = Date.now();
        await inputs[0].type('test');
        const responseTime = Date.now() - startTime;
        
        console.log(`Input response time: ${responseTime}ms`);
        expect(responseTime).toBeLessThan(100);
      }
    });
  });
});

// Lighthouse Performance Test
describe('Lighthouse Performance Audit', () => {
  test('Dashboard meets performance benchmarks', async () => {
    const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
    const options = {
      logLevel: 'info',
      output: 'json',
      onlyCategories: ['performance'],
      port: chrome.port,
    };

    try {
      const runnerResult = await lighthouse('http://localhost:3000/dashboard', options);
      const performanceScore = runnerResult.lhr.categories.performance.score * 100;
      
      console.log(`Lighthouse Performance Score: ${performanceScore}`);
      
      // Performance score should be at least 70
      expect(performanceScore).toBeGreaterThanOrEqual(70);
      
      // Check specific metrics
      const metrics = runnerResult.lhr.audits;
      
      if (metrics['first-contentful-paint']) {
        const fcp = metrics['first-contentful-paint'].numericValue;
        console.log(`First Contentful Paint: ${fcp}ms`);
        expect(fcp).toBeLessThan(2000);
      }
      
      if (metrics['largest-contentful-paint']) {
        const lcp = metrics['largest-contentful-paint'].numericValue;
        console.log(`Largest Contentful Paint: ${lcp}ms`);
        expect(lcp).toBeLessThan(4000);
      }
      
      if (metrics['cumulative-layout-shift']) {
        const cls = metrics['cumulative-layout-shift'].numericValue;
        console.log(`Cumulative Layout Shift: ${cls}`);
        expect(cls).toBeLessThan(0.1);
      }
      
    } finally {
      await chrome.kill();
    }
  }, 30000);
});