import React, { useState } from 'react';
import { 
  Box, 
  Typography, 
  Avatar, 
  IconButton, 
  Tooltip,
  Chip,
  Collapse 
} from '@mui/material';
import { 
  ContentCopy,
  ExpandMore,
  ExpandLess,
  VolumeUp,
  Sentiment,
  Schedule,
  Psychology
} from '@mui/icons-material';

/**
 * Message Bubble Component
 * Displays individual chat messages with enhanced features
 */
const MessageBubble = ({ 
  message, 
  advisor, 
  showAvatar = true, 
  showMetadata = false,
  onCopy,
  onSpeak,
  COLORS 
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [copied, setCopied] = useState(false);

  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.isError || false;

  // Handle copy to clipboard
  const handleCopy = async () => {
    if (onCopy) {
      onCopy(message.content);
    } else {
      try {
        await navigator.clipboard.writeText(message.content);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (error) {
        console.error('Failed to copy text:', error);
      }
    }
  };

  // Handle text-to-speech
  const handleSpeak = () => {
    if (onSpeak) {
      onSpeak(message.content);
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(message.content);
      utterance.lang = 'pl-PL';
      utterance.rate = 0.9;
      speechSynthesis.speak(utterance);
    }
  };

  // Get sentiment emoji
  const getSentimentEmoji = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '😊';
      case 'negative': return '😔';
      case 'uncertain': return '🤔';
      default: return '😐';
    }
  };

  // Get message timestamp
  const getFormattedTime = (timestamp) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('pl-PL', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } catch {
      return '';
    }
  };

  // Get response time formatting
  const getResponseTime = (responseTime) => {
    if (!responseTime) return '';
    if (responseTime < 1000) return `${responseTime}ms`;
    return `${(responseTime / 1000).toFixed(1)}s`;
  };

  return (
    <Box 
      sx={{ 
        mb: 2,
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        alignItems: 'flex-start'
      }}
    >
      {/* Avatar for assistant messages */}
      {!isUser && showAvatar && (
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            mr: 1,
            backgroundColor: COLORS.primary,
            fontSize: '0.8rem'
          }}
        >
          {advisor?.icon || '🤖'}
        </Avatar>
      )}

      {/* Message content */}
      <Box
        sx={{
          maxWidth: '70%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        {/* Message bubble */}
        <Box
          sx={{
            p: 2,
            borderRadius: isUser ? '18px 18px 6px 18px' : '18px 18px 18px 6px',
            backgroundColor: isError 
              ? '#ffebee' 
              : isSystem 
                ? '#f5f5f5'
                : isUser 
                  ? COLORS.secondary 
                  : 'white',
            color: isError 
              ? '#c62828'
              : isUser 
                ? 'white' 
                : COLORS.text,
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'relative',
            border: isError ? '1px solid #ffcdd2' : 'none'
          }}
        >
          {/* Advisor name for assistant messages */}
          {!isUser && !isSystem && advisor && (
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              mb: 1,
              opacity: 0.7
            }}>
              <Typography variant="caption" fontWeight="medium">
                {advisor.name}
              </Typography>
            </Box>
          )}

          {/* Message text */}
          <Typography 
            variant="body1" 
            sx={{ 
              wordBreak: 'break-word',
              lineHeight: 1.5
            }}
          >
            {message.content}
          </Typography>

          {/* Sentiment indicator for user messages */}
          {isUser && message.sentiment && (
            <Box sx={{ 
              position: 'absolute', 
              top: -8, 
              right: -8,
              fontSize: '1rem'
            }}>
              {getSentimentEmoji(message.sentiment)}
            </Box>
          )}
        </Box>

        {/* Message metadata */}
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center',
          justifyContent: isUser ? 'flex-end' : 'flex-start',
          mt: 0.5,
          gap: 1
        }}>
          {/* Timestamp */}
          <Typography 
            variant="caption" 
            sx={{ 
              color: COLORS.lightText,
              fontSize: '0.7rem'
            }}
          >
            {getFormattedTime(message.timestamp)}
          </Typography>

          {/* Response time for assistant messages */}
          {!isUser && message.metadata?.responseTime && (
            <Chip 
              size="small"
              icon={<Schedule sx={{ fontSize: '0.8rem' }} />}
              label={getResponseTime(message.metadata.responseTime)}
              sx={{ 
                height: 16,
                fontSize: '0.6rem',
                backgroundColor: 'rgba(0,0,0,0.05)'
              }}
            />
          )}

          {/* Action buttons */}
          <Box sx={{ display: 'flex', gap: 0.5 }}>
            {/* Copy button */}
            <Tooltip title={copied ? "Skopiowano!" : "Kopiuj"}>
              <IconButton 
                size="small" 
                onClick={handleCopy}
                sx={{ 
                  width: 20, 
                  height: 20,
                  color: COLORS.lightText
                }}
              >
                <ContentCopy sx={{ fontSize: '0.8rem' }} />
              </IconButton>
            </Tooltip>

            {/* Speak button for assistant messages */}
            {!isUser && 'speechSynthesis' in window && (
              <Tooltip title="Odczytaj">
                <IconButton 
                  size="small" 
                  onClick={handleSpeak}
                  sx={{ 
                    width: 20, 
                    height: 20,
                    color: COLORS.lightText
                  }}
                >
                  <VolumeUp sx={{ fontSize: '0.8rem' }} />
                </IconButton>
              </Tooltip>
            )}

            {/* Details toggle */}
            {(message.metadata || showMetadata) && (
              <Tooltip title={showDetails ? "Ukryj szczegóły" : "Pokaż szczegóły"}>
                <IconButton 
                  size="small" 
                  onClick={() => setShowDetails(!showDetails)}
                  sx={{ 
                    width: 20, 
                    height: 20,
                    color: COLORS.lightText
                  }}
                >
                  {showDetails ? 
                    <ExpandLess sx={{ fontSize: '0.8rem' }} /> : 
                    <ExpandMore sx={{ fontSize: '0.8rem' }} />
                  }
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Expanded metadata */}
        <Collapse in={showDetails}>
          <Box sx={{ 
            mt: 1, 
            p: 1, 
            backgroundColor: 'rgba(0,0,0,0.03)',
            borderRadius: 1,
            fontSize: '0.75rem'
          }}>
            {message.metadata && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {/* Sentiment */}
                {message.metadata.sentiment && (
                  <Chip 
                    size="small"
                    icon={<Sentiment sx={{ fontSize: '0.8rem' }} />}
                    label={`Sentyment: ${message.metadata.sentiment}`}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}

                {/* Confidence */}
                {message.metadata.confidence && (
                  <Chip 
                    size="small"
                    icon={<Psychology sx={{ fontSize: '0.8rem' }} />}
                    label={`Pewność: ${Math.round(message.metadata.confidence * 100)}%`}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}

                {/* Advisor used */}
                {message.metadata.advisorUsed && (
                  <Chip 
                    size="small"
                    label={`Doradca: ${message.metadata.advisorUsed}`}
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}

                {/* Fallback indicator */}
                {message.metadata.fallback && (
                  <Chip 
                    size="small"
                    label="Tryb awaryjny"
                    color="warning"
                    sx={{ height: 20, fontSize: '0.65rem' }}
                  />
                )}
              </Box>
            )}

            {/* User sentiment for user messages */}
            {isUser && message.userSentiment && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color={COLORS.lightText}>
                  Analiza sentymentu: {message.userSentiment.sentiment} 
                  ({Math.round(message.userSentiment.confidence * 100)}% pewności)
                </Typography>
              </Box>
            )}

            {/* Error details */}
            {isError && message.error && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="error">
                  Błąd: {message.error}
                </Typography>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Avatar for user messages */}
      {isUser && showAvatar && (
        <Avatar 
          sx={{ 
            width: 32, 
            height: 32, 
            ml: 1,
            backgroundColor: COLORS.secondary,
            fontSize: '0.8rem'
          }}
        >
          👤
        </Avatar>
      )}
    </Box>
  );
};

export default MessageBubble;