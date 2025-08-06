import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button,
  Chip
} from '@mui/material';
import { 
  ArrowForward,
  Check,
  TrendingUp,
  Save
} from '@mui/icons-material';
import FinancialProgressChart from './FinancialProgressChart';

const ADVISORS = [
  { 
    id: 'budget_planner', 
    name: 'Planista Budżetu', 
    description: 'Ekspert od funduszu awaryjnego i budżetowania.', 
    icon: '📊',
    goal: 'emergency_fund',
    specialty: 'Pomogę Ci zbudować solidny fundusz awaryjny, który zapewni Ci bezpieczeństwo finansowe w nieprzewidzianych sytuacjach.',
    initialMessage: 'Witaj! Jestem Planistą Budżetu. Moją specjalnością jest pomoc w zbudowaniu funduszu awaryjnego i efektywnym zarządzaniu budżetem. Jak mogę Ci pomóc?'
  },
  { 
    id: 'savings_strategist', 
    name: 'Strateg Oszczędności', 
    description: 'Specjalista od oszczędzania na cele długoterminowe.', 
    icon: '💰',
    goal: 'home_purchase',
    specialty: 'Pomogę Ci zrealizować plan zakupu nieruchomości poprzez odpowiednią strategię oszczędzania.',
    initialMessage: 'Witaj! Jestem Strategiem Oszczędności. Specjalizuję się w planowaniu długoterminowych celów, jak zakup nieruchomości. Jak mogę Ci pomóc?'
  },
  { 
    id: 'execution_expert', 
    name: 'Ekspert Spłaty Zadłużenia', 
    description: 'Specjalista od redukcji zadłużenia.', 
    icon: '🎯',
    goal: 'debt_reduction',
    specialty: 'Pomogę Ci opracować optymalną strategię spłaty zadłużenia, dopasowaną do Twojej sytuacji.',
    initialMessage: 'Witaj! Jestem Ekspertem Spłaty Zadłużenia. Moją specjalnością jest pomoc w redukcji zadłużenia w optymalny sposób. Jak mogę Ci pomóc?'
  },
  { 
    id: 'optimization_advisor', 
    name: 'Doradca Emerytalny', 
    description: 'Specjalista od planowania emerytalnego.', 
    icon: '⚙️',
    goal: 'retirement',
    specialty: 'Pomogę Ci zaplanować zabezpieczenie emerytalne dopasowane do Twoich potrzeb i możliwości.',
    initialMessage: 'Witaj! Jestem Doradcą Emerytalnym. Specjalizuję się w planowaniu zabezpieczenia emerytalnego. Jak mogę Ci pomóc?'
  }
];

// Helper function to get display name for goals
const mapGoalToName = (goal) => {
  switch(goal) {
    case 'emergency_fund': return 'Fundusz awaryjny';
    case 'debt_reduction': return 'Redukcja zadłużenia';
    case 'home_purchase': return 'Zakup nieruchomości';
    case 'retirement': return 'Zabezpieczenie emerytalne';
    case 'education': return 'Finansowanie edukacji';
    case 'vacation': return 'Wakacje i podróże';
    default: return 'Ogólne doradztwo';
  }
};

const AdvisorSelection = ({ 
  userProfile, 
  goalAmount, 
  showChart, 
  toggleChart, 
  setCurrentAdvisor, 
  COLORS 
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        maxWidth: 800, 
        margin: '0 auto', 
        backgroundColor: COLORS.lightBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
          Wybierz doradcę dla swojego celu finansowego
        </Typography>
        <Typography variant="body1" sx={{ color: COLORS.lightText }}>
          Każdy z naszych ekspertów specjalizuje się w innym obszarze finansów
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mb: 4 }}>
        {ADVISORS.map((advisor) => (
          <Paper
            key={advisor.id}
            elevation={2}
            sx={{
              p: 0,
              display: 'flex',
              alignItems: 'stretch',
              borderRadius: '12px',
              cursor: 'pointer',
              overflow: 'hidden',
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)'
              }
            }}
            onClick={() => setCurrentAdvisor(advisor)}
          >
            {/* Icon Section */}
            <Box sx={{ 
              width: '90px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: COLORS.primary,
              color: 'white',
              fontSize: '2.5rem'
            }}>
              {advisor.icon}
            </Box>
            
            {/* Content Section */}
            <Box sx={{ 
              flexGrow: 1, 
              p: 3, 
              display: 'flex', 
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <Typography variant="h6" sx={{ 
                color: COLORS.primary, 
                fontWeight: 'bold', 
                mb: 1
              }}>
                {advisor.name}
              </Typography>
              <Typography variant="body2" sx={{ color: COLORS.lightText, mb: 1 }}>
                {advisor.description}
              </Typography>
              <Typography variant="body2" sx={{ 
                color: COLORS.secondary,
                fontStyle: 'italic'
              }}>
                Cel: {mapGoalToName(advisor.goal)}
              </Typography>
            </Box>
            
            {/* Arrow Section */}
            <Box sx={{ 
              width: '60px', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              backgroundColor: 'rgba(0, 168, 150, 0.1)',
              color: COLORS.secondary
            }}>
              <ArrowForward />
            </Box>
          </Paper>
        ))}
      </Box>
      
      {userProfile && userProfile.financialData && (
        <Box sx={{ 
          mt: 4, 
          p: 3, 
          borderRadius: '12px', 
          backgroundColor: 'rgba(15, 48, 87, 0.03)',
          borderLeft: `4px solid ${COLORS.primary}`
        }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            mb: 2
          }}>
            <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
              Twój postęp w osiąganiu celów
            </Typography>
            <Button
              variant="outlined"
              startIcon={showChart ? <Save /> : <TrendingUp />}
              onClick={toggleChart}
              sx={{ 
                borderColor: COLORS.secondary,
                color: COLORS.secondary,
                borderRadius: '20px'
              }}
            >
              {showChart ? 'Ukryj wykres' : 'Pokaż wykres oszczędności'}
            </Button>
          </Box>
          
          {showChart && (
            <FinancialProgressChart 
              financialData={userProfile.financialData} 
              goalAmount={goalAmount} 
            />
          )}
          
          {/* Add advisor history if available */}
          {userProfile.lastCompletedAdvisor && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="subtitle1" sx={{ color: COLORS.primary, fontWeight: 'medium', mb: 2 }}>
                Twoje ostatnie konsultacje:
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                {userProfile.lastCompletedAdvisor && (
                  <Chip 
                    icon={<Check sx={{ color: COLORS.success }} />}
                    label={`${ADVISORS.find(a => a.id === userProfile.lastCompletedAdvisor)?.name || 'Doradca'} - ${new Date().toLocaleDateString()}`}
                    sx={{ 
                      backgroundColor: 'rgba(76, 175, 80, 0.1)', 
                      borderColor: COLORS.success,
                      borderWidth: 1,
                      borderStyle: 'solid'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default AdvisorSelection;