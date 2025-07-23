/**
 * Chart Configuration Service - utils/chartConfigs.js
 * 
 * This module provides standardized and accessible chart configurations:
 * - WCAG 2.1 AA compliant color schemes
 * - Screen reader compatible configurations
 * - Responsive sizing with consistent styles
 * - Color-blind friendly palettes
 * - High contrast options
 * - Financial chart templates for common data visualizations
 * - Localized number and date formatting
 */

import { getLocalizedText, formatNumber, formatDateString, formatCurrency } from './localization';

// Accessible color palettes with sufficient contrast ratios (4.5:1 for AA compliance)
export const COLOR_PALETTES = {
  // Main palette (WCAG AA compliant, color-blind friendly)
  main: {
    primary: '#0F3057',      // Deep blue
    secondary: '#00A896',    // Teal
    success: '#008450',      // Green
    warning: '#EF6C00',      // Orange
    danger: '#D32F2F',       // Red
    info: '#0277BD',         // Blue
    neutral: '#757575',      // Gray
    background: '#FFFFFF',
    text: '#212121'
  },
  
  // High contrast palette for accessibility
  highContrast: {
    primary: '#000000',
    secondary: '#0000AA',
    success: '#006000',
    warning: '#AA6600',
    danger: '#AA0000',
    info: '#0000AA',
    neutral: '#444444',
    background: '#FFFFFF',
    text: '#000000'
  },
  
  // Color-blind friendly categorical palette (distinguishable for protanopia, deuteranopia, tritanopia)
  colorBlind: [
    '#006BA4', // Blue
    '#FF800E', // Orange
    '#ABABAB', // Gray
    '#595959', // Dark Gray
    '#5F9ED1', // Light Blue
    '#C85200', // Dark Orange
    '#898989', // Medium Gray
    '#A2C8EC', // Very Light Blue
    '#FFBC79', // Light Orange
    '#CFCFCF'  // Light Gray
  ],
  
  // Sequential scales for heatmaps and gradients (colorblind-friendly)
  sequential: [
    ['#FFFFFF', '#D1E5F0', '#92C5DE', '#4393C3', '#2166AC', '#053061'], // Blue scale
    ['#FFFFFF', '#FDDBC7', '#F4A582', '#D6604D', '#B2182B', '#67001F'], // Red scale
    ['#FFFFFF', '#D9F0D3', '#A6DBA0', '#5AAE61', '#1B7837', '#00441B']  // Green scale
  ]
};

// Font settings for accessibility
export const FONT_SETTINGS = {
  family: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  size: {
    xs: '10px',
    sm: '12px',
    md: '14px',
    lg: '16px',
    xl: '18px'
  },
  weight: {
    normal: 400,
    medium: 500,
    bold: 700
  }
};

// Line thickness settings for visibility
export const LINE_SETTINGS = {
  thin: 1,
  normal: 2,
  thick: 3,
  extraThick: 4
};

/**
 * Creates a financial line chart configuration with accessibility features
 * 
 * @param {Object} data - Chart data
 * @param {Object} options - Chart customization options
 * @returns {Object} - Chart.js configuration object
 */
