import React, { useState, useRef, useEffect } from 'react';
import { FaRobot, FaTimes, FaPaperPlane, FaLeaf } from 'react-icons/fa';
import api from '../utils/api';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      type: 'bot',
      text: `👋 Hi! I'm your e-Karma Assistant. I can help you with:\n
• Scheduling waste pickups
• Reporting pollution
• Food donations
• General questions\n
How can I help you today?`
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  // Scroll to bottom when messages update
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // Function to call Groq AI backend
  const generateGroqResponse = async (userPrompt) => {
    try {
      const response = await api.post(
        '/api/chatbot/gemini', // Keep route same for frontend compatibility
        {
          prompt: userPrompt,
          history: messages.slice(1)
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        }
      );

      if (response.data && response.data.response) {
        return response.data.response;
      }
      return "I'm sorry, I couldn't process that. Could you try rephrasing?";
    } catch (error) {
      console.error('Chatbot API error:', error);
      if (error.response?.status === 401) {
        return 'Please login to use the AI assistant.';
      }
      return 'I am having trouble connecting to the e-Karma server. Please try again.';
    }
  };

  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = { type: 'user', text: input };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    const botResponse = await generateGroqResponse(currentInput);
    setMessages(prev => [...prev, { type: 'bot', text: botResponse }]);
    setIsTyping(false);
  };

  // Send message on Enter key
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999]">
      {/* Floating Action Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="relative flex items-center justify-center w-16 h-16 bg-gradient-to-tr from-green-500 to-emerald-700 text-white rounded-full shadow-2xl hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:scale-105 transition-all duration-300 group overflow-hidden"
        >
          <div className="absolute inset-0 bg-white/20 blur-md opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <FaRobot size={28} className="relative z-10 animate-pulse group-hover:animate-bounce transition-transform duration-300" />
          <span className="absolute top-0 right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500 border border-white"></span>
          </span>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="animate-fade-in-up w-[380px] sm:w-[420px] h-[600px] max-h-[85vh] flex flex-col rounded-3xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.15)] bg-white/95 backdrop-blur-xl border border-white/40 ring-1 ring-black/5 transform origin-bottom-right transition-all duration-300">

          {/* Header */}
          <div className="bg-gradient-to-r from-emerald-600 via-green-600 to-teal-700 p-5 text-white flex justify-between items-center shadow-md relative z-10">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
            <div className="flex items-center gap-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                <FaLeaf className="text-emerald-100 animate-pulse" size={20} />
              </div>
              <div>
                <h3 className="font-extrabold tracking-wide text-lg leading-tight">e-Karma AI</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-green-300 animate-pulse"></span>
                  <p className="text-xs font-medium text-emerald-100 opacity-90">Online & Ready</p>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="relative z-10 text-white/80 hover:text-white hover:bg-white/20 p-2.5 rounded-full transition-all duration-200 active:scale-95"
            >
              <FaTimes size={18} />
            </button>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-gradient-to-b from-gray-50 to-white/50 scroll-smooth custom-scrollbar">
            <div className="text-center">
              <span className="text-[10px] uppercase font-bold tracking-widest text-gray-400 bg-gray-100/50 px-3 py-1 rounded-full">Today</span>
            </div>

            {messages.map((msg, index) => (
              <div key={index} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'} animate-slide-in-up`}>
                {msg.type === 'bot' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1">
                    <FaRobot size={14} />
                  </div>
                )}
                <div className={`max-w-[75%] px-4 py-3 text-[15px] leading-relaxed shadow-sm relative ${msg.type === 'user'
                  ? 'bg-emerald-600 text-white rounded-[20px] rounded-br-[4px]'
                  : 'bg-white text-gray-700 rounded-[20px] rounded-bl-[4px] border border-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start animate-fade-in">
                <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mr-2 flex-shrink-0 mt-auto mb-1">
                  <FaRobot size={14} />
                </div>
                <div className="bg-white border border-gray-100 px-4 py-3.5 rounded-[20px] rounded-bl-[4px] shadow-sm flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce [animation-delay:0.15s]"></div>
                  <div className="w-2 h-2 bg-emerald-400/80 rounded-full animate-bounce [animation-delay:0.3s]"></div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} className="h-2" />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white/80 backdrop-blur-xl border-t border-gray-100/80">
            <div className="flex items-end gap-2 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Message e-Karma AI..."
                className="flex-1 max-h-32 min-h-[48px] px-4 py-3 bg-gray-50/50 border border-gray-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 outline-none text-sm text-gray-700 transition-all resize-none shadow-inner"
                rows={1}
                style={{ overflow: 'hidden' }}
              />
              <button
                onClick={handleSend}
                disabled={isTyping || !input.trim()}
                className={`flex items-center justify-center w-12 h-12 rounded-2xl transition-all duration-300 ${isTyping || !input.trim()
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 active:scale-95'
                }`}
              >
                <FaPaperPlane size={16} className={`ml-[-2px] ${input.trim() ? 'animate-pulse' : ''}`} />
              </button>
            </div>
            <div className="text-center mt-3">
              <span className="text-[10px] text-gray-400 font-medium">✨ Powered by Groq AI</span>
            </div>
          </div>
        </div>
      )}

      {/* Animations & Custom Scrollbar */}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fade-in-up {0% {opacity: 0; transform: translateY(20px) scale(0.95);} 100% {opacity: 1; transform: translateY(0) scale(1);}}
        @keyframes slide-in-up {0% {opacity: 0; transform: translateY(10px);} 100% {opacity: 1; transform: translateY(0);}}
        .animate-fade-in-up {animation: fade-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;}
        .animate-slide-in-up {animation: slide-in-up 0.3s ease-out forwards;}
        .animate-fade-in {animation: fade-in-up 0.2s ease-out forwards;}
        .custom-scrollbar::-webkit-scrollbar {width: 6px;}
        .custom-scrollbar::-webkit-scrollbar-track {background: transparent;}
        .custom-scrollbar::-webkit-scrollbar-thumb {background-color: rgba(16,185,129,0.2); border-radius: 20px;}
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {background-color: rgba(16,185,129,0.4);}
      `}} />
    </div>
  );
};

export default Chatbot;
