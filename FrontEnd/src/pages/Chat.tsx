import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { useGloveStore } from '@/stores/useGloveStore';
import { predictGloveLetter } from '@/lib/glove-logic';
import { apiRequest } from '@/lib/api';
import { GLOVE_CONFIG } from '@/config/glove-config';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, Send, Hand, Volume2, UserPlus, MessageSquare, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { ScrollContainer } from '@/components/ScrollContainer';

interface Message {
    _id: string;
    sender: string | { _id: string; name: string };
    message: string;
    messageType: 'text' | 'voice';
    isGloveInput: boolean;
    isRead: boolean;
    createdAt: string;
}

interface Conversation {
    user: {
        _id: string;
        name: string;
        email: string;
    };
    lastMessage: Message;
    unreadCount: number;
}

const Chat = () => {
    const { user } = useAuthStore();
    const {
        isCollecting,
        toggleCollecting,
        ports,
        connect,
        arduino1Data,
        arduino2Data,
        minValues,
        maxValues,
        resetCalibration
    } = useGloveStore();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [newChatEmail, setNewChatEmail] = useState('');

    const scrollRef = useRef<HTMLDivElement>(null);
    const lastPredictedLetter = useRef<string>('');
    const lastActivityTime = useRef(Date.now());

    const { IDLE_TIMEOUT, CHECK_INTERVAL } = GLOVE_CONFIG.CHAT;

    useEffect(() => {
        loadConversations();
    }, []);

    useEffect(() => {
        if (selectedConv) {
            loadMessages(selectedConv.user._id);
        }
    }, [selectedConv]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (!isCollecting) {
            lastPredictedLetter.current = '';
            return;
        }

        const mergedData = [...arduino1Data, ...arduino2Data];
        const result = predictGloveLetter(mergedData, minValues, maxValues);

        if (result && result.letter && result.letter !== lastPredictedLetter.current) {
            lastPredictedLetter.current = result.letter;
            setNewMessage(prev => prev + result.letter);
            lastActivityTime.current = Date.now();
        }
    }, [arduino1Data, arduino2Data, isCollecting]);

    useEffect(() => {
        if (!isCollecting) return;

        const checkAutoSend = () => {
            if (newMessage.trim().length === 0) return;

            const now = Date.now();
            const idleTime = now - lastActivityTime.current;

            if (idleTime > IDLE_TIMEOUT) {
                handleSendMessage();
            }
        };

        const timer = setInterval(checkAutoSend, CHECK_INTERVAL);
        return () => clearInterval(timer);
    }, [isCollecting, newMessage, selectedConv]);

    const loadConversations = async () => {
        try {
            const data = await apiRequest('/chat/conversations');
            setConversations(data.data.conversations || []);
        } catch (error) {
            console.error('Failed to load conversations');
        }
    };

    const loadMessages = async (userId: string) => {
        try {
            const data = await apiRequest(`/chat/messages?userId=${userId}&limit=50`);
            const reversed = Array.isArray(data.data) ? [...data.data].reverse() : [];
            setMessages(reversed);

            const unreadMessages = reversed.filter(m => !m.isRead && (typeof m.sender === 'object' ? m.sender._id : m.sender) !== user?.id);
            if (unreadMessages.length > 0) {
                await Promise.all(unreadMessages.map(m => apiRequest(`/chat/read/${m._id}`, { method: 'PUT' })));
                loadConversations(); 
            }
        } catch (error) {
            console.error('Failed to load messages');
        }
    };

    const handleSendMessage = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !selectedConv) return;

        try {
            await apiRequest('/chat/send', {
                method: 'POST',
                body: JSON.stringify({
                    receiverId: selectedConv.user._id,
                    message: newMessage,
                    messageType: 'text'
                })
            });
            setNewMessage('');
            lastPredictedLetter.current = ''; 
            loadMessages(selectedConv.user._id);
            loadConversations();
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const handleStartChat = async () => {
        if (!newChatEmail.trim()) return;
        try {
            const data = await apiRequest('/users/find', {
                method: 'POST',
                body: JSON.stringify({ email: newChatEmail })
            });
            const foundUser = data.data.user;
            setSelectedConv({
                user: foundUser,
                lastMessage: {} as any,
                unreadCount: 0
            });
            setNewChatEmail('');
            toast.success(`Chat started with ${foundUser.name}`);
        } catch (error: any) {
            toast.error(error.message || 'User not found');
        }
    };

    const handleGloveToggle = async () => {
        if (!selectedConv) {
            toast.error('Select a conversation first');
            return;
        }
        if (!isCollecting && ports.length < 2) {
            try {
                await connect();
            } catch (err: any) {
                const errorMessage = err.name === 'NotFoundError' ? 'No port selected' :
                    err.name === 'SecurityError' ? 'Security violation' :
                        err.message || 'Connection failed';
                toast.error(`Connection failed: ${errorMessage}`);
                return;
            }
        }
        toggleCollecting();
    };

    const playAudio = async (text: string) => {
        if (!text.trim()) return;

        try {
            const res = await apiRequest('/glove/speak', {
                method: 'POST',
                body: JSON.stringify({
                    text,
                    action: 'Text',
                    saveToChat: false
                })
            });

            if (res.data?.audio?.base64) {
                const audio = new Audio(`data:audio/mp3;base64,${res.data.audio.base64}`);
                audio.play();
            } else {
                speakLocal(text);
            }
        } catch (error) {
            console.error('Speech error:', error);
            speakLocal(text);
        }
    };

    const speakLocal = (text: string) => {
        if (!window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
    };

    return (
        <div className="flex h-screen pt-20 bg-background overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none" />

            <div className="w-80 md:w-96 border-r border-border/50 bg-card/20 backdrop-blur-xl flex flex-col relative z-10 shadow-2xl">
                <div className="p-6 space-y-6">
                    <div className="flex justify-between items-center">
                        <h2 className="text-xl font-display font-bold text-gradient uppercase tracking-wider">Messages</h2>
                        <Badge variant="outline" className="text-[10px] border-primary/20 text-primary">{conversations.length} Active</Badge>
                    </div>

                    <div className="space-y-3">
                        <div className="relative group">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Search messages..."
                                className="pl-10 bg-background/40 border-white/5 focus:border-primary/50 transition-all rounded-xl h-12"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <Input
                                placeholder="User Email..."
                                className="bg-background/40 border-white/5 rounded-xl h-10 text-xs"
                                value={newChatEmail}
                                onChange={(e) => setNewChatEmail(e.target.value)}
                            />
                            <Button size="sm" onClick={handleStartChat} className="rounded-xl bg-primary/20 hover:bg-primary/30 text-primary border-none w-10 h-10 p-0">
                                <UserPlus className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <ScrollArea className="flex-1 px-4 pb-4">
                    <div className="space-y-2">
                        {conversations
                            .filter(c => c.user.name.toLowerCase().includes(searchQuery.toLowerCase()))
                            .map((conv) => {
                                const isSelected = selectedConv?.user._id === conv.user._id;
                                return (
                                    <div
                                        key={conv.user._id}
                                        onClick={() => setSelectedConv(conv)}
                                        className={`group relative flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all duration-300 ${isSelected
                                            ? 'bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 shadow-lg shadow-primary/5'
                                            : 'hover:bg-white/5'
                                            }`}
                                    >
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 ring-2 ring-background border border-primary/10">
                                                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${conv.user.name}`} />
                                                <AvatarFallback className="bg-primary/5 text-primary text-xl font-bold">
                                                    {conv.user.name.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-background rounded-full shadow-lg" />
                                        </div>
                                        <div className="flex-1 min-w-0 space-y-1">
                                            <div className="flex justify-between items-baseline">
                                                <h4 className={`font-bold truncate transition-colors ${isSelected ? 'text-primary' : 'group-hover:text-primary'}`}>
                                                    {conv.user.name}
                                                </h4>
                                                <span className="text-[9px] text-muted-foreground font-mono">12:30</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <p className="text-xs text-muted-foreground truncate italic max-w-[150px]">
                                                    {conv.lastMessage?.message || 'No messages yet...'}
                                                </p>
                                                {conv.unreadCount > 0 && (
                                                    <span className="bg-primary text-primary-foreground text-[9px] font-bold px-1.5 py-0.5 rounded-full shadow-lg shadow-primary/20">
                                                        {conv.unreadCount}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </ScrollArea>
            </div>

            <div className="flex-1 flex flex-col relative bg-background/50 backdrop-blur-sm">
                {selectedConv ? (
                    <>
                        <div className="h-20 border-b border-border/50 flex items-center px-8 justify-between bg-card/20 backdrop-blur-md sticky top-0 z-20">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-12 w-12 border border-primary/20">
                                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedConv.user.name}`} />
                                    <AvatarFallback className="bg-primary/5 text-primary">
                                        {selectedConv.user.name.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-display font-bold text-lg">{selectedConv.user.name}</h3>
                                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground font-mono tracking-widest uppercase">{selectedConv.user.email}</p>
                                </div>
                            </div>

                            <div className={`hidden md:flex items-center gap-3 px-4 py-2 rounded-full border transition-all duration-500 ${isCollecting ? 'bg-primary/10 border-primary shadow-glow-sm' : 'bg-muted/10 border-white/5'
                                }`}>
                                <div className={`w-2 h-2 rounded-full ${isCollecting ? 'bg-primary animate-ping' : 'bg-muted-foreground/30'}`} />
                                <span className={`text-[10px] font-bold tracking-[0.2em] uppercase ${isCollecting ? 'text-primary' : 'text-muted-foreground'}`}>
                                    {isCollecting ? 'Glove Recognition Active' : 'Glove Standby'}
                                </span>
                            </div>
                        </div>

                        <ScrollArea className="flex-1 px-8 py-10" ref={scrollRef}>
                            <div className="space-y-8 max-w-4xl mx-auto">
                                {messages.map((msg, i) => {
                                    const isSent = (typeof msg.sender === 'object' ? msg.sender._id : msg.sender) === user?.id;
                                    return (
                                        <motion.div
                                            initial={{ opacity: 0, x: isSent ? 20 : -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={msg._id}
                                            className={`flex ${isSent ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`relative max-w-[75%] space-y-2 group ${isSent ? 'items-end' : 'items-start'}`}>
                                                <Card
                                                    className={`p-5 relative overflow-hidden transition-all duration-300 hover:scale-[1.02] shadow-xl ${isSent
                                                        ? 'bg-gradient-to-br from-primary to-primary-glow text-primary-foreground rounded-2xl rounded-tr-none border-none'
                                                        : 'glass rounded-2xl rounded-tl-none border-white/10'
                                                        } cursor-pointer active:scale-95`}
                                                    onClick={() => playAudio(msg.message)}
                                                >
                                                    {isSent && <div className="absolute inset-0 bg-gradient-to-tr from-white/10 to-transparent pointer-events-none" />}

                                                    <div className="flex items-start gap-4">
                                                        <div className="flex flex-col flex-1 space-y-1">
                                                            <div className="flex items-center gap-2">
                                                                {msg.isGloveInput && (
                                                                    <div className={`p-1 rounded-md ${isSent ? 'bg-white/20' : 'bg-primary/10'}`}>
                                                                        <Hand className={`w-3 h-3 ${isSent ? 'text-primary-foreground' : 'text-primary'}`} />
                                                                    </div>
                                                                )}
                                                                <p className="text-[15px] leading-relaxed font-medium">
                                                                    {msg.message}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className={`mt-1 h-7 w-7 rounded-full flex items-center justify-center transition-all ${isSent
                                                            ? 'bg-white/10 text-primary-foreground group-hover:bg-white/30'
                                                            : 'bg-primary/5 text-primary group-hover:bg-primary/20'
                                                            }`}>
                                                            <Volume2 className="h-3.5 w-3.5" />
                                                        </div>
                                                    </div>
                                                </Card>
                                                <div className={`flex items-center gap-2 px-2 text-[9px] font-mono text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity ${isSent ? 'flex-row-reverse' : ''}`}>
                                                    <span>{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                                                    <div className="w-1 h-1 rounded-full bg-muted-foreground/30" />
                                                    <span>{isSent ? 'Delivered' : 'Active'}</span>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </ScrollArea>

                        <div className="p-8 bg-card/10 backdrop-blur-xl border-t border-white/5 relative z-10">
                            <div className="max-w-4xl mx-auto">
                                <form onSubmit={handleSendMessage} className="flex gap-4 items-center">
                                    <div className="relative group">
                                        <AnimatePresence>
                                            {isCollecting && (
                                                <motion.div
                                                    initial={{ opacity: 0, scale: 0.5 }}
                                                    animate={{ opacity: 1, scale: 1.2 }}
                                                    exit={{ opacity: 0, scale: 0.5 }}
                                                    className="absolute -inset-2 bg-primary/20 rounded-2xl blur-lg -z-10"
                                                />
                                            )}
                                        </AnimatePresence>
                                        <Button
                                            type="button"
                                            variant={isCollecting ? "destructive" : "outline"}
                                            className={`w-14 h-14 rounded-2xl transition-all duration-500 border-white/10 ${isCollecting
                                                ? 'shadow-glow shadow-primary/20 scale-105'
                                                : 'hover:bg-white/5 hover:border-primary/50'
                                                }`}
                                            onClick={handleGloveToggle}
                                        >
                                            <Hand className={`h-6 w-6 ${isCollecting ? 'animate-bounce' : ''}`} />
                                        </Button>
                                    </div>

                                    <div className="relative group">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-14 h-14 rounded-2xl border-white/10 hover:bg-white/5 hover:border-primary/50 transition-all"
                                            onClick={resetCalibration}
                                            title="Reset Calibration"
                                        >
                                            <RefreshCcw className="h-5 w-5 text-muted-foreground group-hover:rotate-180 transition-transform duration-500" />
                                        </Button>
                                    </div>

                                    <div className="flex-1 relative">
                                        <Input
                                            placeholder={isCollecting ? "GLOVE INPUT ACTIVE..." : "Type a message..."}
                                            value={newMessage}
                                            onChange={(e) => setNewMessage(e.target.value)}
                                            readOnly={isCollecting}
                                            className={`h-14 rounded-2xl bg-background/60 border-white/10 focus:border-primary/50 focus:ring-1 focus:ring-primary/20 px-6 text-[15px] transition-all ${isCollecting ? 'cursor-default opacity-80' : ''}`}
                                        />
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-2">
                                            <div className={`w-1 h-4 rounded-full transition-colors ${isCollecting ? 'bg-primary animate-[pulse_1s_infinite]' : 'bg-muted-foreground/10'}`} />
                                            <div className={`w-1 h-4 rounded-full transition-colors ${isCollecting ? 'bg-primary animate-[pulse_1s_infinite_0.2s]' : 'bg-muted-foreground/10'}`} />
                                            <div className={`w-1 h-4 rounded-full transition-colors ${isCollecting ? 'bg-primary animate-[pulse_1s_infinite_0.4s]' : 'bg-muted-foreground/10'}`} />
                                        </div>
                                    </div>

                                    <Button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="h-14 w-14 rounded-2xl bg-primary hover:bg-primary-glow text-primary-foreground shadow-lg shadow-primary/20 group transition-all"
                                    >
                                        <Send className="h-6 w-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                    </Button>
                                </form>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-8">
                        <motion.div
                            animate={{
                                scale: [1, 1.05, 1],
                                rotate: [0, 5, -5, 0]
                            }}
                            transition={{ repeat: Infinity, duration: 10 }}
                            className="p-12 rounded-full border border-primary/10 bg-gradient-to-b from-primary/5 to-transparent relative group"
                        >
                            <div className="absolute inset-0 bg-primary/20 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity" />
                            <MessageSquare className="h-24 w-24 text-primary relative z-10" />
                        </motion.div>
                        <div className="max-w-md space-y-4">
                            <h2 className="text-4xl font-display font-bold text-gradient uppercase tracking-tight">Message History</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">
                                Select a contact or start a new chat to begin messaging.
                            </p>
                            <Button variant="outline" className="rounded-full px-8 mt-4 border-primary/20 hover:bg-primary/5">
                                Start New Chat
                            </Button>
                        </div>
                    </div>
                )}
            </div>

            <ScrollContainer showSpacer={false}>
                <div className="relative z-0" />
            </ScrollContainer>
        </div>
    );
};


export default Chat;
