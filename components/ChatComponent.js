import React, { useState } from 'react';
import axios from 'axios';
import ChatWindow from './aichat/ChatWindow';

const ChatComponent = ({ currentAdvisor, setChatVisible, COLORS }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    setLoading(true);

    const updatedMessages = [...messages, { role: 'user', content: newMessage }];
    setMessages(updatedMessages);

    try {
      const response = await axios.post('/api/chat', {
        user_id: 'user123', // Replace with actual user ID
        question: newMessage,
        context: {
          chat_history: updatedMessages
        }
      });

      setMessages([...updatedMessages, { role: 'assistant', content: response.data.reply }]);
    } catch (error) {
      console.error('Error sending chat message:', error);
      // Handle error (e.g., show an error message to the user)
    } finally {
      setNewMessage('');
      setLoading(false);
    }
  };

  // Implement these functions based on your speech recognition logic
  const startListening = () => setIsListening(true);
  const stopListening = () => setIsListening(false);

  return (
    <ChatWindow
      currentAdvisor={currentAdvisor}
      chatMessages={messages}
      newMessage={newMessage}
      setNewMessage={setNewMessage}
      isListening={isListening}
      startListening={startListening}
      stopListening={stopListening}
      speechRecognitionSupported={true} // Set this based on browser support
      handleSendMessage={handleSendMessage}
      loading={loading}
      setChatVisible={setChatVisible}
      COLORS={COLORS}
    />
  );
};

export default ChatComponent;