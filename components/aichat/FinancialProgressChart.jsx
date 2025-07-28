import React from 'react';
import { Line } from 'react-chartjs-2';
import { Box } from '@mui/material';

const FinancialProgressChart = ({ financialData, goalAmount, COLORS }) => {
  const chartData = {
    labels: financialData.map(entry => entry.date),
    datasets: [
      { label: 'Oszczędności', data: financialData.map(entry => entry.amount), borderColor: COLORS.secondary, backgroundColor: 'rgba(0, 168, 150, 0.1)', fill: true, tension: 0.4 },
      { label: 'Cel', data: Array(financialData.length).fill(goalAmount), borderColor: COLORS.primary, borderDash: [5, 5], backgroundColor: 'rgba(0, 0, 0, 0)', fill: false }
    ]
  };
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { callbacks: { label: context => `${context.dataset.label}: ${context.raw.toLocaleString()} zł` } }
    },
    scales: {
      y: { beginAtZero: true, title: { display: true, text: 'Kwota (zł)' }, ticks: { callback: value => value.toLocaleString() + ' zł' } },
      x: { title: { display: true, text: 'Miesiąc' } }
    }
  };
  return <Box height={300} width="100%" mb={3}><Line data={chartData} options={chartOptions} /></Box>;
};

export default FinancialProgressChart;