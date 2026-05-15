import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Profile, Message } from '../types';
import { 
  Send, Search, User, ArrowLeft, Loader2, MessageSquare, 
  Image as ImageIcon, Smile, Bell, BellOff, VolumeX, Volume2, 
  MoreVertical, X, Camera, Edit2, Trash2, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '../lib/utils';
import { useParams, useNavigate } from 'react-router-dom';
import LinkifiedText from '../components/LinkifiedText';

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
  
  // New features state
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Load local settings
    const muted = localStorage.getItem(`muted_users_${user.id}`);
    if (muted) setMutedUsers(new Set(JSON.parse(muted)));
    
    const notify = localStorage.getItem(`notifications_enabled_${user.id}`);
    if (notify !== null) setNotificationsEnabled(JSON.parse(notify));
  }, [user.id]);

  useEffect(() => {
    localStorage.setItem(`muted_users_${user.id}`, JSON.stringify(Array.from(mutedUsers)));
  }, [mutedUsers, user.id]);

  useEffect(() => {
    localStorage.setItem(`notifications_enabled_${user.id}`, JSON.stringify(notificationsEnabled));
  }, [notificationsEnabled, user.id]);

  const toggleMute = (userId: string) => {
    setMutedUsers(prev => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  useEffect(() => {
    if (notificationsEnabled && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, [notificationsEnabled]);

  const toggleNotifications = async () => {
    const newState = !notificationsEnabled;
    if (newState && "Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        alert("Please enable notifications in your browser settings to receive alerts.");
        return;
      }
    }
    setNotificationsEnabled(newState);
  };

  const handleNewMessageNotification = (msg: Message) => {
    if (!notificationsEnabled || mutedUsers.has(msg.sender_id) || msg.sender_id === user.id) return;
    
    // Only notify if tab is backgrounded or we are not in the chat with this user
    const shouldNotify = document.visibilityState !== 'visible' || (selectedChat?.id !== msg.sender_id);
    
    if (shouldNotify && "Notification" in window && Notification.permission === "granted") {
      // Try to find the sender's name in the existing conversations
      const senderConv = conversations.find(c => c.userId === msg.sender_id);
      const senderName = senderConv?.profile?.name || senderConv?.profile?.username || "New Message";
      const icon = senderConv?.profile?.avatar_url || "/logo.png";

      new Notification(senderName, {
        body: msg.content,
        icon: icon,
        badge: "/logo.png",
        tag: msg.sender_id // Group by sender
      });
    }
  };

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
        if (msg.receiver_id === user.id || msg.sender_id === user.id) {
          handleNewMessageNotification(msg);
          if (selectedChat && (msg.sender_id === selectedChat.id || msg.receiver_id === selectedChat.id)) {
            setMessages(prev => {
              if (prev.find(m => m.id === msg.id)) return prev;
              return [...prev, msg];
            });
          }
          fetchConversations();
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const msg = payload.new as Message;
        if (msg.receiver_id === user.id || msg.sender_id === user.id) {
          setMessages(prev => prev.map(m => m.id === msg.id ? msg : m));
          if (!msg.reactions || Object.keys(msg.reactions).length === 0) {
            // Check if it was an edit or just reaction change
            fetchConversations();
          }
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        const deletedId = payload.old.id;
        setMessages(prev => prev.filter(m => m.id !== deletedId));
        fetchConversations();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user.id, selectedChat?.id]);

  useEffect(() => {
    if (paramUserId) {
      fetchUserToChat(paramUserId);
      markAsRead(paramUserId);
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
      if (data) {
        setSelectedChat(data);
        markAsRead(id);
      }
    } catch (err) {
      console.error('Error fetching user to chat:', err);
    }
  }

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.id);
      markAsRead(selectedChat.id);
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
      // Get unique users and their unread counts
      const { data, error } = await supabase
        .from('messages')
        .select('sender_id, receiver_id, content, created_at, is_read')
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
            timestamp: msg.created_at,
            unreadCount: 0
          });
        }
        
        // Count unread messages from other user to me
        if (msg.sender_id !== user.id && !msg.is_read) {
          const conv = uniqueConversations.find(c => c.userId === msg.sender_id);
          if (conv) conv.unreadCount++;
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

  async function markAsRead(otherUserId: string) {
    try {
      const { error } = await supabase
        .from('messages')
        .update({ is_read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('is_read', false);
      
      if (error) throw error;
      
      setConversations(prev => prev.map(c => 
        c.userId === otherUserId ? { ...c, unreadCount: 0 } : c
      ));
    } catch (err) {
      console.error('Error marking as read:', err);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedChat) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('photos')
        .getPublicUrl(filePath);

      await sendMessage(null as any, '', publicUrl);
    } catch (err) {
      console.error('Error uploading image:', err);
    } finally {
      setUploadingImage(false);
    }
  }

  async function addReaction(messageId: string, emoji: string) {
    const msg = messages.find(m => m.id === messageId);
    if (!msg) return;

    const reactions = { ...(msg.reactions || {}) };
    if (!reactions[emoji]) reactions[emoji] = [];
    
    if (reactions[emoji].includes(user.id)) {
      reactions[emoji] = reactions[emoji].filter(id => id !== user.id);
      if (reactions[emoji].length === 0) delete reactions[emoji];
    } else {
      reactions[emoji].push(user.id);
    }

    try {
      const { error } = await supabase
        .from('messages')
        .update({ reactions })
        .eq('id', messageId);
      
      if (!error) {
        setMessages(prev => prev.map(m => m.id === messageId ? { ...m, reactions } : m));
      }
    } catch (err) {
      console.error('Error adding reaction:', err);
    }
    setShowEmojiPicker(null);
  }

  async function deleteMessage(messageId: string) {
    if (!confirm('Delete this message for everyone?')) return;
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', messageId)
        .eq('sender_id', user.id);
      
      if (error) throw error;
      setMessages(prev => prev.filter(m => m.id !== messageId));
      fetchConversations();
    } catch (err) {
      console.error('Error deleting message:', err);
      alert('Failed to delete message');
    }
  }

  async function startEditing(msg: Message) {
    setEditingMessageId(msg.id);
    setEditingContent(msg.content);
  }

  async function saveEdit() {
    if (!editingMessageId || !editingContent.trim()) return;
    try {
      const { error } = await supabase
        .from('messages')
        .update({ content: editingContent.trim() })
        .eq('id', editingMessageId)
        .eq('sender_id', user.id);
      
      if (error) throw error;
      setMessages(prev => prev.map(m => m.id === editingMessageId ? { ...m, content: editingContent.trim() } : m));
      setEditingMessageId(null);
      setEditingContent('');
      fetchConversations();
    } catch (err) {
      console.error('Error editing message:', err);
      alert('Failed to edit message');
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

  async function sendMessage(e: React.FormEvent, content?: string, mediaUrl?: string) {
    if (e) e.preventDefault();
    if (!content?.trim() && !newMessage.trim() && !mediaUrl) return;

    const messageContent = content || newMessage.trim() || (mediaUrl ? 'Attachment' : '');
    if (!mediaUrl) setNewMessage('');

    try {
      const messageData = {
        sender_id: user.id as string,
        receiver_id: selectedChat!.id as string,
        content: messageContent,
        media_url: mediaUrl,
        reactions: {}
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
    <div className="fixed inset-0 flex flex-col md:relative md:h-screen md:flex-row bg-white overflow-hidden">
      {/* Sidebar: Conversations */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col bg-white transition-all overflow-hidden",
        selectedChat ? "hidden md:flex" : "flex h-full pb-20 md:pb-0"
      )}>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-black">Messages</h1>
            <button onClick={() => navigate('/feed')} className="p-2 hover:bg-slate-50 rounded-xl transition-all">
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
                      <div className="flex items-center justify-between gap-2">
                        <div className={cn("text-xs truncate", selectedChat?.id === c.userId ? "text-white/60" : "text-slate-400 font-medium")}>
                          {c.lastMessage}
                        </div>
                        {c.unreadCount > 0 && selectedChat?.id !== c.userId && (
                          <div className="min-w-[18px] h-[18px] px-1 bg-emerald-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-lg shadow-emerald-500/20">
                            {c.unreadCount}
                          </div>
                        )}
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
        "flex-1 flex flex-col h-full bg-white transition-all relative overflow-hidden",
        !selectedChat ? "hidden md:flex" : "flex"
      )}>
        {selectedChat ? (
          <>
            <header className="h-20 border-b border-slate-100 bg-white/80 backdrop-blur-xl z-20 flex items-center justify-between px-6 flex-shrink-0">
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

              <div className="flex items-center gap-2">
                 <button 
                   onClick={() => toggleMute(selectedChat.id)}
                   className={cn(
                     "p-3 rounded-2xl transition-all border",
                     mutedUsers.has(selectedChat.id) 
                       ? "bg-rose-50 border-rose-100 text-rose-500" 
                       : "bg-slate-50 border-slate-100 text-slate-400 hover:text-black"
                   )}
                   title={mutedUsers.has(selectedChat.id) ? "Unmute User" : "Mute User"}
                 >
                   {mutedUsers.has(selectedChat.id) ? <VolumeX size={18} /> : <Volume2 size={18} />}
                 </button>
                 <button 
                   onClick={toggleNotifications}
                   className={cn(
                     "p-3 rounded-2xl transition-all border",
                     notificationsEnabled
                       ? "bg-emerald-50 border-emerald-100 text-emerald-500" 
                       : "bg-slate-50 border-slate-100 text-slate-400 hover:text-black"
                   )}
                   title={notificationsEnabled ? "Disable Notifications" : "Enable Notifications"}
                 >
                   {notificationsEnabled ? <Bell size={18} /> : <BellOff size={18} />}
                 </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-slate-50/30 custom-scrollbar">
              {messages.map((msg, i) => {
                const isMe = msg.sender_id === user.id;
                const hasReactions = msg.reactions && Object.keys(msg.reactions).length > 0;
                
                return (
                  <div 
                    key={msg.id} 
                    className={cn(
                      "flex flex-col max-w-[80%] pb-2",
                      isMe ? "ml-auto items-end" : "mr-auto items-start"
                    )}
                  >
                    <motion.div 
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className={cn(
                        "p-4 rounded-[1.5rem] relative group shadow-sm",
                        isMe ? "bg-black text-white rounded-br-none" : "bg-white text-black border border-slate-100 rounded-bl-none"
                      )}
                    >
                      {msg.media_url && (
                        <div className="mb-2 rounded-xl overflow-hidden border border-slate-100/10">
                           <img src={msg.media_url} alt="Attachment" className="max-w-full h-auto max-h-60 object-cover" />
                        </div>
                      )}
                      
                      {editingMessageId === msg.id ? (
                        <div className="space-y-2 min-w-[200px]">
                          <textarea
                            value={editingContent}
                            onChange={(e) => setEditingContent(e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-xl p-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white/20"
                            autoFocus
                          />
                          <div className="flex justify-end gap-2">
                             <button onClick={() => setEditingMessageId(null)} className="px-3 h-7 rounded-lg text-[10px] font-bold uppercase hover:bg-white/10 transition-all text-white/60">Cancel</button>
                             <button onClick={saveEdit} className="px-3 h-7 rounded-lg bg-white text-black text-[10px] font-bold uppercase hover:opacity-90 transition-all">Save</button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm font-medium leading-relaxed break-words">
                          <LinkifiedText text={msg.content} />
                        </p>
                      )}
                      
                      <div className="mt-1 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "text-[9px] font-bold uppercase tracking-widest opacity-40",
                            isMe ? "text-white" : "text-black"
                          )}>
                            {formatDistanceToNow(new Date(msg.created_at), { addSuffix: true })}
                          </span>
                          {isMe && (
                            <div className={cn(
                              "flex items-center ml-1",
                              msg.is_read ? "text-emerald-400" : "text-white/20"
                            )}>
                              <CheckCircle2 size={10} className="fill-current" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <button 
                            onClick={() => setShowEmojiPicker(showEmojiPicker === msg.id ? null : msg.id)}
                            className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Smile size={12} className={isMe ? "text-white" : "text-slate-400"} />
                          </button>
                          
                          {isMe && !editingMessageId && (
                            <>
                              <button 
                                onClick={() => startEditing(msg)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                title="Edit message"
                              >
                                <Edit2 size={12} className="text-white/60 hover:text-white" />
                              </button>
                              <button 
                                onClick={() => deleteMessage(msg.id)}
                                className="p-1 hover:bg-white/10 rounded-lg transition-colors"
                                title="Delete message"
                              >
                                <Trash2 size={12} className="text-white/60 hover:text-red-400" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>

                      {showEmojiPicker === msg.id && (
                        <div className={cn(
                          "absolute top-full mt-2 z-50 bg-white border border-slate-100 p-2 rounded-2xl shadow-2xl flex gap-2 animate-in fade-in zoom-in duration-200",
                          isMe ? "right-0" : "left-0"
                        )}>
                          {['❤️', '😂', '🔥', '👍', '😮', '🙏'].map(emoji => (
                             <button 
                               key={emoji}
                               onClick={() => addReaction(msg.id, emoji)}
                               className="w-8 h-8 flex items-center justify-center hover:bg-slate-50 rounded-xl text-lg transition-colors"
                             >
                               {emoji}
                             </button>
                          ))}
                        </div>
                      )}
                    </motion.div>

                    {hasReactions && (
                      <div className="flex flex-wrap gap-1 mt-1 px-1">
                        {Object.entries(msg.reactions!).map(([emoji, users]) => (
                          <button 
                            key={emoji}
                            onClick={() => addReaction(msg.id, emoji)}
                            className={cn(
                              "bg-white border rounded-full px-2 py-0.5 text-[10px] font-bold flex items-center gap-1 shadow-sm transition-all active:scale-90",
                              (users as string[]).includes(user.id) ? "border-rose-200 bg-rose-50 text-rose-600" : "border-slate-100 hover:border-slate-200"
                            )}
                            title={(users as string[]).includes(user.id) ? "Remove reaction" : "Add reaction"}
                          >
                             <span>{emoji}</span>
                             <span className={cn((users as string[]).includes(user.id) ? "text-rose-400" : "text-slate-400")}>
                               {(users as string[]).length}
                             </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <form onSubmit={sendMessage} className="flex gap-2 items-center max-w-4xl mx-auto">
                <div className="relative flex-1">
                  <input 
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="w-full h-10 bg-slate-50 border border-slate-100 rounded-xl pl-4 pr-10 text-sm font-medium focus:outline-none focus:bg-white focus:border-black/5 transition-all text-black"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center">
                    <label className="p-1.5 text-slate-300 hover:text-black transition-colors cursor-pointer">
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                      />
                      {uploadingImage ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                    </label>
                  </div>
                </div>
                <button 
                  type="submit"
                  disabled={!newMessage.trim() && !uploadingImage}
                  className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-black/10 disabled:opacity-50 disabled:scale-100"
                >
                  <Send size={16} />
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
