'use client';

import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface TelnyxMessage {
  id: string;
  type: 'inbound' | 'outbound';
  from: string;
  to: string;
  text: string;
  timestamp: string;
}

export default function Test20Page() {
  const [messages, setMessages] = useState<TelnyxMessage[]>([]);
  const [selectedNumber, setSelectedNumber] = useState<string>('');
  const [newNumber, setNewNumber] = useState<string>('');
  const [messageText, setMessageText] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchMessages = async () => {
    try {
      const res = await fetch('/api/telnyx/messages');
      const data = await res.json();
      if (data.messages) {
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Failed to fetch messages', error);
    }
  };

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000); // Poll every 3 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, selectedNumber]);

  const uniqueNumbers = Array.from(
    new Set(
      messages.flatMap((m) => {
        // Find numbers that are NOT the Telnyx system number (we want to list the other party)
        return m.type === 'inbound' ? m.from : m.to;
      })
    )
  ).filter(Boolean);

  const handleAddNumber = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNumber.trim()) return;
    let formattedNumber = newNumber.trim();
    if (!formattedNumber.startsWith('+1')) {
      formattedNumber = '+1' + formattedNumber.replace(/\D/g, '');
    }
    setSelectedNumber(formattedNumber);
    setNewNumber('');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNumber || !messageText.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/telnyx/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: selectedNumber, text: messageText.trim() }),
      });

      const data = await res.json();
      if (data.success) {
        setMessageText('');
        fetchMessages();
        toast.success('Message sent');
      } else {
        toast.error(data.error || 'Failed to send message');
      }
    } catch (error) {
      console.error(error);
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const currentConversation = messages
    .filter(
      (m) =>
        (m.type === 'inbound' && m.from === selectedNumber) ||
        (m.type === 'outbound' && m.to === selectedNumber)
    )
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-white overflow-hidden text-black dark:text-white dark:bg-gray-900 border-t dark:border-gray-800">
      {/* Sidebar for numbers */}
      <div className="w-80 border-r dark:border-gray-800 flex flex-col bg-gray-50 dark:bg-gray-950">
        <div className="p-4 border-b dark:border-gray-800">
          <h2 className="text-lg font-semibold mb-4">Conversations</h2>
          <form onSubmit={handleAddNumber} className="flex gap-2">
            <input
              type="text"
              placeholder="+1234567890"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-900 dark:border-gray-700"
            />
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition"
            >
              Add
            </button>
          </form>
        </div>
        <div className="flex-1 overflow-y-auto">
          {uniqueNumbers.length === 0 && (
            <p className="text-sm text-gray-500 p-4 text-center">No conversations yet.</p>
          )}
          {uniqueNumbers.map((num) => (
            <button
              key={num}
              onClick={() => setSelectedNumber(num)}
              className={`w-full text-left px-4 py-3 border-b dark:border-gray-800 hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                selectedNumber === num ? 'bg-gray-200 dark:bg-gray-800 font-semibold' : ''
              }`}
            >
              {num}
            </button>
          ))}
        </div>
      </div>

      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-white dark:bg-gray-900 relative">
        {selectedNumber ? (
          <>
            <div className="px-6 py-4 border-b dark:border-gray-800 flex items-center justify-between bg-white dark:bg-gray-900">
              <h3 className="text-lg font-medium">Chat with {selectedNumber}</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {currentConversation.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-500">
                  No messages yet. Send one to start the conversation!
                </div>
              ) : (
                currentConversation.map((msg) => {
                  const isOutbound = msg.type === 'outbound';
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isOutbound ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                          isOutbound
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-gray-200 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'
                        }`}
                      >
                        <p className="text-sm">{msg.text}</p>
                        <span
                          className={`text-[10px] mt-1 block opacity-70 ${
                            isOutbound ? 'text-right' : 'text-left'
                          }`}
                        >
                          {new Date(msg.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-4 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
              <form onSubmit={handleSendMessage} className="flex gap-3">
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-full border dark:border-gray-700 bg-gray-50 dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={loading || !messageText.trim()}
                  className="bg-blue-600 text-white rounded-full px-6 py-2 font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : 'Send'}
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-gray-900/50">
            Select a conversation or add a new number to start messaging.
          </div>
        )}
      </div>
    </div>
  );
}
