import React, { useRef, useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  IconButton,
  Button,
  Avatar,
  Chip,
  Fade,
  Zoom,
  CircularProgress,
  Tooltip,
  Divider,
  useTheme,
  alpha
} from '@mui/material';
import {
  Send,
  Mic,
  MicOff,
  ArrowBack,
  MoreVert,
  SmartToy,
  Person,
  AutoAwesome,
  Psychology,
  Tune,
  VolumeUp
} from '@mui/icons-material';

const ChatWindow = ({
  currentAdvisor,
  chatMessages,
  newMessage,
  setNewMessage,
  isListening,
  startListening,
  stopListening,
  speechRecognitionSupported,
  handleSendMessage,
  loading,
  setChatVisible,
  useChatGPT,
  selectedModel,
  backendStatus,
  COLORS
}) => {
  const theme = useTheme();
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);
  const [messageBeingTyped, setMessageBeingTyped] = useState('');

  // Enhanced scroll to bottom with smooth animation
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ 
      behavior: 'smooth',
      block: 'end'
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  // Simulate typing effect for AI responses
  useEffect(() => {
    if (loading) {
      setIsTyping(true);
      setMessageBeingTyped('');
    } else {
      setIsTyping(false);
    }
  }, [loading]);

  // Enhanced message rendering with animations
  const renderMessage = (message, index) => {
    const isUser = message.role === 'user';
    const isSystem = message.role === 'system';
    const isAssistant = message.role === 'assistant';

    return (
      <Fade in={true} timeout={300 + index * 100} key={`${message.timestamp}-${index}`}>
        <Box
          sx={{
            display: 'flex',
            justifyContent: isUser ? 'flex-end' : 'flex-start',
            mb: 3,
            alignItems: 'flex-end',
            gap: 1,
            opacity: 0,
            animation: `slideInMessage 0.4s ease-out ${index * 0.1}s forwards`,
            '@keyframes slideInMessage': {
              '0%': {
                opacity: 0,
                transform: isUser ? 'translateX(20px)' : 'translateX(-20px)'
              },
              '100%': {
                opacity: 1,
                transform: 'translateX(0)'
              }
            }
          }}
        >
          {/* Assistant Avatar */}
          {!isUser && (
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: isSystem 
                  ? 'linear-gradient(135deg, #ff9800 0%, #f57c00 100%)'
                  : `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                border: '2px solid white',
                fontSize: '1rem'
              }}
            >
              {isSystem ? '⚠️' : currentAdvisor?.icon || '🤖'}
            </Avatar>
          )}

          {/* Message Bubble */}
          <Paper
            elevation={0}
            sx={{
              maxWidth: '75%',
              minWidth: '100px',
              p: 2.5,
              position: 'relative',
              background: isUser
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : isSystem
                ? 'linear-gradient(135deg, #ffd89b 0%, #19547b 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              color: isUser ? 'white' : '#1a202c',
              borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
              boxShadow: isUser 
                ? '0 8px 25px rgba(102, 126, 234, 0.3)'
                : '0 4px 20px rgba(0,0,0,0.08)',
              border: !isUser ? '1px solid rgba(0,0,0,0.06)' : 'none',
              backdropFilter: 'blur(10px)',
              transform: 'scale(1)',
              transition: 'all 0.2s ease',
              '&:hover': {
                transform: 'scale(1.02)',
                boxShadow: isUser 
                  ? '0 12px 35px rgba(102, 126, 234, 0.4)'
                  : '0 8px 30px rgba(0,0,0,0.12)'
              },
              '&::before': {
                content: '""',
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                borderRadius: 'inherit',
                background: isUser 
                  ? 'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.05) 100%)'
                  : 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 100%)',
                pointerEvents: 'none'
              }
            }}
          >
            {/* Message Content */}
            <Typography
              variant="body1"
              sx={{
                lineHeight: 1.6,
                fontSize: '15px',
                fontWeight: isUser ? 500 : 400,
                letterSpacing: '0.01em',
                position: 'relative',
                zIndex: 1,
                '& strong': {
                  fontWeight: 700,
                  color: isUser ? 'rgba(255,255,255,0.95)' : COLORS.primary
                }
              }}
            >
              {message.content}
            </Typography>

            {/* Message metadata */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mt: 1.5,
                position: 'relative',
                zIndex: 1
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: isUser ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.5)',
                  fontSize: '11px',
                  fontWeight: 500
                }}
              >
                {new Date(message.timestamp).toLocaleTimeString('pl-PL', {
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </Typography>

              {/* AI Enhancement Indicators */}
              {!isUser && message.advisor_used && (
                <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
                  {useChatGPT && (
                    <Tooltip title={`Enhanced by ${selectedModel}`}>
                      <Chip
                        icon={<AutoAwesome sx={{ fontSize: '12px !important' }} />}
                        label="AI+"
                        size="small"
                        sx={{
                          height: 18,
                          fontSize: '10px',
                          fontWeight: 600,
                          background: 'linear-gradient(45deg, #10a37f 0%, #1a7f64 100%)',
                          color: 'white',
                          '& .MuiChip-icon': { color: 'white' }
                        }}
                      />
                    </Tooltip>
                  )}
                  
                  {message.sentiment && (
                    <Tooltip title={`Sentiment: ${message.sentiment}`}>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 
                            message.sentiment === 'positive' ? '#4caf50' :
                            message.sentiment === 'negative' ? '#f44336' : '#ff9800'
                        }}
                      />
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>
          </Paper>

          {/* User Avatar */}
          {isUser && (
            <Avatar
              sx={{
                width: 36,
                height: 36,
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                border: '2px solid white',
                color: 'white',
                fontWeight: 600
              }}
            >
              <Person />
            </Avatar>
          )}
        </Box>
      </Fade>
    );
  };

  // Typing indicator component
  const TypingIndicator = () => (
    <Fade in={isTyping}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 1,
          mb: 3,
          opacity: isTyping ? 1 : 0,
          transition: 'opacity 0.3s ease'
        }}
      >
        <Avatar
          sx={{
            width: 36,
            height: 36,
            background: `linear-gradient(135deg, ${COLORS.primary} 0%, ${COLORS.secondary} 100%)`,
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            border: '2px solid white'
          }}
        >
          {currentAdvisor?.icon || '🤖'}
        </Avatar>
        
        <Paper
          elevation={0}
          sx={{
            p: 2,
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderRadius: '20px 20px 20px 4px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            border: '1px solid rgba(0,0,0,0.06)',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {[0, 1, 2].map((dot) => (
              <Box
                key={dot}
                sx={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  backgroundColor: COLORS.secondary,
                  animation: `typingDot 1.4s infinite ease-in-out ${dot * 0.16}s`,
                  '@keyframes typingDot': {
                    '0%, 80%, 100%': {
                      transform: 'scale(0.8)',
                      opacity: 0.5
                    },
                    '40%': {
                      transform: 'scale(1)',
                      opacity: 1
                    }
                  }
                }}
              />
            ))}
          </Box>
          <Typography variant="caption" sx={{ color: 'rgba(0,0,0,0.6)', ml: 1 }}>
            Pisze...
          </Typography>
        </Paper>
      </Box>
    </Fade>
  );

  return (
    <Box
      sx={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {/* Enhanced Header */}
      <Paper
        elevation={0}
        sx={{
          background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
          color: 'white',
          p: 2.5,
          borderRadius: 0,
          position: 'relative',
          zIndex: 10,
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          '&::before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0.05) 100%)',
            pointerEvents: 'none'
          }
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setChatVisible(false)}
              sx={{ 
                color: 'white',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                '&:hover': { 
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <ArrowBack />
            </IconButton>
            
            <Avatar
              sx={{
                width: 48,
                height: 48,
                background: `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                border: '3px solid rgba(255,255,255,0.2)',
                fontSize: '1.2rem'
              }}
            >
              {currentAdvisor?.icon || '🤖'}
            </Avatar>
            
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  fontSize: '18px',
                  letterSpacing: '0.02em'
                }}
              >
                {currentAdvisor?.name}
              </Typography>
              <Typography 
                variant="body2" 
                sx={{ 
                  opacity: 0.8,
                  fontSize: '13px',
                  fontWeight: 500
                }}
              >
                {currentAdvisor?.description}
              </Typography>
            </Box>
          </Box>

          {/* Status indicators */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            {/* Connection Status */}
            <Tooltip title={backendStatus.healthy ? 'Połączony' : 'Offline'}>
              <Box
                sx={{
                  width: 10,
                  height: 10,
                  borderRadius: '50%',
                  backgroundColor: backendStatus.healthy ? '#4caf50' : '#f44336',
                  boxShadow: `0 0 10px ${backendStatus.healthy ? '#4caf50' : '#f44336'}`,
                  animation: backendStatus.healthy ? 'pulse 2s infinite' : 'none',
                  '@keyframes pulse': {
                    '0%': { opacity: 1 },
                    '50%': { opacity: 0.5 },
                    '100%': { opacity: 1 }
                  }
                }}
              />
            </Tooltip>

            {/* AI Enhancement Status */}
            {useChatGPT && backendStatus.chatgpt_available && (
              <Tooltip title={`ChatGPT ${selectedModel} Active`}>
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: '16px !important' }} />}
                  label="AI Enhanced"
                  size="small"
                  sx={{
                    background: 'linear-gradient(45deg, #10a37f 0%, #1a7f64 100%)',
                    color: 'white',
                    fontWeight: 600,
                    fontSize: '11px',
                    height: 28,
                    '& .MuiChip-icon': { color: 'white' }
                  }}
                />
              </Tooltip>
            )}

            <IconButton sx={{ color: 'white', opacity: 0.8 }}>
              <MoreVert />
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {/* Enhanced Chat Messages Area */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: 'auto',
          p: 3,
          background: 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)',
          position: 'relative',
          '&::-webkit-scrollbar': {
            width: 6,
          },
          '&::-webkit-scrollbar-track': {
            background: 'rgba(0,0,0,0.05)',
            borderRadius: 10,
          },
          '&::-webkit-scrollbar-thumb': {
            background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
            borderRadius: 10,
            '&:hover': {
              background: 'linear-gradient(135deg, #94a3b8 0%, #64748b 100%)',
            },
          },
        }}
      >
        {/* Background Pattern */}
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `
              radial-gradient(circle at 20px 20px, rgba(0,0,0,0.02) 1px, transparent 0),
              radial-gradient(circle at 60px 60px, rgba(0,0,0,0.01) 1px, transparent 0)
            `,
            backgroundSize: '80px 80px',
            pointerEvents: 'none',
            zIndex: 0
          }}
        />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          {chatMessages.map((message, index) => renderMessage(message, index))}
          {isTyping && <TypingIndicator />}
          <div ref={messagesEndRef} />
        </Box>
      </Box>

      {/* Enhanced Message Input */}
      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          borderTop: '1px solid rgba(0,0,0,0.08)',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 10
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1.5 }}>
          {/* Voice Input Button */}
          {speechRecognitionSupported && (
            <Tooltip title={isListening ? 'Zatrzymaj nagrywanie' : 'Rozpocznij nagrywanie'}>
              <IconButton
                onClick={isListening ? stopListening : startListening}
                disabled={loading}
                sx={{
                  background: isListening 
                    ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  color: 'white',
                  width: 48,
                  height: 48,
                  boxShadow: isListening 
                    ? '0 4px 15px rgba(239, 68, 68, 0.4)'
                    : '0 4px 15px rgba(59, 130, 246, 0.4)',
                  '&:hover': {
                    transform: 'scale(1.05)',
                    boxShadow: isListening 
                      ? '0 6px 20px rgba(239, 68, 68, 0.5)'
                      : '0 6px 20px rgba(59, 130, 246, 0.5)',
                  },
                  '&:disabled': {
                    background: 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)',
                    color: 'white',
                    opacity: 0.6
                  },
                  transition: 'all 0.2s ease',
                  animation: isListening ? 'pulse 1.5s infinite' : 'none'
                }}
              >
                {isListening ? <MicOff /> : <Mic />}
              </IconButton>
            </Tooltip>
          )}

          {/* Message Input Field */}
          <TextField
            fullWidth
            multiline
            maxRows={4}
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Napisz wiadomość... (wspierane przez ChatGPT)"
            disabled={loading}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 3,
                background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.08)',
                '&:hover': {
                  boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                  borderColor: COLORS.secondary,
                },
                '&.Mui-focused': {
                  boxShadow: `0 0 0 3px ${alpha(COLORS.secondary, 0.1)}`,
                  borderColor: COLORS.secondary,
                }
              },
              '& .MuiOutlinedInput-input': {
                fontSize: '15px',
                lineHeight: 1.5,
                '&::placeholder': {
                  color: 'rgba(0,0,0,0.5)',
                  opacity: 1
                }
              }
            }}
          />

          {/* Send Button */}
          <Tooltip title="Wyślij wiadomość">
            <span>
              <IconButton
                onClick={handleSendMessage}
                disabled={loading || !newMessage.trim()}
                sx={{
                  background: loading || !newMessage.trim()
                    ? 'linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%)'
                    : `linear-gradient(135deg, ${COLORS.secondary} 0%, ${COLORS.primary} 100%)`,
                  color: loading || !newMessage.trim() ? '#64748b' : 'white',
                  width: 48,
                  height: 48,
                  boxShadow: loading || !newMessage.trim()
                    ? 'none'
                    : `0 4px 15px ${alpha(COLORS.secondary, 0.4)}`,
                  '&:hover': {
                    transform: loading || !newMessage.trim() ? 'none' : 'scale(1.05)',
                    boxShadow: loading || !newMessage.trim()
                      ? 'none'
                      : `0 6px 20px ${alpha(COLORS.secondary, 0.5)}`,
                  },
                  transition: 'all 0.2s ease'
                }}
              >
                {loading ? (
                  <CircularProgress size={20} sx={{ color: 'inherit' }} />
                ) : (
                  <Send />
                )}
              </IconButton>
            </span>
          </Tooltip>
        </Box>

        {/* Connection Status Bar */}
        {!backendStatus.healthy && (
          <Box
            sx={{
              mt: 2,
              p: 1.5,
              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
              borderRadius: 2,
              border: '1px solid #f59e0b',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#f59e0b',
                animation: 'pulse 2s infinite'
              }}
            />
            <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 500 }}>
              Połączenie z backendem przerwane. Używam trybu offline.
            </Typography>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default ChatWindow;