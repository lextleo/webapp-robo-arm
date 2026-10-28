import React, { useState, useRef, useEffect } from 'react';
import { Bot, Sparkles, Send, Mic, MicOff, Check, ChevronDown, CheckCircle2 } from 'lucide-react';
import type { ChatMessage } from '../types';

interface AiAssistantCardProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  onConfirmPlan: (planId: string) => void;
  onCancelPlan: (planId: string) => void;
  isLoading: boolean;
}

export const AiAssistantCard: React.FC<AiAssistantCardProps> = ({
  messages,
  onSendMessage,
  onConfirmPlan,
  onCancelPlan,
  isLoading,
}) => {
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Web Speech API Voice Input
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const quickActions = [
    { label: 'Pick and place', icon: '✦', prompt: 'Pick up the yellow cube and place it on the right side.' },
    { label: 'Move forward', icon: '◎', prompt: 'Move forward safely.' },
    { label: 'Open gripper', icon: '◌', prompt: 'Open gripper.' },
    { label: 'Close gripper', icon: '◎', prompt: 'Close gripper.' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/90 flex flex-col h-[520px] transition-all">
      {/* 1. Card Header */}
      <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#D62828] text-white flex items-center justify-center shadow-sm shadow-red-500/20">
            <Bot size={18} />
          </div>
          <h2 className="text-base font-bold text-slate-800 tracking-tight">AI Assistant</h2>
          <span className="px-2 py-0.5 rounded-full bg-red-100/70 text-[#D62828] font-bold text-[10px] tracking-wide">
            Beta
          </span>
        </div>

        {/* Language Dropdown */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 cursor-pointer">
          <span className="text-sm">🇬🇧</span>
          <span>English</span>
          <ChevronDown size={14} className="text-slate-400" />
        </div>
      </div>

      {/* 2. Conversational Planner Message Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className="flex flex-col">
            {msg.sender === 'user' ? (
              /* User Bubble: Soft Pink/Red Tint on Right */
              <div className="flex items-end justify-end gap-2 self-end max-w-[85%]">
                <div className="flex flex-col items-end">
                  <div className="bg-[#FFF1F2] border border-rose-200/80 text-slate-800 text-xs px-3.5 py-2.5 rounded-2xl rounded-tr-xs shadow-2xs leading-relaxed">
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 mr-1">{msg.timestamp}</span>
                </div>
                <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                  S
                </div>
              </div>
            ) : (
              /* Assistant Bubble: Left Aligned with Robot Avatar */
              <div className="flex items-start gap-2.5 max-w-[92%]">
                <div className="w-7 h-7 rounded-lg bg-[#D62828] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <Bot size={15} />
                </div>

                <div className="flex flex-col flex-1">
                  <div className="bg-slate-50/90 border border-slate-100 text-slate-800 text-xs p-3.5 rounded-2xl rounded-tl-xs shadow-2xs space-y-3">
                    <p className="leading-relaxed font-medium text-slate-700">{msg.text}</p>

                    {/* Numbered Execution Plan */}
                    {msg.plan && (
                      <div className="space-y-2 pt-1 border-t border-slate-200/60">
                        {msg.plan.steps.map((step) => (
                          <div key={step.id} className="flex items-start gap-2.5">
                            {/* Circular Step Badge 1..5 */}
                            <div
                              className={`w-4.5 h-4.5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 transition-colors ${
                                step.completed
                                  ? 'bg-emerald-500 text-white'
                                  : 'bg-[#D62828] text-white'
                              }`}
                            >
                              {step.completed ? <Check size={10} className="stroke-[3]" /> : step.id}
                            </div>
                            <span
                              className={`text-xs leading-tight transition-colors ${
                                step.completed ? 'text-emerald-700 font-medium' : 'text-slate-700'
                              }`}
                            >
                              {step.description}
                            </span>
                          </div>
                        ))}

                        {/* Confirmation Gate Prompt & Buttons */}
                        {msg.awaiting_confirmation && msg.plan.status === 'AWAITING_CONFIRMATION' && (
                          <div className="pt-3 border-t border-slate-200/60">
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-xs font-semibold text-slate-800">
                                Shall I proceed with the task?
                              </span>
                              <span className="text-[10px] text-slate-400">{msg.timestamp}</span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => onConfirmPlan(msg.plan!.plan_id)}
                                className="px-4 py-1.5 rounded-lg bg-[#D62828] hover:bg-red-700 text-white font-semibold text-xs shadow-xs transition-colors cursor-pointer"
                              >
                                Yes, proceed
                              </button>
                              <button
                                onClick={() => onCancelPlan(msg.plan!.plan_id)}
                                className="px-4 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {msg.plan.status === 'IN_PROGRESS' && (
                          <div className="pt-2 text-[11px] font-semibold text-[#D62828] flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-[#D62828] animate-ping"></span>
                            <span>Executing robot trajectory...</span>
                          </div>
                        )}

                        {msg.plan.status === 'COMPLETED' && (
                          <div className="pt-2 text-[11px] font-semibold text-emerald-600 flex items-center gap-1.5">
                            <CheckCircle2 size={14} />
                            <span>Execution plan successfully verified and completed.</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 ml-1">{msg.timestamp}</span>
                </div>
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-slate-400 italic py-1">
            <Sparkles size={14} className="text-[#D62828] animate-spin" />
            <span>AVEON planner is thinking...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Chat Input Bar & Voice Mic */}
      <div className="p-3 border-t border-slate-100 bg-white">
        <form onSubmit={handleSend} className="relative flex items-center mb-2.5">
          <div className="absolute left-3 text-[#D62828] pointer-events-none">
            <Sparkles size={16} />
          </div>

          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type your message..."
            className="w-full pl-9 pr-20 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-red-500 focus:bg-white transition-all shadow-2xs"
          />

          <div className="absolute right-1.5 flex items-center gap-1">
            <button
              type="submit"
              disabled={!inputText.trim() || isLoading}
              className="w-7 h-7 rounded-lg bg-[#D62828] hover:bg-red-700 disabled:opacity-40 text-white flex items-center justify-center transition-colors cursor-pointer"
              title="Send Message"
            >
              <Send size={13} className="ml-0.5" />
            </button>

            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                isListening
                  ? 'bg-red-100 text-[#D62828] animate-pulse'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title={isListening ? 'Stop Listening' : 'Voice Input (Speech-to-Text)'}
            >
              {isListening ? <MicOff size={14} /> : <Mic size={14} />}
            </button>
          </div>
        </form>

        {/* 4. Quick Action Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {quickActions.map((qa, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSendMessage(qa.prompt)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full border border-slate-200 bg-slate-50/60 hover:bg-red-50 hover:border-red-200 text-[11px] font-medium text-slate-600 hover:text-[#D62828] whitespace-nowrap transition-all cursor-pointer shadow-2xs"
            >
              <span className="text-[#D62828] text-xs leading-none">{qa.icon}</span>
              <span>{qa.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