export const createFinancialLineChart = (data, options = {}) => {
  const {
    title = '',
    subtitle = '',
    xAxisTitle = '',
    yAxisTitle = '',
    currency = 'PLN',
    colorPalette = COLOR_PALETTES.main,
    showLegend = true,
    showTooltips = true,
    showGridLines = true,
    lineStyle = 'solid',
    lineThickness = LINE_SETTINGS.normal,
    showDataPoints = true,
    showArea = false,
    enableAnimation = true,
    responsive = true,
    maintainAspectRatio = false,
    height = 300,
    enableAccessibility = true,
    highContrast = false,
    colorblindFriendly = true,
    locale = null
  } = options;
  
  // Use specified color palette or fall back to high contrast if requested
  const palette = highContrast ? COLOR_PALETTES.highContrast : colorPalette;
  
  // Use colorblind-friendly palette for datasets if requested
  const datasetColors = colorblindFriendly ? COLOR_PALETTES.colorBlind : null;
  
  return {
    type: 'line',
    data: {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, index) => ({
        label: dataset.label || `Dataset ${index + 1}`,
        data: dataset.data || [],
        borderColor: dataset.color || datasetColors?.[index % datasetColors.length] || palette.primary,
        backgroundColor: showArea 
          ? (dataset.backgroundColor || `${datasetColors?.[index % datasetColors.length] || palette.primary}33`) 
          : 'transparent',
        borderWidth: dataset.borderWidth || lineThickness,
        borderDash: lineStyle === 'dashed' ? [6, 6] : lineStyle === 'dotted' ? [2, 2] : [],
        pointRadius: showDataPoints ? 4 : 0,
        pointHoverRadius: 6,
        fill: showArea,
        tension: 0.4,
        pointBackgroundColor: palette.background,
        pointBorderColor: dataset.color || datasetColors?.[index % datasetColors.length] || palette.primary,
        pointBorderWidth: 2
      }))
    },
    options: {
      responsive,
      maintainAspectRatio,
      aspectRatio: maintainAspectRatio ? 2 : undefined,
      layout: {
        padding: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 15,
            fontSize: FONT_SETTINGS.size.md,
            fontStyle: FONT_SETTINGS.weight.medium,
            fontFamily: FONT_SETTINGS.family,
            color: palette.text,
            padding: 15,
            usePointStyle: true,
            generateLabels: (chart) => {
              const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              
              // Add ARIA attributes for screen readers
              if (enableAccessibility) {
                originalLabels.forEach(label => {
                  label.accessibleLabelText = `${label.text}: ${label.datasetIndex !== undefined ? 
                    describeDatasetTrend(data.datasets[label.datasetIndex].data) : ''}`;
                });
              }
              
              return originalLabels;
            }
          },
          onClick: enableAccessibility ? function(e, legendItem, legend) {
            // Announce toggle action for screen readers
            const dataset = this.chart.data.datasets[legendItem.datasetIndex];
            const isHidden = !dataset.hidden;
            const action = isHidden ? 'hidden' : 'shown';
            
            // Announce change for screen readers
            announceToScreenReader(`Dataset ${dataset.label} is now ${action}`);
            
            // Call original function
            Chart.defaults.plugins.legend.onClick.call(this, e, legendItem, legend);
          } : Chart.defaults.plugins.legend.onClick
        },
        title: {
          display: !!title,
          text: title,
          font: {
            size: parseInt(FONT_SETTINGS.size.xl),
            weight: FONT_SETTINGS.weight.bold,
            family: FONT_SETTINGS.family
          },
          color: palette.text,
          padding: {
            top: 10,
            bottom: 5
          }
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle,
          font: {
            size: parseInt(FONT_SETTINGS.size.md),
            weight: FONT_SETTINGS.weight.normal,
            family: FONT_SETTINGS.family
          },
          color: palette.neutral,
          padding: {
            bottom: 15
          }
        },
        tooltip: {
          enabled: showTooltips,
          backgroundColor: palette.background,
          titleColor: palette.text,
          titleFont: {
            size: parseInt(FONT_SETTINGS.size.md),
            weight: FONT_SETTINGS.weight.bold,
            family: FONT_SETTINGS.family
          },
          bodyColor: palette.text,
          bodyFont: {
            size: parseInt(FONT_SETTINGS.size.md),
            family: FONT_SETTINGS.family
          },
          borderColor: palette.neutral,
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          usePointStyle: true,
          callbacks: {
            label: (context) => {
              // Format values using localization
              const value = context.raw;
              const formattedValue = currency ? 
                formatCurrency(value, currency, { locale }) : 
                formatNumber(value, { locale });
                
              return `${context.dataset.label}: ${formattedValue}`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: !!xAxisTitle,
            text: xAxisTitle,
            font: {
              size: parseInt(FONT_SETTINGS.size.md),
              weight: FONT_SETTINGS.weight.medium,
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            padding: {
              top: 10
            }
          },
          grid: {
            display: showGridLines,
            color: `${palette.neutral}33`, // 20% opacity
            borderColor: palette.neutral,
            tickColor: palette.neutral
          },
          ticks: {
            font: {
              size: parseInt(FONT_SETTINGS.size.sm),
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          title: {
            display: !!yAxisTitle,
            text: yAxisTitle,
            font: {
              size: parseInt(FONT_SETTINGS.size.md),
              weight: FONT_SETTINGS.weight.medium,
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            padding: {
              bottom: 10
            }
          },
          grid: {
            display: showGridLines,
            color: `${palette.neutral}33`, // 20% opacity
            borderColor: palette.neutral,
            tickColor: palette.neutral
          },
          ticks: {
            font: {
              size: parseInt(FONT_SETTINGS.size.sm),
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            callback: (value) => {
              // Format y-axis values using localization
              return currency ?
                formatCurrency(value, currency, { decimals: 0, locale }) :
                formatNumber(value, { decimals: 0, locale });
            }
          },
          beginAtZero: true
        }
      },
      animation: enableAnimation ? {
        duration: 1000,
        easing: 'easeOutQuart'
      } : false,
      // Accessibility configuration
      ...(enableAccessibility && {
        accessibility: {
          enabled: true,
          description: title,
          summary: subtitle || '',
          announceDataChanges: true
        }
      }),
      // Set element hover styles for better UX
      elements: {
        point: {
          hoverBackgroundColor: palette.background,
          hoverBorderColor: palette.primary,
          hoverBorderWidth: 3
        },
        line: {
          hoverBorderWidth: lineThickness + 1
        }
      },
      interaction: {
        mode: 'index',
        intersect: false
      },
      hover: {
        mode: 'nearest',
        intersect: true
      }
    },
    // Add custom height specification for non-responsive charts
    ...((!responsive && height) && { height })
  };
};

/**
 * Creates a financial bar chart configuration with accessibility features
 * 
 * @param {Object} data - Chart data
 * @param {Object} options - Chart customization options
 * @returns {Object} - Chart.js configuration object
 */
export const createFinancialBarChart = (data, options = {}) => {
  const {
    title = '',
    subtitle = '',
    xAxisTitle = '',
    yAxisTitle = '',
    currency = 'PLN',
    barThickness = 'flex',
    colorPalette = COLOR_PALETTES.main,
    showLegend = true,
    showTooltips = true,
    showGridLines = true,
    enableAnimation = true,
    responsive = true,
    maintainAspectRatio = false,
    height = 300,
    stacked = false,
    horizontal = false,
    enableAccessibility = true,
    highContrast = false,
    colorblindFriendly = true,
    locale = null
  } = options;
  
  // Use specified color palette or fall back to high contrast if requested
  const palette = highContrast ? COLOR_PALETTES.highContrast : colorPalette;
  
  // Use colorblind-friendly palette for datasets if requested
  const datasetColors = colorblindFriendly ? COLOR_PALETTES.colorBlind : null;
  
  return {
    type: horizontal ? 'horizontalBar' : 'bar',
    data: {
      labels: data.labels || [],
      datasets: (data.datasets || []).map((dataset, index) => ({
        label: dataset.label || `Dataset ${index + 1}`,
        data: dataset.data || [],
        backgroundColor: dataset.backgroundColor || datasetColors?.[index % datasetColors.length] || palette.primary,
        borderColor: dataset.borderColor || palette.background,
        borderWidth: 1,
        hoverBackgroundColor: dataset.hoverBackgroundColor || lightenColor(dataset.backgroundColor || datasetColors?.[index % datasetColors.length] || palette.primary, 15),
        hoverBorderColor: dataset.hoverBorderColor || palette.background,
        hoverBorderWidth: 1,
        barThickness: barThickness === 'flex' ? undefined : barThickness,
        maxBarThickness: barThickness === 'flex' ? 50 : undefined
      }))
    },
    options: {
      responsive,
      maintainAspectRatio,
      aspectRatio: maintainAspectRatio ? 2 : undefined,
      layout: {
        padding: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 10
        }
      },
      plugins: {
        legend: {
          display: showLegend,
          position: 'top',
          align: 'center',
          labels: {
            boxWidth: 15,
            fontSize: FONT_SETTINGS.size.md,
            fontStyle: FONT_SETTINGS.weight.medium,
            fontFamily: FONT_SETTINGS.family,
            color: palette.text,
            padding: 15,
            usePointStyle: true
          }
        },
        title: {
          display: !!title,
          text: title,
          font: {
            size: parseInt(FONT_SETTINGS.size.xl),
            weight: FONT_SETTINGS.weight.bold,
            family: FONT_SETTINGS.family
          },
          color: palette.text,
          padding: {
            top: 10,
            bottom: 5
          }
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle,
          font: {
            size: parseInt(FONT_SETTINGS.size.md),
            weight: FONT_SETTINGS.weight.normal,
            family: FONT_SETTINGS.family
          },
          color: palette.neutral,
          padding: {
            bottom: 15
          }
        },
        tooltip: {
          enabled: showTooltips,
          backgroundColor: palette.background,
          titleColor: palette.text,
          titleFont: {
            size: parseInt(FONT_SETTINGS.size.md),
            weight: FONT_SETTINGS.weight.bold,
            family: FONT_SETTINGS.family
          },
          bodyColor: palette.text,
          bodyFont: {
            size: parseInt(FONT_SETTINGS.size.md),
            family: FONT_SETTINGS.family
          },
          borderColor: palette.neutral,
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          callbacks: {
            label: (context) => {
              // Format values using localization
              const value = context.raw;
              const formattedValue = currency ? 
                formatCurrency(value, currency, { locale }) : 
                formatNumber(value, { locale });
                
              return `${context.dataset.label}: ${formattedValue}`;
            }
          }
        }
      },
      scales: {
        x: {
          stacked,
          title: {
            display: !!xAxisTitle,
            text: xAxisTitle,
            font: {
              size: parseInt(FONT_SETTINGS.size.md),
              weight: FONT_SETTINGS.weight.medium,
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            padding: {
              top: 10
            }
          },
          grid: {
            display: showGridLines && !horizontal,
            color: `${palette.neutral}33`, // 20% opacity
            borderColor: palette.neutral,
            tickColor: palette.neutral
          },
          ticks: {
            font: {
              size: parseInt(FONT_SETTINGS.size.sm),
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          stacked,
          title: {
            display: !!yAxisTitle,
            text: yAxisTitle,
            font: {
              size: parseInt(FONT_SETTINGS.size.md),
              weight: FONT_SETTINGS.weight.medium,
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            padding: {
              bottom: 10
            }
          },
          grid: {
            display: showGridLines && horizontal,
            color: `${palette.neutral}33`, // 20% opacity
            borderColor: palette.neutral,
            tickColor: palette.neutral
          },
          ticks: {
            font: {
              size: parseInt(FONT_SETTINGS.size.sm),
              family: FONT_SETTINGS.family
            },
            color: palette.text,
            callback: (value) => {
              // Format y-axis values using localization
              return currency ?
                formatCurrency(value, currency, { decimals: 0, locale }) :
                formatNumber(value, { decimals: 0, locale });
            }
          },
          beginAtZero: true
        }
      },
      animation: enableAnimation ? {
        duration: 1000,
        easing: 'easeOutQuart'
      } : false,
      // Accessibility configuration
      ...(enableAccessibility && {
        accessibility: {
          enabled: true,
          description: title,
          summary: subtitle || '',
          announceDataChanges: true
        }
      })
    },
    // Add custom height specification for non-responsive charts
    ...((!responsive && height) && { height })
  };
};

/**
 * Creates a financial pie/doughnut chart configuration with accessibility features
 * 
 * @param {Object} data - Chart data
 * @param {Object} options - Chart customization options
 * @returns {Object} - Chart.js configuration object
 */
export const createFinancialPieChart = (data, options = {}) => {
  const {
    title = '',
    subtitle = '',
    currency = 'PLN',
    colorPalette = COLOR_PALETTES.main,
    showLegend = true,
    showTooltips = true,
    enableAnimation = true,
    responsive = true,
    maintainAspectRatio = false,
    height = 300,
    isDoughnut = false,
    cutout = isDoughnut ? '60%' : '0',
    showPercentages = true,
    enableAccessibility = true,
    highContrast = false,
    colorblindFriendly = true,
    locale = null
  } = options;
  
  // Use specified color palette or fall back to high contrast if requested
  const palette = highContrast ? COLOR_PALETTES.highContrast : colorPalette;
  
  // Use colorblind-friendly palette for datasets if requested
  const backgroundColors = colorblindFriendly ? COLOR_PALETTES.colorBlind : null;
  
  return {
    type: isDoughnut ? 'doughnut' : 'pie',
    data: {
      labels: data.labels || [],
      datasets: [{
        data: data.values || [],
        backgroundColor: data.backgroundColors || backgroundColors || Object.values(palette).slice(0, 7),
        borderColor: palette.background,
        borderWidth: 2,
        hoverBackgroundColor: data.hoverBackgroundColors || (data.backgroundColors || backgroundColors || Object.values(palette).slice(0, 7)).map(color => lightenColor(color, 15)),
        hoverBorderColor: palette.text,
        hoverBorderWidth: 2
      }]
    },
    options: {
      responsive,
      maintainAspectRatio,
      aspectRatio: maintainAspectRatio ? 1 : undefined, // 1:1 for pie charts
      layout: {
        padding: {
          top: 10,
          right: 20,
          bottom: 10,
          left: 10
        }
      },
      cutout,
      plugins: {
        legend: {
          display: showLegend,
          position: 'right',
          align: 'center',
          labels: {
            boxWidth: 15,
            fontSize: FONT_SETTINGS.size.md,
            fontStyle: FONT_SETTINGS.weight.medium,
            fontFamily: FONT_SETTINGS.family,
            color: palette.text,
            padding: 15,
            usePointStyle: true,
            generateLabels: (chart) => {
              const originalLabels = Chart.defaults.plugins.legend.labels.generateLabels(chart);
              
              if (showPercentages) {
                // Add percentages to labels
                const total = chart.data.datasets[0].data.reduce((sum, value) => sum + value, 0);
                
                originalLabels.forEach((label, i) => {
                  const value = chart.data.datasets[0].data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                  label.text = `${chart.data.labels[i]} (${percentage}%)`;
                  
                  // Add ARIA attributes for screen readers
                  if (enableAccessibility) {
                    const formattedValue = currency ? 
                      formatCurrency(value, currency, { locale }) : 
                      formatNumber(value, { locale });
                      
                    label.accessibleLabelText = `${chart.data.labels[i]}: ${formattedValue}, ${percentage}% of total`;
                  }
                });
              }
              
              return originalLabels;
            }
          }
        },
        title: {
          display: !!title,
          text: title,
          font: {
            size: parseInt(FONT_SETTINGS.size.xl),
            weight: FONT_SETTINGS.weight.bold,
            family: FONT_SETTINGS.family
          },
          color: palette.text,
          padding: {
            top: 10,
            bottom: 5
          }
        },
        subtitle: {
          display: !!subtitle,
          text: subtitle,
          font: {
            size: parseInt(FONT_SETTINGS.size.md),
            weight: FONT_SETTINGS.weight.normal,
            family: FONT_SETTINGS.family
          },
          color: palette.neutral,
          padding: {
            bottom: 15
          }
        },
        tooltip: {
          enabled: showTooltips,
          backgroundColor: palette.background,
          titleColor: palette.text,
          titleFont: {
            size: parseInt(FONT_SETTINGS.size.md),
            weight: FONT_SETTINGS.weight.bold,
            family: FONT_SETTINGS.family
          },
          bodyColor: palette.text,
          bodyFont: {
            size: parseInt(FONT_SETTINGS.size.md),
            family: FONT_SETTINGS.family
          },
          borderColor: palette.neutral,
          borderWidth: 1,
          padding: 10,
          displayColors: true,
          boxWidth: 12,
          boxHeight: 12,
          callbacks: {
            label: (context) => {
              // Format values using localization
              const value = context.raw;
              const total = context.chart.data.datasets[0].data.reduce((sum, val) => sum + val, 0);
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              const formattedValue = currency ? 
                formatCurrency(value, currency, { locale }) : 
                formatNumber(value, { locale });
                
              return `${context.label}: ${formattedValue} (${percentage}%)`;
            }
          }
        }
      },
      animation: enableAnimation ? {
        duration: 1000,
        easing: 'easeOutQuart',
        animateRotate: true,
        animateScale: true
      } : false,
      // Accessibility configuration
      ...(enableAccessibility && {
        accessibility: {
          enabled: true,
          description: title,
          summary: subtitle || '',
          announceDataChanges: true
        }
      })
    },
    // Add custom height specification for non-responsive charts
    ...((!responsive && height) && { height })
  };
};

// Helper functions

/**
 * Lightens a color by a given percentage
 * 
 * @param {string} color - Hex color code
 * @param {number} percent - Percentage to lighten
 * @returns {string} - Lightened color
 */
function lightenColor(color, percent) {
  if (!color) return '#FFFFFF';
  
  // Convert hex to RGB
  let r, g, b;
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    r = parseInt(hex.slice(0, 2), 16);
    g = parseInt(hex.slice(2, 4), 16);
    b = parseInt(hex.slice(4, 6), 16);
  } else if (color.startsWith('rgb')) {
    const rgbValues = color.match(/\d+/g);
    if (rgbValues && rgbValues.length >= 3) {
      [r, g, b] = rgbValues.map(Number);
    } else {
      return color;
    }
  } else {
    return color;
  }
  
  // Lighten
  r = Math.min(255, Math.floor(r + (255 - r) * (percent / 100)));
  g = Math.min(255, Math.floor(g + (255 - g) * (percent / 100)));
  b = Math.min(255, Math.floor(b + (255 - b) * (percent / 100)));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Describes the trend in a dataset for screen readers
 * 
 * @param {Array} data - Dataset values
 * @returns {string} - Trend description
 */
function describeDatasetTrend(data) {
  if (!data || data.length < 2) return '';
  
  const start = data[0];
  const end = data[data.length - 1];
  const min = Math.min(...data);
  const max = Math.max(...data);
  
  // Calculate overall change
  const change = end - start;
  const percentChange = start !== 0 ? (change / Math.abs(start) * 100).toFixed(1) : 0;
  
  let trendDescription = '';
  
  if (change > 0) {
    trendDescription = `increasing by ${percentChange}% from ${formatNumber(start)} to ${formatNumber(end)}`;
  } else if (change < 0) {
    trendDescription = `decreasing by ${Math.abs(percentChange)}% from ${formatNumber(start)} to ${formatNumber(end)}`;
  } else {
    trendDescription = `remaining stable at ${formatNumber(start)}`;
  }
  
  // Add additional context
  trendDescription += `, with values ranging from ${formatNumber(min)} to ${formatNumber(max)}`;
  
  return trendDescription;
}

/**
 * Announces a message to screen readers using ARIA live regions
 * 
 * @param {string} message - Message to announce
 */
function announceToScreenReader(message) {
  // Find or create an ARIA live region
  let announcer = document.getElementById('chart-announcer');
  
  if (!announcer) {
    announcer = document.createElement('div');
    announcer.id = 'chart-announcer';
    announcer.setAttribute('aria-live', 'polite');
    announcer.setAttribute('aria-atomic', 'true');
    announcer.classList.add('sr-only'); // Screen reader only
    document.body.appendChild(announcer);
  }
  
  // Set the message
  announcer.textContent = message;
  
  // Clear after a delay
  setTimeout(() => {
    announcer.textContent = '';
  }, 3000);
}

// Export the API for use in the application
export default {
  COLOR_PALETTES,
  FONT_SETTINGS,
  LINE_SETTINGS,
  createFinancialLineChart,
  createFinancialBarChart,
  createFinancialPieChart
};