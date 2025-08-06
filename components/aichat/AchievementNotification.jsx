import React from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  IconButton, 
  Slide,
  Fade
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

const AchievementNotification = ({ achievement, onClose, COLORS }) => {
  if (!achievement) return null;

  return (
    <Fade in={!!achievement} timeout={500}>
      <Box
        sx={{
          position: 'fixed',
          top: 20,
          right: 20,
          zIndex: 9999,
          maxWidth: 400
        }}
      >
        <Paper
          elevation={8}
          sx={{
            p: 3,
            backgroundColor: COLORS.success,
            color: 'white',
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(76, 175, 80, 0.3)',
            position: 'relative',
            overflow: 'hidden',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
              pointerEvents: 'none'
            }
          }}
        >
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box flex={1}>
              <Box display="flex" alignItems="center" mb={1}>
                <Typography variant="h4" sx={{ mr: 2 }}>
                  {achievement.icon}
                </Typography>
                <Box>
                  <Typography variant="h6" fontWeight="bold">
                    Gratulacje! 🎉
                  </Typography>
                  <Typography variant="subtitle1" fontWeight="medium">
                    {achievement.title}
                  </Typography>
                </Box>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                {achievement.description}
              </Typography>
            </Box>
            <IconButton
              onClick={onClose}
              sx={{
                color: 'white',
                opacity: 0.8,
                '&:hover': { opacity: 1 }
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>
        </Paper>
      </Box>
    </Fade>
  );
};

export default AchievementNotification;