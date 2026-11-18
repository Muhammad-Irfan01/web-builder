import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  Sparkles,
  Check,
  Layers,
  History,
  Plus,
  Trash2,
  X,
  ChevronRight,
  MessageSquare,
  Clock,
  ExternalLink,
  Tag,
  RefreshCw,
} from 'lucide-react';
import type { ComponentAnnotation } from './AnnotationPopover';
import type { StoreProfile } from './ai/storeProfiler';
import type { GeneratedBlockPreview } from './ai/blockCatalog';
import type { ChatMessageItem, ConversationSummary } from './ai/agentService.server';

interface AiAgentPanelProps {
  profile: StoreProfile | null;
  onApplyBlock: (html: string, title: string) => void;
  onUpdateElement?: (selector: string, html: string, title: string) => void;
  onGetCanvasContext?: () => { sections: string[]; summary: string };
  token?: string | null;
  projectId?: string;
  isAiMode?: boolean;
  annotations?: ComponentAnnotation[];
  onRemoveAnnotation?: (id: string) => void;
  onClearAnnotations?: () => void;
}

export default function AiAgentPanel({
  profile,
  onApplyBlock,
  onUpdateElement,
  onGetCanvasContext,
  token,
  projectId,
  isAiMode = true,
  annotations = [],
  onRemoveAnnotation,
  onClearAnnotations,
}: AiAgentPanelProps) {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [conversationTitle, setConversationTitle] = useState<string>('Visual Design Session');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const storeId = profile?.storeId || 'cmu1beoa30012sboyhdi6n98t';

  // 1. Fetch historical conversations on mount or storeId change
  const fetchConversations = async () => {
    try {
      const res = await fetch(`/api/builder/conversations?storeId=${encodeURIComponent(storeId)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.conversations && Array.isArray(data.conversations)) {
          setConversations(data.conversations);
          // If no active conversation yet and conversations exist, load the latest one
          if (!activeConversationId && data.conversations.length > 0) {
            loadConversation(data.conversations[0].id);
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load builder conversations', err);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, [storeId]);

  // 2. Load a specific conversation's messages
  const loadConversation = async (convId: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/builder/conversations/${convId}?storeId=${encodeURIComponent(storeId)}`
      );
      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setActiveConversationId(data.conversation.id);
          setConversationTitle(data.conversation.title);
          setMessages(data.conversation.messages || []);
          setShowHistory(false);
        }
      }
    } catch (err) {
      console.error('Failed to load conversation details', err);
      if (onClearAnnotations) onClearAnnotations();
    } finally {
      setLoading(false);
    }
  };

  // 3. Start a brand new conversation
  const handleStartNewChat = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/builder/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeId,
          title: 'New Design Session',
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.conversation) {
          setActiveConversationId(data.conversation.id);
          setConversationTitle(data.conversation.title);
          setMessages([
            {
              id: 'welcome_' + Date.now(),
              sender: 'assistant',
              text: `Hello! I'm your dedicated Orcayo AI Design Agent for **${profile?.storeName || 'your store'}**.

I specialize in creating sections for **${profile?.detectedNiche || 'Custom Store & Services'}**.

What would you like to build on your storefront today?`,
            },
          ]);
          setShowHistory(false);
          await fetchConversations();
        }
      }
    } catch (err) {
      console.error('Failed to start new chat', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Delete a conversation
  const handleDeleteConversation = async (e: React.MouseEvent, convId: string) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this chat history?')) return;
    try {
      const res = await fetch(
        `/api/builder/conversations/${convId}?storeId=${encodeURIComponent(storeId)}`,
        { method: 'DELETE' }
      );
      if (res.ok) {
        setConversations(prev => prev.filter(c => c.id !== convId));
        if (activeConversationId === convId) {
          setActiveConversationId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // 5. Send chat turn
  const handleSend = async (textToSend?: string) => {
    let rawQuery = (textToSend || input).trim();
    if (!rawQuery && annotations.length === 0) return;
    if (loading) return;

    let compiledQuery = rawQuery;
    if (annotations.length > 0) {
      const annotationsBlock = annotations.map((ann, idx) => {
        return [
          '### Target Component #' + (idx + 1) + ': <' + ann.tagName.toLowerCase() + (ann.classes ? ' class="' + ann.classes + '"' : '') + '>',
          '- CSS Selector: ' + ann.selector,
          '- Text Content: "' + ann.textSnippet + '"',
          '- Requested Modification: ' + ann.userNote,
          '- Current Outer HTML:',
          '```html',
          ann.outerHtml,
          '```',
        ].join('\n');
      }).join('\n\n');

      compiledQuery = (rawQuery ? rawQuery + '\n\n' : '') + '### User Requested Changes for Canvas Components:\n' + annotationsBlock;
    }

    const query = compiledQuery;

    const userMsg: ChatMessageItem = {
      id: 'usr_' + Date.now(),
      sender: 'user',
      text: query,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    if (onClearAnnotations) {
      onClearAnnotations();
    }
    setLoading(true);

    try {
      const canvasContext = onGetCanvasContext ? onGetCanvasContext() : undefined;
      const res = await fetch('/api/builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: query,
          storeId,
          conversationId: activeConversationId || undefined,
          canvasContext,
          profile: profile || {
            storeId,
            storeName: 'My Orcayo Store',
            primaryBusiness: 'CUSTOM_SERVICES',
            detectedNiche: 'Custom Studio & Bespoke Creations',
            sampleItems: { products: [], bookings: [], rentals: [] },
            actionableLinks: {
              catalog: '/storefront/products',
              bookings: '/storefront/bookings',
              checkout: '/storefront/checkout',
              cart: '#cart',
            },
          },
        }),
      });

      if (!res.ok) throw new Error('AI Agent service request failed');
      const data = await res.json();

      if (data.conversationId && data.conversationId !== activeConversationId) {
        setActiveConversationId(data.conversationId);
        if (data.conversationTitle) setConversationTitle(data.conversationTitle);
        fetchConversations();
      }

      const assistantMsg: ChatMessageItem = {
        id: data.assistantMessageId || 'ast_' + Date.now(),
        sender: 'assistant',
        text: data.message,
        action: data.action,
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          id: 'err_' + Date.now(),
          sender: 'assistant',
          text: 'I ran into an issue processing that design instruction. Please try again or rephrase your request.',
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

  const handleUpdate = (msgId: string, selector: string, html: string, title: string) => {
    if (onUpdateElement) {
      onUpdateElement(selector, html, title);
    } else {
      onApplyBlock(html, title);
    }
    setMessages(prev =>
      prev.map(m => (m.id === msgId ? { ...m, applied: true } : m))
    );
  };

  return (
    <aside className="ai-agent-panel">
      {/* Top Header */}
      <div className="ai-agent-header">
        <div className="agent-identity">
          <div className="agent-avatar">
            <Bot size={20} color="#38bdf8" />
            <span className="online-indicator" />
          </div>
          <div className="agent-title-box">
            <div className="agent-name-row">
              <h3>Orcayo Design Copilot</h3>
              <span className="ai-badge">AI Agent</span>
            </div>
            <p className="agent-niche-tag">
              {profile?.detectedNiche || 'Bespoke Studio & Services'}
            </p>
          </div>
        </div>

        <div className="agent-header-actions">
          <button
            className={`header-icon-btn ${showHistory ? 'active' : ''}`}
            title="Chat History"
            onClick={() => setShowHistory(prev => !prev)}
          >
            <History size={16} />
            <span className="history-count">{conversations.length}</span>
          </button>

          <button
            className="header-icon-btn"
            title="Start New Chat"
            onClick={handleStartNewChat}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Historical Chats Drawer */}
      {showHistory && (
        <div className="ai-history-drawer">
          <div className="history-drawer-header">
            <h4>Saved Conversations</h4>
            <button className="close-history-btn" onClick={() => setShowHistory(false)}>
              <X size={15} />
            </button>
          </div>

          <div className="history-list">
            {conversations.length === 0 ? (
              <div className="history-empty">
                <Clock size={20} />
                <p>No past chat sessions yet. Send a prompt to create your first one!</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`history-item ${activeConversationId === conv.id ? 'active' : ''}`}
                  onClick={() => loadConversation(conv.id)}
                >
                  <div className="history-item-content">
                    <div className="history-item-title-row">
                      <MessageSquare size={14} className="conv-icon" />
                      <span className="conv-title">{conv.title}</span>
                    </div>
                    {conv.lastMessage && (
                      <p className="conv-last-msg">{conv.lastMessage}</p>
                    )}
                    <span className="conv-date">
                      {new Date(conv.startedAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <button
                    className="delete-conv-btn"
                    title="Delete Conversation"
                    onClick={e => handleDeleteConversation(e, conv.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Suggestion Chips */}
      {profile?.suggestedPromptChips && profile.suggestedPromptChips.length > 0 && (
        <div className="ai-chips-bar">
          {profile.suggestedPromptChips.map((chip, idx) => (
            <button
              key={idx}
              className="ai-chip"
              onClick={() => handleSend(chip)}
              disabled={loading}
            >
              <Sparkles size={11} color="#0284c7" />
              <span>{chip}</span>
            </button>
          ))}
        </div>
      )}

      {/* Messages Stream */}
      <div className="ai-messages-container">
        {messages.length === 0 && !loading && (
          <div className="ai-welcome-placeholder">
            <div className="welcome-icon-wrap">
              <Bot size={28} color="#0284c7" />
            </div>
            <h4>Welcome to AI Mode</h4>
            <p className="welcome-subtext">
              I analyze what your store sells and generate tailored visual sections. Click an idea or type below:
            </p>
            <div className="welcome-quick-actions">
              {(profile?.suggestedPromptChips && profile.suggestedPromptChips.length > 0
                ? profile.suggestedPromptChips
                : [
                    'Design custom cake flavor & size inquiry section',
                    'Add a portfolio gallery with customer reviews',
                    'Add direct WhatsApp consultation & order button',
                    'Add appointment booking calendar slots',
                  ]
              ).map((prompt, i) => (
                <button
                  key={i}
                  className="welcome-action-card-btn"
                  onClick={() => handleSend(prompt)}
                  disabled={loading}
                >
                  <Sparkles size={13} color="#0284c7" className="flex-shrink-0" />
                  <span>{prompt}</span>
                  <ChevronRight size={13} className="welcome-chevron" />
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map(msg => (
          <div
            key={msg.id}
            className={`ai-message-row ${msg.sender === 'user' ? 'user-row' : 'assistant-row'}`}
          >
            <div className={`ai-message-bubble ${msg.sender === 'user' ? 'user-bubble' : 'assistant-bubble'}`}>
              {msg.text}
            </div>

            {/* Design Action Card */}
            {msg.action && (
              <div className="ai-action-card">
                <div className="action-card-header">
                  <div className="action-card-title">
                    <strong>{msg.action.title || (msg.action as any).block?.title}</strong>
                    <span className="action-category-tag">{msg.action.type === 'UPDATE_ELEMENT' ? 'In-Place Canvas Update' : ((msg.action as any).block?.category || 'Block')}</span>
                  </div>
                </div>

                <p className="action-description">{msg.action.description || (msg.action as any).block?.description}</p>

                {msg.action.type === 'UPDATE_ELEMENT' ? (
                  <button
                    className={`action-apply-btn ${msg.applied ? 'applied' : ''}`}
                    onClick={() => handleUpdate(msg.id, (msg.action as any).selector!, (msg.action as any).html!, (msg.action as any).title!)}
                    disabled={msg.applied}
                  >
                    {msg.applied ? (
                      <>
                        <Check size={14} />
                        <span>Updated on Canvas</span>
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} />
                        <span>Update Section on Canvas</span>
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    className={`action-apply-btn ${msg.applied ? 'applied' : ''}`}
                    onClick={() => handleApply(msg.id, (msg.action as any).block?.html || (msg.action as any).html, (msg.action as any).block?.title || (msg.action as any).title)}
                    disabled={msg.applied}
                  >
                    {msg.applied ? (
                      <>
                        <Check size={14} />
                        <span>Inserted into Canvas</span>
                      </>
                    ) : (
                      <>
                        <Layers size={14} />
                        <span>Insert into Canvas</span>
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="ai-message-row assistant-row">
            <div className="ai-message-bubble assistant-bubble typing-bubble">
              <div className="typing-dots">
                <span />
                <span />
                <span />
              </div>
              <span className="typing-label">Analyzing store and synthesizing design...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Attached Component Annotations */}
      {annotations.length > 0 && (
        <div className="ai-annotations-tray">
          <div className="tray-label">
            <Tag size={12} />
            <span>Annotated Elements ({annotations.length})</span>
          </div>
          <div className="tray-chips-scroll">
            {annotations.map((ann) => (
              <div key={ann.id} className="annotation-chip" title={ann.userNote}>
                <span className="chip-tag">&lt;{ann.tagName.toLowerCase()}&gt;</span>
                <span className="chip-note">{ann.userNote}</span>
                {onRemoveAnnotation && (
                  <button
                    className="chip-remove"
                    onClick={() => onRemoveAnnotation(ann.id)}
                    title="Remove annotation"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Input Form */}
      <div className="ai-input-wrapper">
        <input
          type="text"
          className="ai-prompt-input"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Ask AI to design a section, add products, or build forms..."
          disabled={loading}
        />
        <button
          className="ai-send-btn"
          onClick={() => handleSend()}
          disabled={loading || !input.trim()}
          title="Send to AI Agent"
        >
          <Send size={15} />
        </button>
      </div>
    </aside>
  );
}

