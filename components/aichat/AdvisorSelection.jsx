import React from 'react';
import { Paper, Box, Typography, Button, Chip } from '@mui/material';
import { ArrowForward, Check, Save, TrendingUp } from '@mui/icons-material';
import FinancialProgressChart from './FinancialProgressChart';
import { mapGoalToName } from './constants';

const AdvisorSelection = ({ ADVISORS, setCurrentAdvisor, userProfile, showChart, toggleChart, COLORS, goalAmount }) => (
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

          <Box sx={{
            flexGrow: 1,
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center'
          }}>
            <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
              {advisor.name}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.lightText, mb: 1 }}>
              {advisor.description}
            </Typography>
            <Typography variant="body2" sx={{ color: COLORS.secondary, fontStyle: 'italic' }}>
              Cel: {mapGoalToName(advisor.goal)}
            </Typography>
          </Box>

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
      <Box sx={{ mt: 4, p: 3, borderRadius: '12px', backgroundColor: 'rgba(15, 48, 87, 0.03)', borderLeft: `4px solid ${COLORS.primary}` }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
            Twój postęp w osiąganiu celów
          </Typography>
          <Button
            variant="outlined"
            startIcon={showChart ? <Save /> : <TrendingUp />}
            onClick={toggleChart}
            sx={{ borderColor: COLORS.secondary, color: COLORS.secondary, borderRadius: '20px' }}
          >
            {showChart ? 'Ukryj wykres' : 'Pokaż wykres oszczędności'}
          </Button>
        </Box>

        {showChart && (
          <FinancialProgressChart financialData={userProfile.financialData} goalAmount={goalAmount} COLORS={COLORS} />
        )}

        {userProfile.lastCompletedAdvisor && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" sx={{ color: COLORS.primary, fontWeight: 'medium', mb: 2 }}>
              Twoje ostatnie konsultacje:
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip
                icon={<Check sx={{ color: COLORS.success }} />}
                label={`${ADVISORS.find(a => a.id === userProfile.lastCompletedAdvisor)?.name || 'Doradca'} - ${new Date().toLocaleDateString()}`}
                sx={{ backgroundColor: 'rgba(76, 175, 80, 0.1)', borderColor: COLORS.success, borderWidth: 1, borderStyle: 'solid' }}
              />
            </Box>
          </Box>
        )}
      </Box>
    )}
  </Paper>
);

export default AdvisorSelection;