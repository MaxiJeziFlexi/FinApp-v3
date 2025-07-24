#!/usr/bin/env node

const puppeteer = require('puppeteer');
const { performance } = require('perf_hooks');

class QuickPerformanceCheck {
  constructor(baseUrl = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    this.results = [];
  }

  async checkPagePerformance(path, pageName) {
    console.log(`🔍 Checking ${pageName}...`);
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    try {
      // Enable performance monitoring
      await page.setCacheEnabled(false);
      
      const startTime = performance.now();
      
      // Navigate to page
      await page.goto(`${this.baseUrl}${path}`, {
        waitUntil: 'networkidle2',
        timeout: 15000
      });
      
      const loadTime = performance.now() - startTime;
      
      // Get performance metrics
      const metrics = await page.metrics();
      
      // Check for JavaScript errors
      const errors = [];
      page.on('pageerror', error => {
        errors.push(error.message);
      });
      
      // Get page title to verify it loaded correctly
      const title = await page.title();
      
      // Check if main content is visible
      const hasContent = await page.evaluate(() => {
        const body = document.body;
        return body && body.children.length > 0;
      });
      
      const result = {
        page: pageName,
        path,
        loadTime: Math.round(loadTime),
        jsHeapSize: Math.round(metrics.JSHeapUsedSize / 1024 / 1024 * 100) / 100, // MB
        domNodes: metrics.Nodes,
        title,
        hasContent,
        errors: errors.length,
        status: loadTime < 5000 && hasContent ? 'PASS' : 'FAIL'
      };
      
      this.results.push(result);
      
      console.log(`   ⏱️  Load time: ${result.loadTime}ms`);
      console.log(`   🧠 Memory: ${result.jsHeapSize}MB`);
      console.log(`   📄 DOM nodes: ${result.domNodes}`);
      console.log(`   ✅ Status: ${result.status}`);
      
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      this.results.push({
        page: pageName,
        path,
        error: error.message,
        status: 'ERROR'
      });
    } finally {
      await browser.close();
    }
  }

  async checkServerHealth() {
    console.log('🏥 Checking server health...');
    
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      const response = await page.goto(this.baseUrl, { timeout: 10000 });
      
      if (response && response.ok()) {
        console.log('   ✅ Server is responding');
        return true;
      } else {
        console.log('   ❌ Server returned error status');
        return false;
      }
    } catch (error) {
      console.log('   ❌ Server is not responding');
      return false;
    } finally {
      await browser.close();
    }
  }

  async runQuickCheck() {
    console.log('🚀 Quick Frontend Performance Check');
    console.log('===================================');
    
    // Check if server is running
    const serverHealthy = await this.checkServerHealth();
    if (!serverHealthy) {
      console.log('\n❌ Server is not running. Please start with: npm run dev');
      return;
    }
    
    // Define pages to check
    const pagesToCheck = [
      { path: '/', name: 'Home Page' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/analytics', name: 'Analytics' },
      { path: '/transactions', name: 'Transactions' },
      { path: '/investments', name: 'Investments' },
      { path: '/login', name: 'Login' }
    ];
    
    // Check each page
    for (const page of pagesToCheck) {
      await this.checkPagePerformance(page.path, page.name);
      console.log(''); // Empty line for readability
    }
    
    // Generate summary
    this.generateSummary();
  }

  generateSummary() {
    console.log('📊 PERFORMANCE SUMMARY');
    console.log('======================');
    
    const passedPages = this.results.filter(r => r.status === 'PASS').length;
    const failedPages = this.results.filter(r => r.status === 'FAIL').length;
    const errorPages = this.results.filter(r => r.status === 'ERROR').length;
    
    console.log(`✅ Passed: ${passedPages}`);
    console.log(`❌ Failed: ${failedPages}`);
    console.log(`🚫 Errors: ${errorPages}`);
    
    if (this.results.length > 0) {
      const avgLoadTime = this.results
        .filter(r => r.loadTime)
        .reduce((sum, r) => sum + r.loadTime, 0) / this.results.filter(r => r.loadTime).length;
      
      const avgMemory = this.results
        .filter(r => r.jsHeapSize)
        .reduce((sum, r) => sum + r.jsHeapSize, 0) / this.results.filter(r => r.jsHeapSize).length;
      
      console.log(`⏱️  Average load time: ${Math.round(avgLoadTime)}ms`);
      console.log(`🧠 Average memory usage: ${Math.round(avgMemory * 100) / 100}MB`);
    }
    
    // Show failed pages
    const failedResults = this.results.filter(r => r.status !== 'PASS');
    if (failedResults.length > 0) {
      console.log('\n⚠️  ISSUES FOUND:');
      failedResults.forEach(result => {
        console.log(`   ${result.page}: ${result.error || 'Performance threshold exceeded'}`);
      });
    }
    
    // Performance recommendations
    console.log('\n💡 RECOMMENDATIONS:');
    const slowPages = this.results.filter(r => r.loadTime > 3000);
    if (slowPages.length > 0) {
      console.log('   • Optimize slow-loading pages (>3s load time)');
    }
    
    const memoryHeavyPages = this.results.filter(r => r.jsHeapSize > 10);
    if (memoryHeavyPages.length > 0) {
      console.log('   • Reduce memory usage on heavy pages (>10MB)');
    }
    
    const highDomPages = this.results.filter(r => r.domNodes > 1500);
    if (highDomPages.length > 0) {
      console.log('   • Simplify DOM structure on complex pages (>1500 nodes)');
    }
    
    if (failedResults.length === 0) {
      console.log('   🎉 All pages are performing well!');
    }
  }
}

// Run if called directly
if (require.main === module) {
  const checker = new QuickPerformanceCheck();
  checker.runQuickCheck().catch(console.error);
}

module.exports = QuickPerformanceCheck;