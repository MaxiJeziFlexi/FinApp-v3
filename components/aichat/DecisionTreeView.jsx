import React from 'react';
import { Paper, Box, Typography, IconButton, LinearProgress, Stepper, Step, StepLabel, StepContent, Button, Divider, CircularProgress } from '@mui/material';
import { ArrowBack, Settings, Help, EmojiEvents, ArrowForward, Refresh } from '@mui/icons-material';
import { mapGoalToName } from './constants';

const DecisionTreeView = ({ 
  currentAdvisor, 
  changeAdvisor, 
  toggleAdvancedMode, 
  advancedMode, 
  progressValue, 
  decisionPath, 
  finalRecommendation, 
  decisionOptions, 
  loading, 
  handleDecisionSelect, 
  toggleChat, 
  generatePDF,
  COLORS 
}) => {
  
  // Helper functions for decision tree visualization
  const getDecisionLabel = (decision, index) => {
    if (index === 0) {
      const advisor = currentAdvisor;
      if (advisor) {
        return `Wybór celu: ${mapGoalToName(advisor.goal)}`;
      }
      return 'Wybór celu finansowego';
    }
    
    const decision_text = decisionOptions.find(opt => opt.id === decision.selection)?.text;
    if (decision_text) {
      return decision_text;
    }
    
    const goalType = currentAdvisor?.goal || 'emergency_fund';
    switch(goalType) {
      case 'emergency_fund':
        if (index === 1) return 'Wybór okresu czasu';
        if (index === 2) return 'Wybór wielkości funduszu';
        if (index === 3) return 'Wybór metody oszczędzania';
        break;
      case 'debt_reduction':
        if (index === 1) return 'Wybór rodzaju zadłużenia';
        if (index === 2) return 'Wybór kwoty zadłużenia';
        if (index === 3) return 'Wybór strategii spłaty';
        break;
      case 'home_purchase':
        if (index === 1) return 'Wybór okresu czasu';
        if (index === 2) return 'Wybór wkładu własnego';
        if (index === 3) return 'Wybór budżetu';
        break;
      case 'retirement':
        if (index === 1) return 'Wybór wieku emerytalnego';
        if (index === 2) return 'Wybór obecnego etapu kariery';
        if (index === 3) return 'Wybór formy oszczędzania';
        break;
    }
    
    return `Krok ${index + 1}`;
  };

  const getDecisionDescription = (decision, index) => {
    const selection = decision.selection;
    
    const descriptions = {
      'short': 'Krótki okres czasu',
      'medium': 'Średni okres czasu',
      'long': 'Długi okres czasu',
      'very_long': 'Bardzo długi okres czasu',
      'three': '3 miesiące wydatków',
      'six': '6 miesięcy wydatków',
      'twelve': '12 miesięcy wydatków',
      'automatic': 'Automatyczne odkładanie stałej kwoty',
      'percentage': 'Odkładanie procentu dochodów',
      'surplus': 'Odkładanie nadwyżek z budżetu',
      'credit_card': 'Karty kredytowe i chwilówki',
      'consumer': 'Kredyty konsumpcyjne',
      'mortgage': 'Kredyt hipoteczny',
      'multiple': 'Różne zobowiązania',
      'avalanche': 'Metoda lawiny (najwyższe oprocentowanie)',
      'snowball': 'Metoda kuli śnieżnej (najmniejsze kwoty)',
      'consolidation': 'Konsolidacja zadłużenia',
      'ten': '10% wkładu własnego',
      'twenty': '20% wkładu własnego',
      'thirty_plus': '30% lub więcej wkładu własnego',
      'full': 'Zakup w 100% za gotówkę',
      'small': 'Mała kwota',
      'medium': 'Średnia kwota',
      'large': 'Duża kwota',
      'very_large': 'Bardzo duża kwota',
      'early': 'Wcześniejsza emerytura',
      'standard': 'Standardowy wiek emerytalny',
      'late': 'Pó��niejsza emerytura',
      'mid': 'Środkowy etap kariery',
      'ike_ikze': 'IKE/IKZE',
      'investment': 'Własne inwestycje długoterminowe',
      'real_estate': 'Nieruchomości na wynajem',
      'combined': 'Strategia łączona'
    };
    
    return descriptions[selection] || `Wybór: ${selection}`;
  };

  return (
    <Paper elevation={3} sx={{ 
      p: 4, 
      maxWidth: 800, 
      margin: '0 auto', 
      backgroundColor: COLORS.lightBackground, 
      borderRadius: '16px', 
      boxShadow: '0 8px 24px rgba(0,0,0,0.1)' 
    }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <Box sx={{ 
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
          }}>
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
          <IconButton onClick={changeAdvisor} sx={{ color: COLORS.primary }}>
            <ArrowBack />
          </IconButton>
          <IconButton onClick={toggleAdvancedMode} sx={{ color: COLORS.primary }}>
            <Settings />
          </IconButton>
        </Box>
      </Box>

      <Box mb={4}>
        <LinearProgress 
          variant="determinate" 
          value={progressValue} 
          sx={{ 
            height: 10, 
            borderRadius: 5, 
            backgroundColor: '#e0e0e0', 
            '& .MuiLinearProgress-bar': { backgroundColor: COLORS.secondary } 
          }} 
        />
        <Box display="flex" justifyContent="space-between" mt={1}>
          <Typography variant="body2" color={COLORS.lightText}>Początek</Typography>
          <Typography variant="body2" fontWeight="bold" color={COLORS.secondary}>
            {`${Math.round(progressValue)}%`}
          </Typography>
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
                  <Typography variant="body2" sx={{ 
                    fontWeight: index === decisionPath.length - 1 ? 'bold' : 'normal' 
                  }}>
                    {getDecisionLabel(decision, index)}
                  </Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body2" sx={{ color: COLORS.lightText }}>
                    {getDecisionDescription(decision, index)}
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
        <Box>
          <Paper elevation={2} sx={{ 
            p: 3, 
            mb: 4, 
            backgroundColor: '#f5f9ff', 
            borderRadius: '12px', 
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)' 
          }}>
            <Typography variant="h6" gutterBottom sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
              Twoje rekomendacje
            </Typography>
            <Typography variant="body1" paragraph sx={{ mb: 3 }}>
              {finalRecommendation.summary}
            </Typography>
            
            {finalRecommendation.steps && (
              <Box mt={3}>
                <Typography variant="subtitle1" gutterBottom sx={{ 
                  fontWeight: 'bold', 
                  color: COLORS.primary 
                }}>
                  Następne kroki:
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {finalRecommendation.steps.map((step, index) => (
                    <Box 
                      key={index} 
                      sx={{ 
                        display: 'flex', 
                        alignItems: 'flex-start',
                        backgroundColor: 'rgba(0, 168, 150, 0.05)',
                        p: 2,
                        borderRadius: '8px'
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
          </Paper>

          <Box mt={3} sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
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
              onClick={toggleChat} 
              sx={{ 
                backgroundColor: COLORS.secondary, 
                '&:hover': { backgroundColor: '#008f82' },
                borderRadius: '8px',
                px: 3
              }}
            >
              Porozmawiaj z doradcą
            </Button>
          </Box>
          
          <Box display="flex" justifyContent="center" mt={3}>
            <Button 
              variant="outlined" 
              startIcon={<Refresh />} 
              onClick={changeAdvisor} 
              sx={{ 
                borderColor: COLORS.primary, 
                color: COLORS.primary,
                borderRadius: '8px'
              }}
            >
              Zmień doradcę
            </Button>
          </Box>
        </Box>
      ) : (
        <Box>
          {loading ? (
            <Box display="flex" justifyContent="center" flexDirection="column" alignItems="center" p={4}>
              <CircularProgress sx={{ color: COLORS.secondary, mb: 2 }} />
              <Typography variant="body2" color={COLORS.lightText}>
                Analizuję najlepsze opcje dla Twojego celu...
              </Typography>
            </Box>
          ) : (
            <Box>
              <Paper sx={{ 
                p: 3, 
                mb: 3, 
                borderRadius: '12px', 
                backgroundColor: 'rgba(15, 48, 87, 0.03)', 
                borderLeft: `4px solid ${COLORS.primary}` 
              }}>
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
                    sx={{ 
                      p: 2, 
                      justifyContent: 'flex-start', 
                      textAlign: 'left', 
                      borderColor: '#e0e0e0', 
                      color: COLORS.text, 
                      borderRadius: '8px', 
                      transition: 'all 0.2s ease', 
                      position: 'relative', 
                      '&:hover': { 
                        transform: 'translateX(5px)', 
                        borderColor: COLORS.secondary, 
                        backgroundColor: 'rgba(0, 168, 150, 0.05)' 
                      } 
                    }}
                  >
                    {option.text}
                  </Button>
                ))}
              </Box>
              {advancedMode && (
                <Box mt={4}>
                  <Divider sx={{ mb: 2 }} />
                  <Button 
                    variant="text" 
                    startIcon={<Help />} 
                    onClick={toggleChat} 
                    sx={{ color: COLORS.primary }}
                  >
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
};

export default DecisionTreeView;