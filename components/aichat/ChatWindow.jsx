import React from 'react';
import { Paper, Box, Typography, IconButton, TextField, Button, CircularProgress } from '@mui/material';
import { ArrowBack, Mic, MicOff, Info } from '@mui/icons-material';

const ChatWindow = ({ currentAdvisor, chatMessages, newMessage, setNewMessage, isListening, startListening, stopListening, speechRecognitionSupported, handleSendMessage, loading, setChatVisible, COLORS }) => (
  <Paper elevation={3} sx={{ p: 0, maxWidth: 800, margin: '0 auto', backgroundColor: COLORS.lightBackground, display: 'flex', flexDirection: 'column', height: 550, borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.1)' }}>
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2, backgroundColor: COLORS.primary, color: 'white' }}>
      <Box display="flex" alignItems="center">
        <Box sx={{ width: 40, height: 40, borderRadius: '50%', backgroundColor: 'rgba(255, 255, 255, 0.2)', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '1.2rem', mr: 2 }}>
          {currentAdvisor.icon}
        </Box>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{currentAdvisor.name}</Typography>
        </Box>
      </Box>
      <Box>
        <IconButton onClick={() => setChatVisible(false)} sx={{ color: 'white' }}>
          <ArrowBack />
        </IconButton>
      </Box>
    </Box>

    <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3, backgroundColor: '#f5f7fa', display: 'flex', flexDirection: 'column', gap: 2 }}>
      {chatMessages.map((msg, index) => (
        <Box key={index} sx={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start', mb: 1 }}>
          <Paper elevation={1} sx={{ p: 2, maxWidth: '75%', backgroundColor: msg.role === 'user' ? COLORS.primary : 'white', color: msg.role === 'user' ? 'white' : COLORS.text, borderRadius: msg.role === 'user' ? '18px 18px 0 18px' : '18px 18px 18px 0' }}>
            <Typography variant="body1">{msg.content}</Typography>
          </Paper>
        </Box>
      ))}
      {loading && (
        <Box alignSelf="flex-start" display="flex" alignItems="center" mt={2} mb={2}>
          <CircularProgress size={24} sx={{ color: COLORS.secondary }} />
        </Box>
      )}
    </Box>

    <Box sx={{ p: 2, borderTop: '1px solid rgba(0,0,0,0.08)', backgroundColor: 'white', display: 'flex', alignItems: 'center' }}>
      {speechRecognitionSupported && (
        <IconButton color={isListening ? 'secondary' : 'default'} onClick={isListening ? stopListening : startListening} disabled={loading} sx={{ mr: 1 }}>
          {isListening ? <MicOff /> : <Mic />}
        </IconButton>
      )}
      <TextField
        fullWidth
        placeholder={`Zapytaj ${currentAdvisor.name}...`}
        value={newMessage}
        onChange={(e) => setNewMessage(e.target.value)}
        variant="outlined"
        disabled={loading}
        onKeyPress={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
          }
        }}
        sx={{ mr: 1, '& .MuiOutlinedInput-root': { borderRadius: '30px', backgroundColor: '#f5f7fa' } }}
      />
      <IconButton color="primary" disabled={loading || !newMessage.trim()} onClick={handleSendMessage}>
        <ArrowBack sx={{ transform: 'rotate(180deg)' }} />
      </IconButton>
    </Box>
  </Paper>
);

export default ChatWindow;