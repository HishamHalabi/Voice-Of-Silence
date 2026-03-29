import { motion } from 'framer-motion';
import { useGloveStore } from '@/stores/useGloveStore';
import { getBinarySensors } from '@/lib/glove-logic';
import { GLOVE_CONFIG } from '@/config/glove-config';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Hand } from 'lucide-react';

interface SensorDisplayProps {
    className?: string;
}

const SensorDisplay = ({ className }: SensorDisplayProps) => {
    const { arduino1Data, arduino2Data, minValues, maxValues } = useGloveStore();

    const renderSensors = (data: number[], offset: number, label: string) => (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-primary/70">{label}</h4>
                <Badge variant={data.length > 0 ? "default" : "outline"} className="h-4 px-2 text-[8px] bg-primary/10 text-primary border-primary/20">
                    {data.length > 0 ? "ONLINE" : "OFFLINE"}
                </Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
                {data.map((val, i) => {
                    const idx = i + offset;

                    // Normalize value
                    let min = minValues[idx];
                    let max = maxValues[idx];
                    let range = max - min;
                    if (range <= 0) range = 1023;
                    const clamped = Math.max(min, Math.min(max, val));
                    const norm = (clamped - min) / range;

                    let displayValue: number;
                    let isHigh: boolean;

                    if (idx < 5) {
                        displayValue = norm > GLOVE_CONFIG.THRESHOLDS.FINGERS ? 1 : 0;
                        isHigh = displayValue === 1;
                    } else if (idx === 5) {
                        // 2-finger hand: first sensor mapped to 1/0 (inverted)
                        displayValue = norm > GLOVE_CONFIG.THRESHOLDS.B1_INVERTED ? 0 : 1;
                        isHigh = displayValue === 1;
                    } else {
                        // 2-finger hand: second sensor mapped to 2/1/0 (inverted 0/1/2)
                        if (norm < GLOVE_CONFIG.THRESHOLDS.B2.STATE_2) displayValue = 2;
                        else if (norm < GLOVE_CONFIG.THRESHOLDS.B2.STATE_1) displayValue = 1;
                        else displayValue = 0;
                        isHigh = displayValue > 0;
                    }

                    return (
                        <div key={i} className="space-y-1 group/sensor">
                            <div className="flex justify-between text-[9px] items-center">
                                <span className="text-muted-foreground group-hover/sensor:text-foreground transition-colors">
                                    {i < 5 ? `Finger ${i + 1}` : i === 0 ? 'Flex X (0,1)' : 'Flex Y (0,1,2)'}
                                </span>
                                <div className="flex gap-2 items-center">
                                    <span className="font-mono text-primary/80">{val}</span>
                                    <span className={`text-[10px] font-mono font-bold ${isHigh ? 'text-primary' : 'text-muted-foreground/30'}`}>
                                        ({displayValue})
                                    </span>
                                    <div className={`w-2 h-2 rounded-full transition-all duration-300 ${displayValue === 2 ? 'bg-primary shadow-[0_0_12px_hsl(var(--primary))] scale-125' : isHigh ? 'bg-primary shadow-[0_0_8px_hsl(var(--primary))]' : 'bg-muted-foreground/20'
                                        }`} />
                                </div>
                            </div>
                            <div className="h-1 bg-secondary/30 rounded-full overflow-hidden">
                                <motion.div
                                    className="h-full bg-primary"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${Math.min(100, ((val - minValues[idx]) / (maxValues[idx] - minValues[idx] || 1)) * 100)}%` }}
                                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );

    return (
        <Card className={`glass border-primary/10 overflow-hidden relative ${className}`}>
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Hand className="w-12 h-12" />
            </div>
            <CardContent className="p-5 space-y-8">
                <div className="space-y-6">
                    {renderSensors(arduino1Data, 0, "Interface Alpha (L)")}
                    <div className="h-px bg-white/5" />
                    {renderSensors(arduino2Data, arduino1Data.length, "Interface Beta (R)")}
                </div>

                <div className="pt-2 border-t border-primary/5 flex justify-between items-center text-[9px] uppercase tracking-tighter">
                    <span className="text-muted-foreground font-bold">Neural Range Matrix:</span>
                    <span className="font-mono text-primary/60">{Math.min(...minValues)} - {Math.max(...maxValues)}</span>
                </div>
            </CardContent>
        </Card>
    );
};

export default SensorDisplay;
