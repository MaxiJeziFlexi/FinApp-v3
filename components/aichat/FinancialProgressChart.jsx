import React from 'react';
import { Line } from 'react-chartjs-2';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  PointElement, 
  LineElement, 
  Title, 
  Tooltip, 
  Legend, 
  Filler 
} from 'chart.js';
import { Box, Typography } from '@mui/material';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const FinancialProgressChart = ({ financialData, goalAmount }) => {
  if (!financialData || financialData.length === 0) {
    return (
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        backgroundColor: '#f8f9fa',
        borderRadius: '8px'
      }}>
        <Typography variant="body2" color="text.secondary">
          Brak danych do wyświetlenia wykresu
        </Typography>
      </Box>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: financialData.map(item => {
      const date = new Date(item.date);
      return date.toLocaleDateString('pl-PL', { 
        year: 'numeric', 
        month: 'short' 
      });
    }),
    datasets: [
      {
        label: 'Oszczędności',
        data: financialData.map(item => item.amount),
        borderColor: '#00A896',
        backgroundColor: 'rgba(0, 168, 150, 0.1)',
        borderWidth: 3,
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#00A896',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
      },
      {
        label: 'Cel finansowy',
        data: financialData.map(() => goalAmount),
        borderColor: '#0F3057',
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
        pointHoverRadius: 0,
      }
    ]
  };

  // Chart configuration
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            family: 'Roboto, sans-serif'
          }
        }
      },
      title: {
        display: true,
        text: 'Twój postęp finansowy',
        font: {
          size: 16,
          weight: 'bold',
          family: 'Roboto, sans-serif'
        },
        color: '#0F3057',
        padding: {
          bottom: 20
        }
      },
      tooltip: {
        backgroundColor: 'rgba(15, 48, 87, 0.9)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#00A896',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: true,
        callbacks: {
          label: function(context) {
            const value = context.parsed.y;
            const formattedValue = new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
            return `${context.dataset.label}: ${formattedValue}`;
          }
        }
      }
    },
    scales: {
      x: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#666666',
          font: {
            size: 11,
            family: 'Roboto, sans-serif'
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
          drawBorder: false
        },
        ticks: {
          color: '#666666',
          font: {
            size: 11,
            family: 'Roboto, sans-serif'
          },
          callback: function(value) {
            return new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(value);
          }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    elements: {
      point: {
        hoverBackgroundColor: '#ffffff',
        hoverBorderWidth: 3
      }
    }
  };

  // Calculate progress percentage
  const currentAmount = financialData[financialData.length - 1]?.amount || 0;
  const progressPercentage = Math.min(100, (currentAmount / goalAmount) * 100);

  return (
    <Box sx={{ 
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      p: 3,
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      {/* Chart container */}
      <Box sx={{ height: 300, mb: 3 }}>
        <Line data={chartData} options={chartOptions} />
      </Box>
      
      {/* Progress summary */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        p: 2,
        backgroundColor: 'rgba(0, 168, 150, 0.05)',
        borderRadius: '8px'
      }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Obecne oszczędności
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="#00A896">
            {new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(currentAmount)}
          </Typography>
        </Box>
        
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Postęp
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="#0F3057">
            {progressPercentage.toFixed(1)}%
          </Typography>
        </Box>
        
        <Box textAlign="right">
          <Typography variant="body2" color="text.secondary">
            Cel finansowy
          </Typography>
          <Typography variant="h6" fontWeight="bold" color="#0F3057">
            {new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
              minimumFractionDigits: 0,
              maximumFractionDigits: 0
            }).format(goalAmount)}
          </Typography>
        </Box>
      </Box>
      
      {/* Progress indicators */}
      {progressPercentage >= 75 && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(76, 175, 80, 0.3)'
        }}>
          <Typography variant="body2" sx={{ color: '#4CAF50', fontWeight: 'medium' }}>
            🎉 Świetna robota! Jesteś bardzo blisko osiągnięcia swojego celu finansowego!
          </Typography>
        </Box>
      )}
      
      {progressPercentage >= 50 && progressPercentage < 75 && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          backgroundColor: 'rgba(255, 193, 7, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(255, 193, 7, 0.3)'
        }}>
          <Typography variant="body2" sx={{ color: '#FF9800', fontWeight: 'medium' }}>
            💪 Dobra robota! Jesteś w połowie drogi do swojego celu.
          </Typography>
        </Box>
      )}
      
      {progressPercentage < 50 && (
        <Box sx={{ 
          mt: 2, 
          p: 2, 
          backgroundColor: 'rgba(33, 150, 243, 0.1)',
          borderRadius: '8px',
          border: '1px solid rgba(33, 150, 243, 0.3)'
        }}>
          <Typography variant="body2" sx={{ color: '#2196F3', fontWeight: 'medium' }}>
            🚀 Świetny start! Każda złotówka odłożona przybliża Cię do celu.
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default FinancialProgressChart;