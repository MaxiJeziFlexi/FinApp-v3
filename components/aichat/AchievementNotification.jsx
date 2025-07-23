import React from 'react';
import { Paper, Typography, Box, Slide, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

const COLORS = {
  primary: '#0F3057',
  secondary: '#00A896',
  success: '#4CAF50',
  lightText: '#666',
  text: '#111',
  background: '#f7f9fc',
  lightBackground: '#ffffff'
};

const AchievementNotification = ({ achievement, onClose }) => (
  <Slide direction="up" in={!!achievement}>
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        backgroundColor: '#f8f9d2',
        position: 'fixed',
        bottom: 20,
        right: 20,
        zIndex: 1000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        maxWidth: 350
      }}
    >
      <Typography variant="h3" sx={{ mr: 2 }}>{achievement.icon}</Typography>
      <Box>
        <Typography variant="h6" sx={{ color: COLORS.primary, fontWeight: 'bold' }}>
          {achievement.title}
        </Typography>
        <Typography variant="body2">{achievement.description}</Typography>
      </Box>
      <IconButton onClick={onClose} sx={{ ml: 1 }}><CloseIcon /></IconButton>
    </Paper>
  </Slide>
);

export default AchievementNotification;
