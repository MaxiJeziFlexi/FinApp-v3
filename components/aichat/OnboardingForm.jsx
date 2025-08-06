import React from 'react'; 
import { 
  Box, 
  Typography, 
  Paper, 
  TextField, 
  Button,
  Grid,
  CircularProgress,
  FormControl,
  Select,
  MenuItem,
  Checkbox,
  FormControlLabel
} from '@mui/material';

// Opcje dla pól formularza onboardingowego
const incomeOptions = [
  { value: 'below_2000', label: 'Poniżej 2000 zł' },
  { value: '2000_4000', label: '2000 - 4000 zł' },
  { value: '4000_6000', label: '4000 - 6000 zł' },
  { value: '6000_8000', label: '6000 - 8000 zł' },
  { value: 'above_8000', label: 'Powyżej 8000 zł' }
];

const savingsOptions = [
  { value: '0_1000', label: '0 - 1000 zł' },
  { value: '1000_5000', label: '1000 - 5000 zł' },
  { value: '5000_10000', label: '5000 - 10 000 zł' },
  { value: '10000_20000', label: '10 000 - 20 000 zł' },
  { value: 'above_20000', label: 'Powyżej 20 000 zł' }
];

const OnboardingForm = ({
  formData,
  setFormData,
  formErrors,
  consents,
  setConsents,
  loading,
  handleOnboardingSubmit,
  COLORS
}) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        p: 4, 
        maxWidth: 600, 
        margin: '0 auto', 
        backgroundColor: COLORS.lightBackground,
        borderRadius: '16px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.1)'
      }}
    >
      <Box textAlign="center" mb={4}>
        <Typography variant="h5" sx={{ color: COLORS.primary, fontWeight: 'bold', mb: 1 }}>
          Rozpocznij swoją podróż finansową
        </Typography>
        <Typography variant="body1" sx={{ color: COLORS.lightText }}>
          Wybierz opcje, które najlepiej pasują do Twojej sytuacji
        </Typography>
      </Box>
      
      <Box component="form" sx={{ mt: 2 }}>
        <Grid container spacing={3}>
          {/* User Name */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Jak się nazywasz?
              </Typography>
              <TextField
                fullWidth
                placeholder="Wpisz swoje imię"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                error={!!formErrors.name}
                helperText={formErrors.name}
                variant="outlined"
                InputProps={{
                  startAdornment: (
                    <Box component="span" sx={{ mr: 1, color: COLORS.primary }}>👤</Box>
                  ),
                  sx: { borderRadius: '8px' }
                }}
              />
            </Box>
          </Grid>
          
          {/* Financial Goal */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Twój główny cel finansowy
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {[
                  { value: 'emergency_fund', label: 'Fundusz awaryjny', icon: '🛡️' },
                  { value: 'debt_reduction', label: 'Spłata długów', icon: '💸' },
                  { value: 'home_purchase', label: 'Zakup mieszkania', icon: '🏠' },
                  { value: 'retirement', label: 'Emerytura', icon: '👵' },
                  { value: 'education', label: 'Edukacja', icon: '🎓' },
                  { value: 'vacation', label: 'Wakacje', icon: '🏖️' },
                  { value: 'other', label: 'Inny cel', icon: '🎯' }
                ].map((goal) => (
                  <Button
                    key={goal.value}
                    variant={formData.goal === goal.value ? "contained" : "outlined"}
                    onClick={() => setFormData({...formData, goal: goal.value})}
                    sx={{
                      borderRadius: '30px',
                      py: 1,
                      px: 2,
                      backgroundColor: formData.goal === goal.value ? COLORS.secondary : 'transparent',
                      color: formData.goal === goal.value ? 'white' : COLORS.primary,
                      borderColor: COLORS.secondary,
                      '&:hover': {
                        backgroundColor: formData.goal === goal.value 
                          ? COLORS.secondary 
                          : 'rgba(0, 168, 150, 0.1)',
                      }
                    }}
                  >
                    {goal.icon} {goal.label}
                  </Button>
                ))}
              </Box>
              {formErrors.goal && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {formErrors.goal}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Timeframe */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              mb: 1, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                W jakim czasie chcesz osiągnąć swój cel?
              </Typography>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                {[
                  { value: 'short', label: 'Krótki termin', sublabel: 'do 1 roku', icon: '🚲' },
                  { value: 'medium', label: 'Średni termin', sublabel: '1-5 lat', icon: '🚗' },
                  { value: 'long', label: 'Długi termin', sublabel: 'ponad 5 lat', icon: '🚀' }
                ].map((timeframe) => (
                  <Button
                    key={timeframe.value}
                    variant="outlined"
                    onClick={() => setFormData({...formData, timeframe: timeframe.value})}
                    sx={{
                      borderRadius: '12px',
                      p: 2,
                      width: '32%',
                      height: '100px',
                      flexDirection: 'column',
                      backgroundColor: formData.timeframe === timeframe.value 
                        ? 'rgba(0, 168, 150, 0.1)' 
                        : 'white',
                      borderColor: formData.timeframe === timeframe.value 
                        ? COLORS.secondary 
                        : '#e0e0e0',
                      borderWidth: formData.timeframe === timeframe.value ? 2 : 1,
                      '&:hover': {
                        backgroundColor: 'rgba(0, 168, 150, 0.05)',
                        borderColor: COLORS.secondary
                      }
                    }}
                  >
                    <Typography variant="h5" sx={{ mb: 1 }}>{timeframe.icon}</Typography>
                    <Typography variant="body2" fontWeight="bold">{timeframe.label}</Typography>
                    <Typography variant="caption">{timeframe.sublabel}</Typography>
                  </Button>
                ))}
              </Box>
              {formErrors.timeframe && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {formErrors.timeframe}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Monthly Income */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Miesięczny dochód
              </Typography>
              <FormControl fullWidth variant="outlined" error={!!formErrors.monthlyIncome}>
                <Select
                  value={formData.monthlyIncome}
                  onChange={(e) => setFormData({...formData, monthlyIncome: e.target.value})}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">Wybierz przedział</Typography>
                  </MenuItem>
                  {incomeOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.monthlyIncome && (
                  <Typography variant="caption" color="error">
                    {formErrors.monthlyIncome}
                  </Typography>
                )}
              </FormControl>
            </Box>
          </Grid>
          
          {/* Current Savings */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ 
              p: 2, 
              height: '100%',
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Obecne oszczędności
              </Typography>
              <FormControl fullWidth variant="outlined">
                <Select
                  value={formData.currentSavings}
                  onChange={(e) => setFormData({...formData, currentSavings: e.target.value})}
                  displayEmpty
                  sx={{ borderRadius: '8px' }}
                >
                  <MenuItem value="" disabled>
                    <Typography variant="body2" color="text.secondary">Wybierz przedział</Typography>
                  </MenuItem>
                  {savingsOptions.map(option => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Grid>
          
          {/* Consents */}
          <Grid item xs={12}>
            <Box sx={{ 
              p: 2, 
              borderRadius: '12px', 
              backgroundColor: 'rgba(15, 48, 87, 0.03)',
              borderLeft: `4px solid ${COLORS.primary}`
            }}>
              <Typography variant="subtitle1" fontWeight="medium" gutterBottom>
                Zgody i oświadczenia
              </Typography>
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consents.dataProcessing}
                    onChange={(e) => setConsents({...consents, dataProcessing: e.target.checked})}
                    sx={{
                      color: COLORS.secondary,
                      '&.Mui-checked': {
                        color: COLORS.secondary,
                      },
                    }}
                  />
                }
                label="Wyrażam zgodę na przetwarzanie moich danych w celu otrzymania spersonalizowanych porad finansowych"
              />
              
              <FormControlLabel
                control={
                  <Checkbox
                    checked={consents.profiling}
                    onChange={(e) => setConsents({...consents, profiling: e.target.checked})}
                    sx={{
                      color: COLORS.secondary,
                      '&.Mui-checked': {
                        color: COLORS.secondary,
                      },
                    }}
                  />
                }
                label="Wyrażam zgodę na automatyczne profilowanie moich preferencji finansowych"
              />
              
              {formErrors.consents && (
                <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
                  {formErrors.consents}
                </Typography>
              )}
            </Box>
          </Grid>
          
          {/* Submit Button */}
          <Grid item xs={12}>
            <Button
              variant="contained"
              fullWidth
              disabled={loading}
              onClick={handleOnboardingSubmit}
              sx={{ 
                backgroundColor: COLORS.secondary,
                '&:hover': {
                  backgroundColor: '#008f82'
                },
                py: 1.5,
                mt: 2,
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 168, 150, 0.2)'
              }}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Rozpocznij swoją podróż finansową'
              )}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
};

export default OnboardingForm;