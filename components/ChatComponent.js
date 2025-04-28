import React, { useState } from 'react';
import axios from 'axios';

/**
 * ChatComponent: A chat interface that connects to the /api/ai endpoint.
 * It handles sending user messages, displays responses and errors, and shows a loading state.
 */
const ChatComponent = () => {
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const sendMessage = async () => {
    if (!userInput.trim()) return; // Avoid sending empty messages
    setLoading(true);
    setError(null);

    // Append the user message to conversation immediately
    const newMessages = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);

    try {
      const response = await axios.post('/api/ai', {
        messages: newMessages
      }, {
        timeout: 30000
      });

      // Handle the AI response
      const aiReply = response.data.data;
      
      // Append the AI response to messages
      setMessages([...newMessages, { role: 'assistant', content: aiReply }]);
    } catch (err) {
      console.error('Error sending chat message:', err);
      setError(err.response?.data?.error || 'Error sending message. Please try again.');
    } finally {
      setUserInput('');
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-md shadow-md bg-white">
      <h2 className="text-xl font-bold mb-4">Chat with AI</h2>
      
      <div className="mb-4 h-64 overflow-y-auto p-2 border rounded">
        {messages.map((msg, index) => (
          <div key={index} className={msg.role === "assistant" ? "text-blue-600 mb-2" : "text-gray-800 mb-2"}>
            <strong>{msg.role}: </strong>
            <span>{msg.content}</span>
          </div>
        ))}
        {loading && <div className="text-gray-500 italic">AI is thinking...</div>}
      </div>
      
      {error && (
        <div className="mb-2 text-red-600">
          {error}
          <button onClick={() => setError(null)} className="ml-2 font-bold hover:text-red-800">
            ✕
          </button>
        </div>
      )}
      
      <div className="flex gap-2">
        <input
          type="text"
          value={userInput}
          onChange={(e) => setUserInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Type your message..."
          className="flex-1 p-2 border rounded"
          disabled={loading}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send"}
        </button>
      </div>
    </div>
  );
};

export default ChatComponent;
