// ✅ ModernFinancialReportGenerator.js - Ulepszona wersja z wykresem i nowoczesnym UI

import React, { useState } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend);

const COLORS = {
  modern: {
    primary: '#6366F1',
    secondary: '#8B5CF6',
    accent: '#06B6D4',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    dark: '#1F2937',
    light: '#F9FAFB',
    border: '#E5E7EB',
    text: '#374151',
    textLight: '#6B7280',
    white: '#FFFFFF'
  },
};

const ModernFinancialReportGenerator = ({ financialData = [], clientName = 'Client' }) => {
  const [openDialog, setOpenDialog] = useState(false);

  const selectedColors = COLORS.modern;

  const chartData = {
    labels: financialData.map((_, idx) => `Month ${idx + 1}`),
    datasets: [
      {
        label: 'Savings Over Time',
        data: financialData.map(d => d.amount),
        fill: false,
        borderColor: selectedColors.primary,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  };

  return (
    <div style={{ fontFamily: 'system-ui', padding: '20px' }}>
      <button
        onClick={() => setOpenDialog(true)}
        style={{
          background: `linear-gradient(135deg, ${selectedColors.primary}, ${selectedColors.secondary})`,
          color: '#fff',
          border: 'none',
          borderRadius: '10px',
          padding: '12px 24px',
          fontSize: '16px',
          fontWeight: '600',
          cursor: 'pointer',
        }}
      >
        📊 Generate Financial Report
      </button>

      {openDialog && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '16px',
              padding: '32px',
              width: '90%',
              maxWidth: '800px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setOpenDialog(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#eee',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              ✕
            </button>

            <h2 style={{ color: selectedColors.text }}>Report for {clientName}</h2>
            <p style={{ color: selectedColors.textLight }}>Savings Growth Overview</p>

            <div style={{ marginTop: '24px' }}>
              <Line data={chartData} options={chartOptions} />
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={() => alert('📄 PDF export coming soon...')}
                style={{
                  background: selectedColors.success,
                  color: 'white',
                  border: 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                Export to PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModernFinancialReportGenerator;
