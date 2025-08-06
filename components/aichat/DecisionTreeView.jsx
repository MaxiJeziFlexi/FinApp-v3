import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  CircularProgress,
  IconButton,
  Divider,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Chip,
  Tooltip as MuiTooltip
} from '@mui/material';
import {
  ArrowBack,
  Settings,
  Help,
  ArrowForward,
  EmojiEvents,
  Refresh
} from '@mui/icons-material';
import jsPDF from 'jspdf';

// Helper functions
const mapGoalToName = (goal) => {
  const mapping = {
    emergency_fund: 'funduszu awaryjnego',
    debt_reduction: 'redukcji zadłużenia',
    home_purchase: 'zakupu nieruchomości',
    retirement: 'zabezpieczenia emerytalnego',
    education: 'finansowania edukacji',
    vacation: 'wakacji'
  };
  return mapping[goal] || 'celu finansowego';
};

const getDecisionLabel = (decision, idx, advisor) => {
  return decision.title || `Krok ${idx + 1}`;
};

const getDecisionDescription = (decision, idx) => {
  return decision.description || decision.value;
};

const DecisionTreeView = ({
  currentAdvisor,
  currentStep,
  decisionPath,
  decisionOptions = [],
  progressValue,
  loading,
  finalRecommendation,
  userProfile,
  advancedMode,
  handleDecisionSelect,
  handleDecisionBack = () => {},
  changeAdvisor,
  toggleAdvancedMode,
  setChatVisible,
  backToDecisionTree,
  COLORS
}) => {
  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text('Raport Finansowy', 20, 30);
    
    // Add advisor info
    doc.setFontSize(14);
    doc.text(`Doradca: ${currentAdvisor?.name}`, 20, 50);
    doc.text(`Cel: ${mapGoalToName(currentAdvisor?.goal)}`, 20, 65);
    
    // Add recommendation summary
    if (finalRecommendation?.summary) {
      doc.setFontSize(12);
      doc.text('Podsumowanie:', 20, 85);
      const splitSummary = doc.splitTextToSize(finalRecommendation.summary, 170);
      doc.text(splitSummary, 20, 100);
    }
    
    // Add steps if available
    if (finalRecommendation?.actionPlan) {
      let yPosition = 130;
      doc.text('Następne kroki:', 20, yPosition);
      yPosition += 15;
      
      finalRecommendation.actionPlan.forEach((step, index) => {
        const stepText = `${index + 1}. ${step}`;
        const splitStep = doc.splitTextToSize(stepText, 170);
        doc.text(splitStep, 20, yPosition);
        yPosition += splitStep.length * 5 + 5;
      });
    }
    
    doc.save('raport_finansowy.pdf');
  };

  // Final recommendation view
  if (finalRecommendation) {
    return (
      <Paper sx={{ p: 4, borderRadius: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Box display="flex" alignItems="center">
            <Box
              sx={{
                width: 50,
                height: 50,
                borderRadius: '50%',
                backgroundColor: COLORS.primary,
                color: 'white',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: '1.5rem',
                mr: 2
              }}
            >
              {currentAdvisor.icon}
            </Box>
            <Box>
              <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
                {currentAdvisor.name}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.lightText }}>
                Cel: {mapGoalToName(currentAdvisor.goal)}
              </Typography>
            </Box>
          </Box>
          <Box>
            <MuiTooltip title="Zmień doradcę">
              <IconButton onClick={changeAdvisor} sx={{ color: COLORS.primary }}>
                <ArrowBack />
              </IconButton>
            </MuiTooltip>
            <MuiTooltip title={advancedMode ? 'Tryb standardowy' : 'Tryb zaawansowany'}>
              <IconButton onClick={toggleAdvancedMode} sx={{ color: COLORS.primary }}>
                <Settings />
              </IconButton>
            </MuiTooltip>
          </Box>
        </Box>

        <Paper
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: '#f5f9ff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            🎉 Twój spersonalizowany plan finansowy jest gotowy!
          </Typography>
          <Typography variant="body1" paragraph sx={{ mb: 3 }}>
            {finalRecommendation.summary}
          </Typography>

          {/* Action Plan */}
          {Array.isArray(finalRecommendation.actionPlan) && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                📋 Plan działania:
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {finalRecommendation.actionPlan.map((step, index) => (
                  <Box
                    key={index}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      backgroundColor: 'rgba(0, 168, 150, 0.05)',
                      p: 2,
                      borderRadius: '8px',
                      border: '1px solid rgba(0, 168, 150, 0.2)'
                    }}
                  >
                    <Box
                      sx={{
                        minWidth: 32,
                        height: 32,
                        borderRadius: '50%',
                        backgroundColor: COLORS.secondary,
                        color: 'white',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        mr: 2,
                        fontWeight: 'bold'
                      }}
                    >
                      {index + 1}
                    </Box>
                    <Typography variant="body1">{step}</Typography>
                  </Box>
                ))}
              </Box>
            </Box>
          )}

          {/* Timeline */}
          {Array.isArray(finalRecommendation.timeline) && (
            <Box mt={3}>
              <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                ⏰ Harmonogram:
              </Typography>
              <Grid container spacing={2}>
                {finalRecommendation.timeline.map((item, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Paper
                      sx={{
                        p: 2,
                        backgroundColor: 'rgba(15, 48, 87, 0.05)',
                        borderRadius: '8px',
                        border: '1px solid rgba(15, 48, 87, 0.1)'
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                        {item.period}
                      </Typography>
                      <Typography variant="body2" sx={{ color: COLORS.text }}>
                        {item.task}
                      </Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
        </Paper>

        <Box mt={3} sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Button
            variant="contained"
            startIcon={<EmojiEvents />}
            onClick={generatePDF}
            sx={{
              backgroundColor: COLORS.success,
              '&:hover': { backgroundColor: '#388e3c' },
              borderRadius: '8px',
              px: 3
            }}
          >
            Pobierz raport PDF
          </Button>

          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={() => setChatVisible(true)}
            sx={{
              backgroundColor: COLORS.secondary,
              '&:hover': { backgroundColor: '#008f82' },
              borderRadius: '8px',
              px: 3
            }}
          >
            Porozmawiaj z doradcą
          </Button>

          {backToDecisionTree && (
            <Button
              variant="outlined"
              startIcon={<ArrowBack />}
              onClick={backToDecisionTree}
              sx={{
                borderColor: COLORS.primary,
                color: COLORS.primary,
                borderRadius: '8px',
                px: 3
              }}
            >
              Powrót do drzewa
            </Button>
          )}
        </Box>
      </Paper>
    );
  }

  // Decision tree in-progress view
  return (
    <Paper sx={{ p: 4, borderRadius: 3 }}>
      {/* Header */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: '50%',
              backgroundColor: COLORS.primary,
              color: 'white',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              fontSize: '1.2rem',
              mr: 2
            }}
          >
            {currentAdvisor?.icon}
          </Box>
          <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            {currentAdvisor?.name} – Drzewo decyzyjne
          </Typography>
        </Box>
        <Box>
          <MuiTooltip title="Cofnij" arrow>
            <IconButton onClick={handleDecisionBack} disabled={decisionPath.length === 0} sx={{ color: COLORS.primary }}>
              <ArrowBack />
            </IconButton>
          </MuiTooltip>
          <MuiTooltip title={advancedMode ? 'Tryb standardowy' : 'Tryb zaawansowany'}>
            <IconButton onClick={toggleAdvancedMode} sx={{ color: COLORS.primary }}>
              <Settings />
            </IconButton>
          </MuiTooltip>
        </Box>
      </Box>

      {/* Progress */}
      <Box mb={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="body2" sx={{ color: COLORS.text, fontWeight: 600 }}>
            Postęp: {Math.round(progressValue)}%
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.lightText }}>
            Krok {currentStep + 1} z 3
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={progressValue}
          sx={{
            height: 10,
            borderRadius: 5,
            backgroundColor: '#e0e0e0',
            '& .MuiLinearProgress-bar': { 
              backgroundColor: COLORS.secondary,
              borderRadius: 5
            }
          }}
        />
      </Box>

      {/* Current Question Display */}
      {decisionOptions.length > 0 && (
        <Paper 
          elevation={2}
          sx={{
            p: 3,
            mb: 4,
            backgroundColor: '#f5f9ff',
            borderRadius: '12px',
            borderLeft: `4px solid ${COLORS.primary}`
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Krok {currentStep + 1}: Wybierz najlepszą opcję
          </Typography>
          <Typography variant="body1" sx={{ color: COLORS.text, lineHeight: 1.6 }}>
            Wybierz opcję, która najlepiej pasuje do Twojej sytuacji finansowej i preferencji.
          </Typography>
        </Paper>
      )}

      {/* Advanced stepper */}
      {advancedMode && decisionPath.length > 0 && (
        <Box mb={4}>
          <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Historia decyzji:
          </Typography>
          <Stepper activeStep={currentStep} orientation="vertical">
            {decisionPath.map((decision, idx) => (
              <Step key={idx} completed={idx < currentStep}>
                <StepLabel>
                  {getDecisionLabel(decision, idx, currentAdvisor)}
                </StepLabel>
                <StepContent>
                  <Typography variant="body2">
                    {getDecisionDescription(decision, idx)}
                  </Typography>
                </StepContent>
              </Step>
            ))}
          </Stepper>
          <Divider sx={{ my: 2 }} />
        </Box>
      )}

      {/* Options grid or loading */}
      {loading ? (
        <Box display="flex" flexDirection="column" alignItems="center" p={4}>
          <CircularProgress sx={{ color: COLORS.secondary, mb: 2 }} />
          <Typography variant="body2" sx={{ color: COLORS.lightText }}>
            Ładowanie opcji decyzyjnych...
          </Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={3}>
            {(Array.isArray(decisionOptions) ? decisionOptions : []).map((option, idx) => (
              <Grid item xs={12} sm={6} md={4} key={option.id}>
                <Card
                  sx={{ 
                    cursor: 'pointer', 
                    height: '100%',
                    transition: 'all 0.3s ease',
                    '&:hover': { 
                      boxShadow: 6,
                      transform: 'translateY(-4px)'
                    },
                    border: option.recommended ? `2px solid ${COLORS.secondary}` : '1px solid #e0e0e0',
                    position: 'relative'
                  }}
                  onClick={() => handleDecisionSelect(idx)}
                >
                  {option.recommended && (
                    <Box
                      sx={{
                        position: 'absolute',
                        top: -1,
                        right: -1,
                        backgroundColor: COLORS.secondary,
                        color: 'white',
                        px: 1,
                        py: 0.5,
                        borderRadius: '0 8px 0 8px',
                        fontSize: '0.75rem',
                        fontWeight: 'bold'
                      }}
                    >
                      POLECANE
                    </Box>
                  )}
                  
                  <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h4" sx={{ mr: 2 }}>
                        {option.icon}
                      </Typography>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: COLORS.primary }}>
                        {option.title}
                      </Typography>
                    </Box>
                    
                    <Typography variant="body2" sx={{ color: COLORS.lightText, flexGrow: 1, mb: 2 }}>
                      {option.description}
                    </Typography>
                    
                    {option.recommended && (
                      <Chip 
                        label={option.recommended} 
                        size="small" 
                        sx={{
                          backgroundColor: COLORS.secondary,
                          color: 'white',
                          fontWeight: 'bold',
                          alignSelf: 'flex-start'
                        }}
                      />
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Help text */}
          {decisionOptions.length > 0 && (
            <Box sx={{ mt: 3, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: COLORS.lightText }}>
                💡 Wskazówka: Wybierz opcję, która najlepiej odpowiada Twojej sytuacji finansowej
              </Typography>
            </Box>
          )}
        </>
      )}

      {/* Navigation buttons */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
        <Button
          variant="outlined"
          startIcon={<ArrowBack />}
          onClick={changeAdvisor}
          sx={{
            borderColor: COLORS.primary,
            color: COLORS.primary,
            borderRadius: '8px'
          }}
        >
          Zmień doradcę
        </Button>

        {decisionPath.length > 0 && (
          <Button
            variant="outlined"
            startIcon={<Refresh />}
            onClick={handleDecisionBack}
            sx={{
              borderColor: COLORS.secondary,
              color: COLORS.secondary,
              borderRadius: '8px'
            }}
          >
            Cofnij ostatni wybór
          </Button>
        )}
      </Box>
    </Paper>
  );
};

export default DecisionTreeView;