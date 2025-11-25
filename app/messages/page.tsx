'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { Send, User, Clock, Circle, Mic } from 'lucide-react';
import Image from 'next/image';
import { formatDate } from '@/lib/utils';
import { useLocale } from '@/contexts/LocaleContext';
import { t } from '@/lib/i18n';
import toast from 'react-hot-toast';
import Link from 'next/link';
import SellerRating from '@/components/SellerRating';
import VoiceRecorder from '@/components/VoiceRecorder';
import VoiceMessagePlayer from '@/components/VoiceMessagePlayer';

interface Message {
  id: string;
  text: string;
  read: boolean;
  createdAt: string;
  fromUserId: string;
  fromUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  toUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  ad?: {
    id: string;
    title: string;
    slug: string;
    images: Array<{ url: string }>;
  };
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string | null;
    email: string | null;
    image: string | null;
  };
  text: string;
  createdAt: string;
  unreadCount: number;
  ad?: {
    id: string;
    title: string;
    slug: string;
    images: Array<{ url: string }>;
  };
}

export default function MessagesPage() {
  const { data: session } = useSession();
  const { locale } = useLocale();
  const searchParams = useSearchParams();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(
    searchParams.get('userId') || null
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageText, setMessageText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [newUserInfo, setNewUserInfo] = useState<any>(null);
  const [otherUserTyping, setOtherUserTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session?.user) {
      loadConversations();
      const userIdFromUrl = searchParams.get('userId');
      if (userIdFromUrl) {
        setSelectedConversation(userIdFromUrl);
      }
    }
  }, [session, searchParams, loadConversations]);

  useEffect(() => {
    if (selectedConversation) {
      loadMessages(selectedConversation);
      checkTypingStatus(selectedConversation);
      // Auto-refresh messages every 3 seconds
      const interval = setInterval(() => {
        loadMessages(selectedConversation);
        checkTypingStatus(selectedConversation);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [selectedConversation]);

  // Removed auto-scroll - user can scroll manually


  const loadConversations = useCallback(async () => {
    try {
      const response = await fetch('/api/messages');
      if (response.ok) {
        const data = await response.json();
        setConversations(data);
        if (data.length > 0 && !selectedConversation) {
          setSelectedConversation(data[0].otherUser.id);
        }
      }
    } catch (error) {
      toast.error('Не удалось загрузить диалоги');
    } finally {
      setLoading(false);
    }
  }, [selectedConversation]);

  const loadMessages = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages?withUserId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        // Messages are automatically marked as read in the API
      }
    } catch (error) {
      toast.error('Не удалось загрузить сообщения');
    }
  };

  const checkTypingStatus = async (userId: string) => {
    try {
      const response = await fetch(`/api/messages/typing?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setOtherUserTyping(data.isTyping);
      }
    } catch (error) {
      // Silent fail for typing status
    }
  };

  const sendMessage = async (audioUrl?: string) => {
    if ((!messageText.trim() && !audioUrl) || !selectedConversation) return;

    setSending(true);

    try {
      const response = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: selectedConversation,
          text: messageText.trim() || '',
          audioUrl: audioUrl,
        }),
      });

      if (response.ok) {
        setMessageText('');
        setShowVoiceRecorder(false);
        if (typingTimeout) {
          clearTimeout(typingTimeout);
          setTypingTimeout(null);
        }
        await loadMessages(selectedConversation);
        await loadConversations();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Не удалось отправить сообщение');
      }
    } catch (error: any) {
      toast.error(error.message || 'Не удалось отправить сообщение');
    } finally {
      setSending(false);
    }
  };

  const handleVoiceRecordingComplete = async (audioUrl: string) => {
    await sendMessage(audioUrl);
  };

  const parseAudioUrl = (text: string): string | null => {
    const match = text.match(/\[AUDIO:(.+?)\]/);
    return match ? match[1] : null;
  };

  const getMessageText = (text: string): string => {
    return text.replace(/\[AUDIO:.+?\]/, '').trim();
  };

  const handleTyping = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
    
    if (!selectedConversation) return;

    // Clear existing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    // Send typing event to server
    if (e.target.value.trim().length > 0) {
      try {
        await fetch('/api/messages/typing', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            toUserId: selectedConversation,
          }),
        });
      } catch (error) {
        // Silent fail
      }
    }

    // Stop sending typing events after 2 seconds of inactivity
    const timeout = setTimeout(() => {
      // Typing status will expire in Redis automatically
    }, 2000);

    setTypingTimeout(timeout);
  };

  // Get or create selected user info
  const selectedUserFromConversations = conversations.find(c => c.otherUser.id === selectedConversation)?.otherUser;
  
  // If user not in conversations (new conversation), fetch user info
  useEffect(() => {
    if (selectedConversation && !selectedUserFromConversations && session?.user) {
      fetch(`/api/users/${selectedConversation}`)
        .then(res => res.json())
        .then(data => {
          if (data && !data.error) {
            setNewUserInfo(data);
          }
        })
        .catch(() => {
          // User might not exist or not accessible
        });
    } else if (!selectedConversation || selectedUserFromConversations) {
      setNewUserInfo(null);
    }
  }, [selectedConversation, selectedUserFromConversations, session]);

  const selectedUser = selectedUserFromConversations || newUserInfo;

  if (!session?.user) {
    return (
      <div className="container-custom py-8 text-center">
        <p className="text-neutral-400">Войдите, чтобы просматривать сообщения</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container-custom py-8 text-center">
        <p className="text-neutral-400">Загрузка...</p>
      </div>
    );
  }

  return (
    <div className="container-custom py-8 h-[calc(100vh-8rem)]">
      <div className="flex gap-4 h-full">
        {/* Conversations List */}
        <div className="w-[350px] flex-shrink-0 rounded-[32px] border border-neutral-900 bg-[#080c16] flex flex-col overflow-hidden shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
          <div className="p-6 border-b border-neutral-900">
            <h2 className="text-xl font-semibold text-white">Сообщения</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            {conversations.length > 0 ? (
              conversations.map((conv) => (
                <button
                  key={conv.id}
                  onClick={() => setSelectedConversation(conv.otherUser.id)}
                  className={`w-full p-4 text-left transition-all ${
                    selectedConversation === conv.otherUser.id
                      ? 'bg-primary-500/10 border-l-2 border-primary-500'
                      : 'hover:bg-dark-bg2 border-l-2 border-transparent'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    {conv.otherUser.image ? (
                      <div className="relative">
                        <a 
                          href={`/profile?userId=${conv.otherUser.id}`}
                          className="block hover:opacity-80 transition-opacity"
                          title="Открыть профиль пользователя"
                        >
                          <Image
                            src={conv.otherUser.image}
                            alt={conv.otherUser.name || 'User'}
                            width={48}
                            height={48}
                            className="rounded-full object-cover cursor-pointer"
                            unoptimized={conv.otherUser.image?.includes('googleusercontent.com')}
                          />
                        </a>
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="relative w-12 h-12 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/30">
                        <User className="h-6 w-6 text-primary-300" />
                        {conv.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-red-500 rounded-full">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                          </span>
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-white truncate">
                        {conv.otherUser.name || conv.otherUser.email}
                      </p>
                      <p className="text-sm text-neutral-400 truncate mt-1 flex items-center gap-1">
                        {parseAudioUrl(conv.text) ? (
                          <>
                            <Mic className="h-3 w-3 flex-shrink-0" />
                            <span>Голосовое сообщение</span>
                          </>
                        ) : (
                          getMessageText(conv.text) || 'Нет сообщений'
                        )}
                      </p>
                      <p className="text-xs text-neutral-500 mt-1 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {new Date(conv.createdAt).toLocaleDateString('ru-RU', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            ) : (
              <div className="p-8 text-center text-neutral-500">
                <p>Нет диалогов</p>
              </div>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col overflow-hidden rounded-[32px] border border-neutral-900 bg-[#0b101c] shadow-[0_20px_45px_rgba(0,0,0,0.45)]">
          {selectedConversation && selectedUser ? (
            <>
              <div className="p-4 border-b border-neutral-900 bg-[#080c16] flex items-center space-x-3">
                {selectedUser?.image ? (
                  <Image
                    src={selectedUser.image}
                    alt={selectedUser?.name || 'User'}
                    width={40}
                    height={40}
                    className="rounded-full object-cover"
                    unoptimized={selectedUser.image?.includes('googleusercontent.com')}
                  />
                ) : (
                  <div className="w-10 h-10 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/30">
                    <User className="h-5 w-5 text-primary-300" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-white">{selectedUser?.name || selectedUser?.email || 'User'}</p>
                  {selectedUser?.id && (
                    <div className="mt-1">
                      <SellerRating userId={selectedUser.id} size={16} showNumber={false} showCount />
                    </div>
                  )}
                </div>
              </div>

              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-[#0b101c] to-[#080c16]">
                {messages.length > 0 ? (
                  <>
                    {messages.map((msg) => {
                      const isOwn = msg.fromUserId === session.user.id;
                      const showAvatar = !isOwn;
                      const showTime = true;
                      
                      return (
                        <div
                          key={msg.id}
                          className={`flex items-end gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          {showAvatar && (
                            <div className="flex-shrink-0">
                              <a 
                                href={`/profile?userId=${msg.fromUser.id}`}
                                className="block hover:opacity-80 transition-opacity"
                                title="Открыть профиль пользователя"
                              >
                                {msg.fromUser.image ? (
                                  <Image
                                    src={msg.fromUser.image}
                                    alt={msg.fromUser.name || 'User'}
                                    width={32}
                                    height={32}
                                    className="rounded-full object-cover cursor-pointer"
                                    unoptimized={msg.fromUser.image?.includes('googleusercontent.com')}
                                  />
                                ) : (
                                  <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/30 cursor-pointer">
                                    <User className="h-4 w-4 text-primary-300" />
                                  </div>
                                )}
                              </a>
                            </div>
                          )}
                          <div className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'} max-w-[70%]`}>
                            {msg.ad && (
                              <Link
                                href={`/ads/${msg.ad.slug}-${msg.ad.id}`}
                                className="mb-2 p-3 rounded-2xl bg-neutral-900/50 border border-neutral-800 hover:bg-neutral-900 transition group"
                              >
                                <div className="flex items-center space-x-3">
                                  {msg.ad.images[0] && (
                                    <Image
                                      src={msg.ad.images[0].url}
                                      alt={msg.ad.title}
                                      width={48}
                                      height={48}
                                      className="rounded-xl object-cover"
                                    />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-white truncate group-hover:text-primary-300 transition">
                                      {msg.ad.title}
                                    </p>
                                    <p className="text-xs text-neutral-400 mt-1">Объявление</p>
                                  </div>
                                </div>
                              </Link>
                            )}
                            <div
                              className={`px-4 py-2.5 rounded-2xl ${
                                isOwn
                                  ? 'bg-primary-500 text-white rounded-br-md'
                                  : 'bg-neutral-900 text-neutral-100 rounded-bl-md border border-neutral-800'
                              }`}
                            >
                              {(() => {
                                const audioUrl = parseAudioUrl(msg.text);
                                const messageText = getMessageText(msg.text);
                                
                                return (
                                  <>
                                    {audioUrl && (
                                      <div className="mb-2">
                                        <VoiceMessagePlayer audioUrl={audioUrl} isOwn={isOwn} />
                                      </div>
                                    )}
                                    {messageText && (
                                      <p className="text-sm whitespace-pre-wrap break-words">{messageText}</p>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                            {showTime && (
                              <p className={`text-xs mt-1 px-2 ${isOwn ? 'text-neutral-400' : 'text-neutral-500'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('ru-RU', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            )}
                          </div>
                          {!showAvatar && isOwn && <div className="w-8" />}
                        </div>
                      );
                    })}
                    {/* Typing indicator - показывается когда печатает собеседник */}
                    {otherUserTyping && (
                      <div className="flex items-end gap-2 justify-start">
                        {selectedUser?.image ? (
                          <Image
                            src={selectedUser.image}
                            alt={selectedUser?.name || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full object-cover"
                            unoptimized={selectedUser.image?.includes('googleusercontent.com')}
                          />
                        ) : (
                          <div className="w-8 h-8 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-full flex items-center justify-center border border-primary-500/30">
                            <User className="h-4 w-4 text-primary-300" />
                          </div>
                        )}
                        <div className="px-4 py-2.5 rounded-2xl rounded-bl-md bg-neutral-900 border border-neutral-800">
                          <div className="flex gap-1.5">
                            <Circle className="h-2 w-2 fill-neutral-400 animate-pulse" style={{ animationDelay: '0ms' }} />
                            <Circle className="h-2 w-2 fill-neutral-400 animate-pulse" style={{ animationDelay: '150ms' }} />
                            <Circle className="h-2 w-2 fill-neutral-400 animate-pulse" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="text-center text-neutral-400 py-12">
                    <p>Нет сообщений. Начните диалог!</p>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-neutral-900 bg-[#080c16] space-y-3">
                {showVoiceRecorder ? (
                  <VoiceRecorder
                    onRecordingComplete={handleVoiceRecordingComplete}
                    onCancel={() => setShowVoiceRecorder(false)}
                  />
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      sendMessage();
                    }}
                    className="flex items-center gap-3"
                  >
                    <button
                      type="button"
                      onClick={() => setShowVoiceRecorder(true)}
                      className="flex-shrink-0 rounded-2xl border border-neutral-800 bg-[#0b101c] p-3 text-neutral-400 transition hover:border-primary-500 hover:text-primary-500"
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                    <input
                      type="text"
                      value={messageText}
                      onChange={handleTyping}
                      placeholder="Написать сообщение..."
                      className="flex-1 rounded-2xl border border-neutral-800 bg-[#0b101c] px-4 py-3 text-white placeholder:text-neutral-500 focus:border-primary-500 focus:outline-none transition"
                      disabled={sending}
                    />
                    <button
                      type="submit"
                      disabled={sending || !messageText.trim()}
                      className="rounded-2xl bg-primary-500 p-3 text-white transition hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      <Send className="h-5 w-5" />
                    </button>
                  </form>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-neutral-400">
              <div className="text-center">
                <p className="text-lg mb-2">Выберите диалог</p>
                <p className="text-sm">или нажмите "Связаться" на объявлении, чтобы начать переписку</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
