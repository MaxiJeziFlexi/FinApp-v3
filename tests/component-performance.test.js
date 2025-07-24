const { render, screen, fireEvent, waitFor } = require('@testing-library/react');
const { performance } = require('perf_hooks');

// Mock React components for testing
const mockComponents = {
  Dashboard: () => {
    const [data, setData] = React.useState([]);
    
    React.useEffect(() => {
      // Simulate data loading
      setTimeout(() => {
        setData(Array.from({ length: 1000 }, (_, i) => ({ id: i, value: Math.random() })));
      }, 100);
    }, []);
    
    return (
      <div data-testid="dashboard">
        {data.map(item => (
          <div key={item.id} data-testid="dashboard-item">
            Item {item.id}: {item.value.toFixed(2)}
          </div>
        ))}
      </div>
    );
  },
  
  TransactionsList: ({ transactions = [] }) => {
    return (
      <div data-testid="transactions-list">
        {transactions.map(transaction => (
          <div key={transaction.id} data-testid="transaction-item" className="transaction-row">
            <span>{transaction.date}</span>
            <span>{transaction.description}</span>
            <span>{transaction.amount}</span>
          </div>
        ))}
      </div>
    );
  },
  
  Chart: ({ data = [] }) => {
    return (
      <div data-testid="chart" style={{ width: '100%', height: '400px' }}>
        <canvas data-testid="chart-canvas" width="800" height="400">
          {data.map((point, index) => (
            <div key={index} style={{ 
              position: 'absolute', 
              left: `${point.x}px`, 
              top: `${point.y}px` 
            }} />
          ))}
        </canvas>
      </div>
    );
  }
};

