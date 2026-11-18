import React, { useState, useEffect, useRef } from 'react';
import { Bot, X, Send, Sparkles, Check, ChevronDown, ChevronUp, Layers } from 'lucide-react';
import type { StoreProfile } from './ai/storeProfiler';
import type { GeneratedBlockPreview } from './ai/blockCatalog';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  action?: {
    type: 'APPLY_BLOCK';
    block: GeneratedBlockPreview;
  };
  applied?: boolean;
}

interface AiAssistantModalProps {
  profile: StoreProfile | null;
  onApplyBlock: (html: string, title: string) => void;
  token?: string | null;
}

export default function AiAssistantModal({ profile, onApplyBlock, token }: AiAssistantModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load store-scoped persistent conversation from localStorage on storeId change
  useEffect(() => {
    if (!profile?.storeId) return;
    const storageKey = `orcayo_ai_chat_${profile.storeId}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved chat messages', e);
      }
    } else {
      // Initial greeting tailored to store type
      const initialGreeting: Message = {
        id: 'msg_welcome',
        sender: 'assistant',
        text: `Hello! I'm your dedicated Orcayo AI Design Copilot for **${profile.storeName}**.\n\nI've analyzed your store and detected you specialize in **${profile.detectedNiche}**.\n\nAsk me to design any section, showcase, or experience and I'll generate the right components with live links to your products, appointments, or services.`,
      };
      setMessages([initialGreeting]);
    }
  }, [profile?.storeId]);

  // Persist messages to store-scoped storage
  useEffect(() => {
    if (!profile?.storeId || messages.length === 0) return;
    const storageKey = `orcayo_ai_chat_${profile.storeId}`;
    localStorage.setItem(storageKey, JSON.stringify(messages));
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, profile?.storeId]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || !profile || loading) return;

    const userMsg: Message = {
      id: `msg_${Date.now()}`,
      sender: 'user',
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          storeId: profile.storeId,
          profile,
        }),
      });

      if (!res.ok) throw new Error('Failed to get AI response');
      const data = await res.json();

      const assistantMsg: Message = {
        id: `msg_${Date.now() + 1}`,
        sender: 'assistant',
        text: data.message,
        action: data.action,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg_err_${Date.now()}`,
          sender: 'assistant',
          text: 'Sorry, I encountered an issue analyzing your store. Please try again.',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (msgId: string, html: string, title: string) => {
    onApplyBlock(html, title);
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 9999,
            background: '#111827',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            cursor: 'pointer',
            fontWeight: 600,
            fontSize: '14px',
            transition: 'transform 0.2s ease',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <div style={{ position: 'relative', display: 'flex' }}>
            <Bot size={20} color="#38bdf8" />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-2px',
                width: '8px',
                height: '8px',
                background: '#10b981',
                borderRadius: '50%',
              }}
            />
          </div>
          <span>AI Design Copilot</span>
        </button>
      )}

      {/* Floating Chat Modal */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            width: '420px',
            height: '620px',
            maxHeight: 'calc(100vh - 48px)',
            maxWidth: 'calc(100vw - 48px)',
            background: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0,0,0,0.22)',
            display: 'flex',
            flexDirection: 'column',
            zIndex: 10000,
            overflow: 'hidden',
            border: '1px solid #e2e8f0',
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              background: '#0f172a',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '8px',
                  borderRadius: '8px',
                  display: 'flex',
                }}
              >
                <Bot size={20} color="#38bdf8" />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 600 }}>Orcayo AI Copilot</h3>
                <span
                  style={{
                    fontSize: '11px',
                    color: '#94a3b8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                  {profile?.detectedNiche || 'Store AI'}
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
              }}
            >
              <X size={18} />
            </button>
          </div>

          {/* Quick Prompt Chips */}
          {profile?.suggestedPromptChips && profile.suggestedPromptChips.length > 0 && (
            <div
              style={{
                background: '#f8fafc',
                padding: '8px 12px',
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                gap: '6px',
                overflowX: 'auto',
                whiteSpace: 'nowrap',
              }}
            >
              {profile.suggestedPromptChips.map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(chip)}
                  disabled={loading}
                  style={{
                    fontSize: '11px',
                    padding: '5px 10px',
                    background: '#ffffff',
                    border: '1px solid #cbd5e1',
                    borderRadius: '20px',
                    color: '#334155',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    flexShrink: 0,
                  }}
                >
                  <Sparkles size={11} color="#0284c7" />
                  {chip}
                </button>
              ))}
            </div>
          )}

          {/* Chat Messages Body */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              background: '#f8fafc',
            }}
          >
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    lineHeight: '1.45',
                    background: msg.sender === 'user' ? '#0f172a' : '#ffffff',
                    color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                    border: msg.sender === 'assistant' ? '1px solid #e2e8f0' : 'none',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {msg.text}
                </div>

                {/* Suggestion / Preview Action Card */}
                {msg.action && (
                  <div
                    style={{
                      marginTop: '8px',
                      background: '#ffffff',
                      border: '1px solid #0284c7',
                      borderRadius: '10px',
                      padding: '12px',
                      boxShadow: '0 2px 8px rgba(2, 132, 199, 0.08)',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '13px', color: '#0f172a' }}>{msg.action.block.title}</strong>
                      <span style={{ fontSize: '10px', background: '#e0f2fe', color: '#0369a1', padding: '2px 6px', borderRadius: '4px' }}>
                        {msg.action.block.category}
                      </span>
                    </div>
                    <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
                      {msg.action.block.description}
                    </p>
                    <button
                      onClick={() => handleApply(msg.id, msg.action!.block.html, msg.action!.block.title)}
                      disabled={msg.applied}
                      style={{
                        width: '100%',
                        padding: '8px',
                        background: msg.applied ? '#10b981' : '#0284c7',
                        color: '#ffffff',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: msg.applied ? 'default' : 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      {msg.applied ? (
                        <>
                          <Check size={14} /> Applied to Canvas
                        </>
                      ) : (
                        <>
                          <Layers size={14} /> Apply to Canvas
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div
                style={{
                  alignSelf: 'flex-start',
                  background: '#ffffff',
                  border: '1px solid #e2e8f0',
                  borderRadius: '12px',
                  padding: '10px 14px',
                  fontSize: '12px',
                  color: '#64748b',
                }}
              >
                Thinking & designing components...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div
            style={{
              padding: '10px 12px',
              borderTop: '1px solid #e2e8f0',
              background: '#ffffff',
              display: 'flex',
              gap: '8px',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Ask AI to design a section..."
              disabled={loading}
              style={{
                flex: 1,
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
              style={{
                background: '#0f172a',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                opacity: loading || !input.trim() ? 0.6 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
