import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Profile } from '../types';
import { Send, Search, User, ArrowLeft, Loader2, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export default function Chat({ user }: { user: any }) {
  const { userId: paramUserId } = useParams();
  const [conversations, setConversations] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Profile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchConversations();
    
    // Subscribe to all changes in messages table where the user is a participant
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'messages'
      }, (payload) => {
        const msg = payload.new as Message;
        // Check if I am the receiver or the sender (relevant for other tabs/devices)
        if (msg.receiver_id === user.id || msg.sender_id === user.id) {
          if (selectedChat && (msg.sender_id === selectedChat.id || msg.receiver_id === selectedChat.id)) {
            setMessages(prev => {
              // Avoid duplicates from optimistic updates
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
          fetchConversations();
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, selectedChat?.id]);

  useEffect(() => {
    if (paramUserId) {
      fetchUserToChat(paramUserId);
    }
  }, [paramUserId]);

  async function fetchUserToChat(id: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      if (data) setSelectedChat(data);
    } catch (err) {
      console.error('Error fetching user to chat:', err);
    }
  }

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  async function fetchConversations() {
    try {
      // Get unique users from messages where user is sender or receiver
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at')
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error("Error fetching messages for conversations:", error);
        return;
      }

      const userIds = new Set();
      const uniqueConversations: any[] = [];

      data.forEach(msg => {
        const otherId = msg.sender_id === user.id ? msg.receiver_id : msg.sender_id;
        if (!userIds.has(otherId)) {
          userIds.add(otherId);
          uniqueConversations.push({
            userId: otherId,
            lastMessage: msg.content,
            timestamp: msg.created_at
          });
        }
      });

      // Fetch profile details for these users
      if (uniqueConversations.length > 0) {
        const { data: profiles, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', uniqueConversations.map(c => c.userId));

        if (profileError) throw profileError;

        const conversationsWithProfiles = uniqueConversations.map(c => ({
          ...c,
          profile: profiles?.find(p => p.id === c.userId)
        })).filter(c => c.profile);

        setConversations(conversationsWithProfiles);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMessages(otherUserId: string) {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) setMessages(data);
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }

  async function searchUsers(term: string) {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .or(`username.ilike.%${term}%,name.ilike.%${term}%`)
        .limit(5);
      
      if (error) throw error;
      if (data) setSearchResults(data);
    } catch (err) {
      console.error('Error searching users:', err);
    } finally {
      setIsSearching(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input early for better UX

    try {
      const messageData = {
        sender_id: user.id as string,
        receiver_id: selectedChat.id as string,
        content: messageContent,
      };

      console.log('Sending message:', messageData);

      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Special hint for schema issues
        const hint = error.message.includes('column') ? '\n\nHint: It seems your database schema is out of sync. Please ensure you have run the updated SQL in the Supabase Dashboard.' : '';
        alert('Failed to send message: ' + error.message + hint);
        setNewMessage(messageContent); // Restore on error
        return;
      }

      if (data) {
        setMessages(prev => {
          if (prev.find(m => m.id === data.id)) return prev;
          return [...prev, data];
        });
        fetchConversations();
      }
    } catch (err: any) {
      console.error('Unexpected error sending message:', err);
      alert('Error: ' + err.message);
      setNewMessage(messageContent);
    }
  }

  return (
    <div className="h-screen flex flex-col md:flex-row bg-white overflow-hidden">
      {/* Sidebar: Conversations */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col h-full bg-white transition-all overflow-hidden",
        selectedChat && "hidden md:flex"
      )}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-black">Messages</h1>
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-slate-50 rounded-xl transition-all md:hidden">
              <ArrowLeft size={20} />
            </button>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
            <input 
              type="text"
              placeholder="Search people..."
              value={searchTerm}
              onChange={(e) => searchUsers(e.target.value)}
              className="w-full h-12 bg-slate-50 border border-slate-100 rounded-2xl pl-12 pr-4 text-sm focus:outline-none focus:bg-white focus:border-black/5 transition-all font-medium"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-24 md:pb-6 space-y-2">
          {searchTerm.length >= 2 ? (
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-widest px-2 mb-4">Search Results</p>
              {isSearching ? (
                <div className="flex justify-center py-4"><Loader2 className="animate-spin text-slate-200" /></div>
              ) : (
                searchResults.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => { setSelectedChat(p); setSearchTerm(''); setSearchResults([]); }}
                    className="w-full p-4 rounded-[1.5rem] flex items-center gap-4 hover:bg-slate-50 transition-all text-left group"
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0">
                      {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-300" />}
                    </div>
                    <div>
                      <div className="font-bold text-black">{p.name || p.username}</div>
                      <div className="text-xs text-slate-400">@{p.username}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-200" /></div>
              ) : conversations.length > 0 ? (
                conversations.map(c => (
                  <button 
                    key={c.userId}
                    onClick={() => setSelectedChat(c.profile)}
                    className={cn(
                      "w-full p-4 rounded-[1.5rem] flex items-center gap-4 transition-all text-left relative",
                      selectedChat?.id === c.userId ? "bg-black text-white" : "hover:bg-slate-50"
                    )}
                  >
                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-100 flex-shrink-0">
                      {c.profile.avatar_url ? <img src={c.profile.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-3 text-slate-300" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center mb-1">
                        <div className={cn("font-bold truncate", selectedChat?.id === c.userId ? "text-white" : "text-black")}>
                          {c.profile.name || c.profile.username}
                        </div>
                        <div className={cn("text-[10px] font-medium", selectedChat?.id === c.userId ? "text-white/40" : "text-slate-300")}>
                          {formatDistanceToNow(new Date(c.timestamp), { addSuffix: false })}
                        </div>
                      </div>
                      <div className={cn("text-xs truncate", selectedChat?.id === c.userId ? "text-white/60" : "text-slate-400 font-medium")}>
                        {c.lastMessage}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center mx-auto text-slate-100">
                    <MessageSquare size={32} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-black font-bold">No messages yet</p>
                    <p className="text-slate-400 text-xs">Start a conversation by searching for a user</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col h-full bg-white transition-all",
        !selectedChat && "hidden md:flex"
      )}>
        {selectedChat ? (
          <>
            <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10 flex items-center justify-between px-6">
              <div className="flex items-center gap-4">
                <button onClick={() => setSelectedChat(null)} className="p-2 hover:bg-slate-50 rounded-xl transition-all md:hidden">
                  <ArrowLeft size={20} />
                </button>
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 border border-slate-100">
                  {selectedChat.avatar_url ? <img src={selectedChat.avatar_url} className="w-full h-full object-cover" /> : <User className="w-full h-full p-2 text-slate-300" />}
                </div>
                <div>
                  <div className="font-bold text-black">{selectedChat.name || selectedChat.username}</div>
                  <div className="text-[10px] uppercase font-bold text-emerald-500 tracking-widest">Active now</div>
                </div>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/30">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    key={msg.id}
                    className={cn(
                      "flex",
                      isMe ? "justify-end" : "justify-start"
                    )}
                  >
                    <div className={cn(
                      "max-w-[75%] px-5 py-3 rounded-[1.5rem] text-sm font-medium shadow-sm",
                      isMe 
                        ? "bg-black text-white rounded-br-none" 
                        : "bg-white text-black border border-slate-100 rounded-bl-none"
                    )}>
                      {msg.content}
                      <div className={cn(
                        "text-[9px] mt-1 font-bold",
                        isMe ? "text-white/40 text-right" : "text-slate-300"
                      )}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
              <form onSubmit={sendMessage} className="flex gap-4">
                <input 
                  type="text"
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1 h-14 bg-slate-50 border border-slate-100 rounded-[1.25rem] px-6 text-sm focus:outline-none focus:bg-white focus:border-black/5 transition-all font-medium"
                />
                <button 
                  type="submit"
                  disabled={!newMessage.trim()}
                  className="w-14 h-14 bg-black text-white rounded-[1.25rem] flex items-center justify-center hover:bg-black/90 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-black/10"
                >
                  <Send size={20} />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center space-y-6 text-slate-100">
            <div className="w-24 h-24 bg-slate-50 rounded-[3rem] flex items-center justify-center shadow-sm">
              <MessageSquare size={48} />
            </div>
            <div className="text-center space-y-1">
              <p className="text-black font-bold text-lg">Your messages</p>
              <p className="text-slate-400 text-sm font-medium">Select a conversation to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