describe('Component Performance Tests', () => {
  
  describe('Rendering Performance', () => {
    test('Dashboard component renders large dataset efficiently', () => {
      const startTime = performance.now();
      
      render(React.createElement(mockComponents.Dashboard));
      
      const renderTime = performance.now() - startTime;
      console.log(`Dashboard render time: ${renderTime.toFixed(2)}ms`);
      
      // Component should render within 100ms
      expect(renderTime).toBeLessThan(100);
    });

    test('TransactionsList handles large datasets efficiently', () => {
      const largeTransactionSet = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        date: new Date().toISOString(),
        description: `Transaction ${i}`,
        amount: (Math.random() * 1000).toFixed(2)
      }));

      const startTime = performance.now();
      
      render(React.createElement(mockComponents.TransactionsList, { 
        transactions: largeTransactionSet 
      }));
      
      const renderTime = performance.now() - startTime;
      console.log(`TransactionsList render time: ${renderTime.toFixed(2)}ms`);
      
      // Should render 1000 items within 200ms
      expect(renderTime).toBeLessThan(200);
    });

    test('Chart component renders complex data efficiently', () => {
      const complexChartData = Array.from({ length: 500 }, (_, i) => ({
        x: i * 2,
        y: Math.sin(i * 0.1) * 100 + 200
      }));

      const startTime = performance.now();
      
      render(React.createElement(mockComponents.Chart, { 
        data: complexChartData 
      }));
      
      const renderTime = performance.now() - startTime;
      console.log(`Chart render time: ${renderTime.toFixed(2)}ms`);
      
      // Chart should render within 150ms
      expect(renderTime).toBeLessThan(150);
    });
  });

  describe('Re-rendering Performance', () => {
    test('Component updates efficiently on prop changes', () => {
      const { rerender } = render(React.createElement(mockComponents.TransactionsList, { 
        transactions: [] 
      }));

      const newTransactions = Array.from({ length: 100 }, (_, i) => ({
        id: i,
        date: new Date().toISOString(),
        description: `Updated Transaction ${i}`,
        amount: (Math.random() * 1000).toFixed(2)
      }));

      const startTime = performance.now();
      
      rerender(React.createElement(mockComponents.TransactionsList, { 
        transactions: newTransactions 
      }));
      
      const rerenderTime = performance.now() - startTime;
      console.log(`Component re-render time: ${rerenderTime.toFixed(2)}ms`);
      
      // Re-render should be faster than initial render
      expect(rerenderTime).toBeLessThan(50);
    });
  });

  describe('Memory Usage', () => {
    test('Components clean up properly on unmount', () => {
      const { unmount } = render(React.createElement(mockComponents.Dashboard));
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }
      
      const beforeUnmount = process.memoryUsage().heapUsed;
      unmount();
      
      // Force garbage collection again
      if (global.gc) {
        global.gc();
      }
      
      const afterUnmount = process.memoryUsage().heapUsed;
      const memoryDiff = beforeUnmount - afterUnmount;
      
      console.log(`Memory freed on unmount: ${(memoryDiff / 1024 / 1024).toFixed(2)}MB`);
      
      // Should free some memory (or at least not increase significantly)
      expect(afterUnmount).toBeLessThanOrEqual(beforeUnmount * 1.1);
    });
  });

  describe('Event Handling Performance', () => {
    test('Click events respond quickly', async () => {
      const clickHandler = jest.fn();
      
      const TestComponent = () => (
        <button data-testid="test-button" onClick={clickHandler}>
          Click me
        </button>
      );
      
      render(React.createElement(TestComponent));
      const button = screen.getByTestId('test-button');
      
      const startTime = performance.now();
      fireEvent.click(button);
      const clickTime = performance.now() - startTime;
      
      console.log(`Click event handling time: ${clickTime.toFixed(2)}ms`);
      
      // Click should be handled within 10ms
      expect(clickTime).toBeLessThan(10);
      expect(clickHandler).toHaveBeenCalled();
    });

    test('Input events respond quickly', async () => {
      const changeHandler = jest.fn();
      
      const TestComponent = () => (
        <input 
          data-testid="test-input" 
          onChange={changeHandler}
          placeholder="Type here"
        />
      );
      
      render(React.createElement(TestComponent));
      const input = screen.getByTestId('test-input');
      
      const startTime = performance.now();
      fireEvent.change(input, { target: { value: 'test input' } });
      const inputTime = performance.now() - startTime;
      
      console.log(`Input event handling time: ${inputTime.toFixed(2)}ms`);
      
      // Input should be handled within 5ms
      expect(inputTime).toBeLessThan(5);
      expect(changeHandler).toHaveBeenCalled();
    });
  });

  describe('Scroll Performance', () => {
    test('Scroll events in large lists perform well', () => {
      const largeList = Array.from({ length: 10000 }, (_, i) => i);
      
      const ScrollableList = () => (
        <div 
          data-testid="scrollable-list" 
          style={{ height: '400px', overflow: 'auto' }}
        >
          {largeList.map(item => (
            <div key={item} style={{ height: '30px', padding: '5px' }}>
              Item {item}
            </div>
          ))}
        </div>
      );
      
      render(React.createElement(ScrollableList));
      const scrollContainer = screen.getByTestId('scrollable-list');
      
      const startTime = performance.now();
      
      // Simulate multiple scroll events
      for (let i = 0; i < 10; i++) {
        fireEvent.scroll(scrollContainer, { target: { scrollTop: i * 100 } });
      }
      
      const scrollTime = performance.now() - startTime;
      console.log(`Scroll events handling time: ${scrollTime.toFixed(2)}ms`);
      
      // Multiple scroll events should be handled within 50ms
      expect(scrollTime).toBeLessThan(50);
    });
  });
});

// Performance monitoring utilities
const PerformanceMonitor = {
  measureRenderTime: (component, props = {}) => {
    const startTime = performance.now();
    const result = render(React.createElement(component, props));
    const renderTime = performance.now() - startTime;
    
    return {
      renderTime,
      result
    };
  },

  measureMemoryUsage: () => {
    if (global.gc) {
      global.gc();
    }
    return process.memoryUsage();
  },

  createPerformanceReport: (testName, metrics) => {
    console.log(`\n=== Performance Report: ${testName} ===`);
    console.log(`Render Time: ${metrics.renderTime?.toFixed(2) || 'N/A'}ms`);
    console.log(`Memory Used: ${metrics.memoryUsed ? (metrics.memoryUsed / 1024 / 1024).toFixed(2) + 'MB' : 'N/A'}`);
    console.log(`Success: ${metrics.success ? 'Yes' : 'No'}`);
    if (metrics.errors) {
      console.log(`Errors: ${metrics.errors.length}`);
    }
    console.log('================================\n');
  }
};

module.exports = {
  PerformanceMonitor,
  mockComponents
};