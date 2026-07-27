import React, { useState } from 'react';
import { Bot, Sparkles, Send, Zap, LineChart, ShieldCheck, HelpCircle, FileText } from 'lucide-react';
import { api } from '../services/api';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export const AiAssistantView: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg_1',
      sender: 'ai',
      text: 'Greetings. I am the NEXORUM OS Web3 AI Assistant powered by Gemini 2.5 AI Engine.\n\nHow can I assist your Web3 operations today? Select a prompt template or type your request below.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendPrompt = async (textToSend?: string) => {
    const promptText = textToSend || inputPrompt;
    if (!promptText.trim()) return;

    const userMsg: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputPrompt('');
    setIsTyping(true);

    try {
      const res = await api.queryAiAssistant(promptText, 'Web3 Operations');
      if (res.success && res.reply) {
        const aiMsg: ChatMessage = {
          id: `msg_ai_${Date.now()}`,
          sender: 'ai',
          text: res.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, aiMsg]);
      }
    } catch (err) {
      console.error('AI query error:', err);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Title */}
      <div className="flex items-center justify-between shrink-0">
        <div>
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4 animate-pulse" />
            <span>NEXORUM AI Engine</span>
          </div>
          <h1 className="text-3xl font-black text-white">Web3 AI Assistant</h1>
          <p className="text-slate-400 text-xs mt-1">
            Gemini 2.5 AI Assistant for Portfolio Analysis, Price Prediction, Token Creation, and Security Audits.
          </p>
        </div>
      </div>

      {/* Quick Triggers */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 shrink-0">
        {[
          { label: '📊 Portfolio Analysis', prompt: 'Analyze my multi-chain wallet portfolio and recommend optimization strategies.' },
          { label: '📈 Price Prediction', prompt: 'Generate price prediction and trend forecast for ETH, TON, and Base tokens.' },
          { label: '🪙 Token Creation Help', prompt: 'Guide me step-by-step to launch a BEP20/TON Jetton token with liquidity pools.' },
          { label: '📰 News Summary', prompt: 'Summarize the latest Web3, TON Network, and AI Agent market news.' },
        ].map((t, idx) => (
          <button
            key={idx}
            onClick={() => handleSendPrompt(t.prompt)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-indigo-500/40 text-slate-300 hover:text-indigo-300 text-xs font-bold transition-all text-left truncate"
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Messages Panel */}
      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-3xl p-4 overflow-y-auto space-y-4 shadow-2xl">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'ai' && (
              <div className="w-8 h-8 rounded-xl bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center shrink-0 mt-1">
                <Bot className="w-4 h-4" />
              </div>
            )}

            <div
              className={`max-w-2xl p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                msg.sender === 'user'
                  ? 'bg-cyan-600 text-white rounded-br-none font-medium'
                  : 'bg-slate-950 border border-slate-800 text-slate-200 rounded-bl-none font-sans whitespace-pre-wrap'
              }`}
            >
              <p>{msg.text}</p>
              <span className="text-[10px] opacity-60 font-mono block text-right">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-bold animate-pulse p-2">
            <Bot className="w-4 h-4" />
            <span>Gemini AI is analyzing blockchain data...</span>
          </div>
        )}
      </div>

      {/* Input Box */}
      <div className="shrink-0 flex items-center gap-2">
        <input
          id="input_ai_prompt"
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSendPrompt()}
          placeholder="Ask AI Assistant about portfolio, tokens, gas fees, smart contracts..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono shadow-xl"
        />
        <button
          id="btn_send_ai_prompt"
          onClick={() => handleSendPrompt()}
          disabled={isTyping}
          className="p-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950 transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
