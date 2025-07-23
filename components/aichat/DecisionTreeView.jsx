import React from 'react';
import { Paper, Box, Typography, IconButton, LinearProgress, Stepper, Step, StepLabel, StepContent, Button, Divider } from '@mui/material';
import { ArrowBack, Settings, Help } from '@mui/icons-material';
import FinancialProgressChart from './FinancialProgressChart';

const DecisionTreeView = ({ currentAdvisor, changeAdvisor, toggleAdvancedMode, advancedMode, progressValue, decisionPath, finalRecommendation, decisionOptions, loading, handleDecisionSelect, toggleChat, COLORS }) => (
  <Paper elevation={3} sx={{ p: 4, maxWidth: 800, margin: '0 auto', backgroundColor: COLORS.lightBackground, borderRadius: '16px', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
      <Box display="flex" alignItems="center">
        <Box sx={{ width: 50, height: 50, borderRadius: '50%', backgroundColor: COLORS.primary, color: 'white', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.5rem', mr: 2 }}>
          {currentAdvisor.icon}
        </Box>
        <Box>
          <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            {currentAdvisor.name}
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.lightText }}>
            Cel: {currentAdvisor.goal}
          </Typography>
        </Box>
      </Box>
      <Box>
        <IconButton onClick={changeAdvisor} sx={{ color: COLORS.primary }}>
          <ArrowBack />
        </IconButton>
        <IconButton onClick={toggleAdvancedMode} sx={{ color: COLORS.primary }}>
          <Settings />
        </IconButton>
      </Box>
    </Box>

    <Box mb={4}>
      <LinearProgress variant="determinate" value={progressValue} sx={{ height: 10, borderRadius: 5, backgroundColor: '#e0e0e0', '& .MuiLinearProgress-bar': { backgroundColor: COLORS.secondary } }} />
      <Box display="flex" justifyContent="space-between" mt={1}>
        <Typography variant="body2" color={COLORS.lightText}>Początek</Typography>
        <Typography variant="body2" fontWeight="bold" color={COLORS.secondary}>{`${Math.round(progressValue)}%`}</Typography>
        <Typography variant="body2" color={COLORS.lightText}>Cel</Typography>
      </Box>
    </Box>

    {decisionPath.length > 0 && !finalRecommendation && (
      <Box mb={4}>
        <Typography variant="subtitle1" sx={{ color: COLORS.primary, mb: 2, fontWeight: 'medium' }}>
          Twoja ścieżka decyzji:
        </Typography>
        <Stepper activeStep={decisionPath.length} orientation="vertical" sx={{ mb: 3 }}>
          {decisionPath.map((decision, index) => (
            <Step key={index} completed={index < decisionPath.length}>
              <StepLabel>
                <Typography variant="body2" sx={{ fontWeight: index === decisionPath.length - 1 ? 'bold' : 'normal' }}>
                  {decision.label}
                </Typography>
              </StepLabel>
              <StepContent>
                <Typography variant="body2" sx={{ color: COLORS.lightText }}>
                  {decision.description}
                </Typography>
              </StepContent>
            </Step>
          ))}
          {decisionOptions.length > 0 && (
            <Step active>
              <StepLabel>
                <Typography variant="body2" sx={{ fontWeight: 'medium', color: COLORS.primary }}>
                  Obecny krok
                </Typography>
              </StepLabel>
            </Step>
          )}
        </Stepper>
      </Box>
    )}

    {finalRecommendation ? (
      <Box></Box> /* Placeholder for final recommendation, kept simple */
    ) : (
      <Box>
        {loading ? (
          <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center" p={4}>
            <CircularProgress sx={{ color: COLORS.secondary, mb: 2 }} />
            <Typography variant="body2" color={COLORS.lightText}>Analizuję najlepsze opcje dla Twojego celu...</Typography>
          </Box>
        ) : (
          <Box>
            <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', backgroundColor: 'rgba(15, 48, 87, 0.03)', borderLeft: `4px solid ${COLORS.primary}` }}>
              <Typography variant="body1" paragraph fontWeight="medium">
                {decisionOptions.length > 0 ? decisionOptions[0].question : 'Ładowanie opcji...'}
              </Typography>
            </Paper>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {decisionOptions.map((option, index) => (
                <Button
                  key={index}
                  fullWidth
                  variant="outlined"
                  onClick={() => handleDecisionSelect(index)}
                  sx={{ p: 2, justifyContent: 'flex-start', textAlign: 'left', borderColor: '#e0e0e0', color: COLORS.text, borderRadius: '8px', transition: 'all 0.2s ease', position: 'relative', '&:hover': { transform: 'translateX(5px)', borderColor: COLORS.secondary, backgroundColor: 'rgba(0, 168, 150, 0.05)' } }}
                >
                  {option.text}
                </Button>
              ))}
            </Box>
            {advancedMode && (
              <Box mt={4}>
                <Divider sx={{ mb: 2 }} />
                <Button variant="text" startIcon={<Help />} onClick={toggleChat} sx={{ color: COLORS.primary }}>
                  Potrzebuję dodatkowych informacji
                </Button>
              </Box>
            )}
          </Box>
        )}
      </Box>
    )}
  </Paper>
);

export default DecisionTreeView;