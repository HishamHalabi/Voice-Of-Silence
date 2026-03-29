import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGloveStore } from '@/stores/useGloveStore';
import { predictGloveLetter } from '@/lib/glove-logic';
import { apiRequest } from '@/lib/api';
import { GLOVE_CONFIG } from '@/config/glove-config';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mic, MicOff, RefreshCcw, Hand, Volume2 } from 'lucide-react';
import SensorDisplay from '@/components/glove/SensorDisplay';
import GloveGuide from '@/components/glove/GloveGuide';
import { ScrollContainer } from '@/components/ScrollContainer';

const Speak = () => {
    const {
        isCollecting,
        toggleCollecting,
        arduino1Data,
        arduino2Data,
        minValues,
        maxValues,
        ports,
        connect,
        disconnect,
        resetCalibration
    } = useGloveStore();

    const [currentSentence, setCurrentSentence] = useState('');
    const [lastPredictedLetter, setLastPredictedLetter] = useState('');
    const [confidence, setConfidence] = useState(0);

    const lastActivityTime = useRef(Date.now());
    const sentenceStartTime = useRef(Date.now());

    const { IDLE_TIMEOUT, MAX_SENTENCE_DURATION, MAX_CHARS, CHECK_INTERVAL } = GLOVE_CONFIG.SPEAK;

    useEffect(() => {
        if (!isCollecting) return;

        const mergedData = [...arduino1Data, ...arduino2Data];
        const result = predictGloveLetter(mergedData, minValues, maxValues);

        if (result && result.letter && result.letter !== lastPredictedLetter) {
            setLastPredictedLetter(result.letter);
            setConfidence(result.confidence);
            setCurrentSentence(prev => prev + result.letter);
            lastActivityTime.current = Date.now();

            saveGestureToHistory(mergedData, result.letter, result.confidence);
        }
    }, [arduino1Data, arduino2Data, isCollecting]);

    useEffect(() => {
        if (!isCollecting) return;

        const checkAutoSend = () => {
            if (currentSentence.trim().length === 0) return;

            const now = Date.now();
            const idleTime = now - lastActivityTime.current;
            const totalDuration = now - sentenceStartTime.current;

            if (idleTime > IDLE_TIMEOUT || totalDuration > MAX_SENTENCE_DURATION || currentSentence.length >= MAX_CHARS) {
                sendToBackend(currentSentence);
            }
        };

        const timer = setInterval(checkAutoSend, CHECK_INTERVAL);
        return () => clearInterval(timer);
    }, [isCollecting, currentSentence]);

    const sendToBackend = async (text: string) => {
        if (!text.trim()) return;

        const originalText = text;
        setCurrentSentence('');
        setLastPredictedLetter('');
        sentenceStartTime.current = Date.now();
        lastActivityTime.current = Date.now();

        try {
            const res = await apiRequest('/glove/speak', {
                method: 'POST',
                body: JSON.stringify({
                    text: originalText,
                    action: 'Text',
                    saveToChat: false
                })
            });

            if (res.data?.audio?.base64) {
                const audio = new Audio(`data:audio/mp3;base64,${res.data.audio.base64}`);
                audio.play().catch(e => {
                    console.warn('Playback failed, using fallback:', e);
                    speakLocal(originalText);
                });
            } else {
                speakLocal(originalText);
            }
        } catch (error: any) {
            console.error('Speech error:', error);
            toast.error(`Speech failed: ${error.message}`);
            speakLocal(originalText);
        }
    };

    const speakLocal = (text: string) => {
        if (!window.speechSynthesis) return;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'ar-SA';
        window.speechSynthesis.speak(utterance);
    };

    const saveGestureToHistory = async (sensors: number[], letter: string, conf: number) => {
        try {
            await apiRequest('/glove/process', {
                method: 'POST',
                body: JSON.stringify({
                    sensorData: { flexSensors: sensors },
                    letter,
                    confidence: conf,
                    isFrontendData: true,
                    isTrainingData: true
                })
            });
        } catch (error) {
            console.error('Failed to sync gesture data:', error);
        }
    };

    const handleToggle = async () => {
        const unlockAudio = () => {
            const audio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
            audio.play().catch(() => { });
            window.removeEventListener('click', unlockAudio);
        };
        unlockAudio();

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

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 bg-background">
            <div className="max-w-6xl mx-auto space-y-12">
                <div className="flex flex-col lg:flex-row gap-12 items-start">
                    <div className="flex-1 space-y-12 w-full">
                        <div className="text-center lg:text-left space-y-4">
                            <motion.h1
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-4xl md:text-6xl font-display font-bold text-gradient"
                            >
                                Voice to Silence
                            </motion.h1>
                            <p className="text-muted-foreground text-lg max-w-2xl">
                                Gesture-to-speech interface. Translating hand movements into Arabic audio.
                            </p>
                        </div>

                        <div className="relative flex items-center justify-center py-20">
                            <AnimatePresence>
                                {isCollecting && (
                                    <>
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1.5, opacity: 0.15 }}
                                            exit={{ scale: 2, opacity: 0 }}
                                            transition={{ repeat: Infinity, duration: 3, ease: "easeOut" }}
                                            className="absolute w-64 h-64 border-2 border-primary rounded-full"
                                        />
                                        <motion.div
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 2, opacity: 0.1 }}
                                            exit={{ scale: 2.5, opacity: 0 }}
                                            transition={{ repeat: Infinity, duration: 4, ease: "easeOut", delay: 1 }}
                                            className="absolute w-64 h-64 border border-secondary rounded-full"
                                        />
                                    </>
                                )}
                            </AnimatePresence>

                            <div className="relative z-10 text-center space-y-8">
                                <div className="relative inline-block">
                                    <motion.div
                                        animate={isCollecting ? {
                                            boxShadow: [
                                                "0 0 40px rgba(var(--primary), 0.2)",
                                                "0 0 80px rgba(var(--primary), 0.5)",
                                                "0 0 40px rgba(var(--primary), 0.2)"
                                            ]
                                        } : {}}
                                        transition={{ repeat: Infinity, duration: 2 }}
                                        className="rounded-full overflow-hidden p-1 bg-gradient-to-br from-primary via-secondary to-accent"
                                    >
                                        <Button
                                            size="lg"
                                            variant={isCollecting ? "destructive" : "default"}
                                            className="rounded-full w-40 h-40 flex flex-col gap-2 transition-all duration-500 border-4 border-background"
                                            onClick={handleToggle}
                                        >
                                            {isCollecting ? (
                                                <>
                                                    <MicOff className="w-10 h-10" />
                                                    <span className="text-[10px] uppercase tracking-widest font-bold">Stop Interface</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Mic className="w-10 h-10" />
                                                    <span className="text-[10px] uppercase tracking-widest font-bold">Start Interface</span>
                                                </>
                                            )}
                                        </Button>
                                    </motion.div>

                                    <div className="absolute -top-4 -right-4 flex flex-col gap-2">
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${ports.length >= 1 ? 'bg-primary/20 border-primary text-primary' : 'bg-muted/10 border-muted text-muted-foreground'
                                            }`}>
                                            GLOVE L
                                        </div>
                                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${ports.length >= 2 ? 'bg-secondary/20 border-secondary text-secondary' : 'bg-muted/10 border-muted text-muted-foreground'
                                            }`}>
                                            GLOVE R
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <h3 className="text-2xl font-semibold tracking-tight">
                                        {isCollecting ? 'RECOGNITION ACTIVE' : 'SYSTEM READY'}
                                    </h3>
                                    <p className="text-sm text-muted-foreground font-mono">
                                        {ports.length === 0 ? 'PLEASE CONNECT DEVICE' :
                                            ports.length === 1 ? 'WAITING FOR SECOND DEVICE' :
                                                isCollecting ? 'GESTURE RECOGNITION ACTIVE' : 'READY FOR INPUT'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            {(currentSentence || isCollecting) && (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    className="p-8 glass-dark rounded-[2rem] border-primary/20 text-center relative overflow-hidden group shadow-2xl min-h-[250px] flex flex-col justify-center"
                                >
                                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent opacity-50" />
                                    <div className="space-y-6">
                                        <div className="flex flex-col items-center gap-6">
                                            <p className="text-4xl md:text-5xl font-display font-bold leading-tight tracking-tight min-h-[1.2em]">
                                                {currentSentence || (
                                                    <span className="text-muted-foreground/30 italic text-2xl">
                                                        Start gesturing to compose...
                                                    </span>
                                                )}
                                            </p>

                                            {currentSentence && (
                                                <Button
                                                    variant="outline"
                                                    size="lg"
                                                    onClick={() => sendToBackend(currentSentence)}
                                                    className="rounded-2xl border-primary/30 hover:bg-primary/20 bg-primary/5 transition-all px-8 py-6 group"
                                                >
                                                    <Volume2 className="w-5 h-5 mr-3 group-hover:scale-110 transition-transform" />
                                                    <span className="font-bold uppercase tracking-widest text-sm">Speak Now</span>
                                                </Button>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-center gap-3">
                                            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-widest animate-pulse">
                                                <Volume2 className="w-3.5 h-3.5" />
                                                {isCollecting ? 'Real-time translation active' : 'System Standby'}
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                    <div className="w-full lg:w-96 space-y-6">
                        <Card className="glass border-primary/10 overflow-hidden relative group">
                            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
                            <CardContent className="p-6 space-y-6">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Detection</h3>
                                    <div className="flex gap-1">
                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-75" />
                                        <div className="w-1 h-1 rounded-full bg-primary animate-pulse delay-150" />
                                    </div>
                                </div>

                                <div className="text-8xl font-display font-bold text-center py-6 text-primary group-hover:scale-110 transition-transform duration-500">
                                    {lastPredictedLetter || '-'}
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span className="text-muted-foreground">Confidence</span>
                                        <span className="text-primary">{Math.round(confidence * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-secondary/20 rounded-full overflow-hidden border border-white/5">
                                        <motion.div
                                            className="h-full bg-gradient-to-r from-primary to-secondary"
                                            animate={{ width: `${confidence * 100}%` }}
                                            transition={{ type: "spring", stiffness: 100 }}
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground italic text-center">
                                        Real-time gesture analysis
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <SensorDisplay className="border-primary/10" />

                        <GloveGuide className="border-primary/10" />

                        <Button
                            variant="outline"
                            className="w-full py-6 rounded-2xl border-white/10 hover:bg-white/5 group transition-all"
                            onClick={resetCalibration}
                        >
                            <RefreshCcw className="w-4 h-4 mr-2 group-hover:rotate-180 transition-transform duration-500" />
                            <span className="text-xs font-bold uppercase tracking-widest">Recalibrate Device</span>
                        </Button>
                    </div>
                </div>
            </div>

            <ScrollContainer showSpacer={false}>
                <div className="relative z-0" />
            </ScrollContainer>
        </div>
    );
};


export default Speak;
