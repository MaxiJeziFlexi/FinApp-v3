import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { CircularProgress, Box } from '@mui/material';

// Loading component
const LoadingSpinner = ({ message = "Loading..." }) => (
  <Box 
    display="flex" 
    flexDirection="column" 
    alignItems="center" 
    justifyContent="center" 
    minHeight="200px"
    gap={2}
  >
    <CircularProgress size={40} />
    <span className="text-sm text-gray-600">{message}</span>
  </Box>
);

// Lazy loaded components with optimized loading
export const LazyTopNav = dynamic(() => import("../top-nav"), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading navigation..." />
});

export const LazyAIChatSection = dynamic(() => import("../AIChatSection"), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading AI assistant..." />
});

export const LazyDecisionTreeView = dynamic(() => import("../aichat/DecisionTreeView"), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading decision tree..." />
});

export const LazyFinancialReportGenerator = dynamic(() => import("../FinancialReportGenerator"), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading report generator..." />
});

export const LazyChart = dynamic(() => import("react-chartjs-2").then(mod => mod.Line), {
  ssr: false,
  loading: () => <LoadingSpinner message="Loading chart..." />
});

// Wrapper component for Suspense boundaries
export const SuspenseWrapper = ({ children, fallback }) => (
  <Suspense fallback={fallback || <LoadingSpinner />}>
    {children}
  </Suspense>
);

export default {
  LazyTopNav,
  LazyAIChatSection,
  LazyDecisionTreeView,
  LazyFinancialReportGenerator,
  LazyChart,
  SuspenseWrapper
};