'use client';

import React, { useState, useEffect } from 'react';
import { AuthGuard } from '@/app/(app)/internaldashboard/components/AuthGuard';
import { Send, User, Clock, ArrowLeft, Check, CheckCheck, XCircle } from 'lucide-react';

export default function SMSDashboard() {
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [replyText, setReplyText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  // Fetch all unique contacts that have messages
  useEffect(() => {
    async function fetchConversations() {
      try {
        const res = await fetch('/api/telnyx/conversations');
        if (!res.ok) throw new Error('Failed to fetch conversations');
        const { data } = await res.json();

        // Group by contact
        const contactMap = new Map();
        data?.forEach((msg: any) => {
          if (msg.contacts) {
            if (!contactMap.has(msg.contacts.id)) {
              contactMap.set(msg.contacts.id, {
                ...msg.contacts,
                lastMessage: msg.body,
                lastMessageTime: msg.created_at,
              });
            }
          }
        });

        setConversations(Array.from(contactMap.values()));
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversations();
  }, []);

  // Fetch messages for a specific contact
  const selectContact = async (contact: any) => {
    setSelectedContact(contact);
    try {
      const res = await fetch(`/api/telnyx/conversations?contactId=${contact.id}`);
      if (!res.ok) throw new Error('Failed to fetch messages');
      const { data } = await res.json();
      setMessages(data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const sendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedContact) return;

    setIsSending(true);
    try {
      const res = await fetch('/api/telnyx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedContact.phone,
          text: replyText,
          contactId: selectedContact.id
        })
      });

      if (!res.ok) throw new Error('Failed to send');

      // Optimistically add to UI
      setMessages([...messages, {
        id: 'temp-' + Date.now(),
        direction: 'outbound',
        body: replyText,
        created_at: new Date().toISOString()
      }]);
      
      setReplyText('');
    } catch (err) {
      console.error(err);
      alert('Failed to send message.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <AuthGuard isAuthorized={isAuthorized} onAuthenticated={() => setIsAuthorized(true)}>
      <div className="min-h-screen bg-neutral-900 text-white p-6">
        <div className="max-w-6xl mx-auto flex h-[90vh] bg-neutral-800 rounded-xl overflow-hidden border border-neutral-700 shadow-2xl">
          
          {/* Sidebar - Conversations List */}
          <div className={`w-full md:w-1/3 border-r border-neutral-700 flex flex-col ${selectedContact ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-neutral-700 bg-neutral-800">
              <h1 className="text-xl font-black text-sky-400 tracking-tight">SMS Conversations</h1>
            </div>
            
            <div className="overflow-y-auto flex-1 p-2">
              {isLoading ? (
                <div className="p-4 text-neutral-400 text-sm">Loading conversations...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-neutral-500 text-sm">No SMS history found.</div>
              ) : (
                conversations.map(contact => (
                  <button
                    key={contact.id}
                    onClick={() => selectContact(contact)}
                    className={`w-full text-left p-4 mb-2 rounded-lg transition-colors ${
                      selectedContact?.id === contact.id ? 'bg-sky-900/30 border border-sky-700/50' : 'bg-neutral-800 hover:bg-neutral-700'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-semibold truncate">{contact.name || 'Unknown Contact'}</span>
                      {contact.is_opted_out && <span className="text-[10px] bg-red-900 text-red-200 px-2 py-0.5 rounded uppercase font-bold">Opted Out</span>}
                    </div>
                    <div className="text-xs text-neutral-400 mb-2 font-mono">{contact.phone}</div>
                    <div className="text-sm text-neutral-300 truncate opacity-70">{contact.lastMessage}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Main Chat Area */}
          <div className={`flex-1 flex flex-col bg-neutral-900 ${!selectedContact ? 'hidden md:flex' : 'flex'}`}>
            {selectedContact ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-neutral-800 bg-neutral-800/50 flex items-center gap-4">
                  <button onClick={() => setSelectedContact(null)} className="md:hidden text-neutral-400 hover:text-white">
                    <ArrowLeft size={20} />
                  </button>
                  <div>
                    <h2 className="text-lg font-bold">{selectedContact.name}</h2>
                    <p className="text-sm text-neutral-400 font-mono">{selectedContact.phone}</p>
                  </div>
                </div>

                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        msg.direction === 'outbound' 
                          ? 'bg-sky-600 text-white rounded-br-none' 
                          : 'bg-neutral-800 text-neutral-100 rounded-bl-none border border-neutral-700'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm leading-relaxed">{msg.body}</p>
                        <div className={`text-[10px] mt-2 opacity-60 flex items-center gap-1 ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}>
                          <Clock size={10} />
                          {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {msg.direction === 'outbound' && (
                            <span className="ml-1 flex items-center gap-1 font-medium capitalize">
                              •
                              {msg.delivery_status === 'delivered' ? (
                                <><CheckCheck size={12} className="text-green-300" /> {msg.delivery_status}</>
                              ) : msg.delivery_status === 'failed' ? (
                                <><XCircle size={12} className="text-red-300" /> failed</>
                              ) : (
                                <><Check size={12} /> {msg.delivery_status || 'sent'}</>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Reply Input */}
                <div className="p-4 bg-neutral-800 border-t border-neutral-700">
                  {selectedContact.is_opted_out ? (
                    <div className="text-center p-4 bg-red-900/20 text-red-400 rounded-lg text-sm border border-red-900/50">
                      This contact has opted out (STOP). You cannot reply.
                    </div>
                  ) : (
                    <form onSubmit={sendReply} className="flex gap-2 relative">
                      <input
                        type="text"
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Type a manual reply..."
                        disabled={isSending}
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-6 py-4 outline-none focus:border-sky-500 transition-colors disabled:opacity-50"
                      />
                      <button 
                        type="submit" 
                        disabled={isSending || !replyText.trim()}
                        className="absolute right-2 top-2 bottom-2 bg-sky-600 text-white rounded-full px-6 flex items-center justify-center hover:bg-sky-500 transition-colors disabled:opacity-50"
                      >
                        {isSending ? 'Sending...' : <Send size={18} />}
                      </button>
                    </form>
                  )}
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-neutral-500">
                <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                  <User size={32} className="text-neutral-600" />
                </div>
                <p>Select a conversation to view history</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
