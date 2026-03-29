import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { LETTER_GROUPS } from '@/lib/glove-logic';
import { Hand } from 'lucide-react';

interface GloveGuideProps {
    className?: string;
}

const GloveGuide = ({ className }: GloveGuideProps) => {
    const fingerNames = ['Thumb (A1)', 'Index (A2)', 'Middle (A3)', 'Ring (A4)', 'Pinky (A5)', 'Position (A6)'];

    return (
        <Card className={`glass border-primary/10 overflow-hidden relative group ${className}`}>
            <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 to-transparent pointer-events-none" />
            <CardContent className="p-6 space-y-6">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <Hand className="w-4 h-4 text-primary" />
                        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Gesture matrix Guide</h3>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="border-b border-primary/10">
                                <th className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground text-left">Finger</th>
                                <th colSpan={6} className="py-3 px-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Available Letters (Position Based)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-primary/5">
                            {LETTER_GROUPS.map((group, idx) => (
                                <motion.tr
                                    key={idx}
                                    initial={{ opacity: 0, x: -20 }}
                                    whileInView={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 }}
                                    className="hover:bg-primary/5 transition-colors group/row"
                                >
                                    <td className="py-4 px-2 text-left">
                                        <span className="text-xs font-bold font-mono text-primary/80">
                                            {fingerNames[idx] || `Finger ${idx + 1}`}
                                        </span>
                                    </td>
                                    {group.map((letter, lIdx) => (
                                        <td key={lIdx} className="py-4 px-1">
                                            <div className="flex flex-col items-center gap-1">
                                                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-background/50 border border-white/5 group-hover/row:border-primary/20 group-hover/row:text-primary transition-all text-lg font-display font-bold">
                                                    {letter === ' ' ? '␣' : letter}
                                                </div>
                                                <span className="text-[8px] text-muted-foreground font-mono opacity-0 group-hover/row:opacity-100 transition-opacity">
                                                    P{lIdx + 1}
                                                </span>
                                            </div>
                                        </td>
                                    ))}
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="pt-4 border-t border-primary/10 flex flex-col gap-2">
                    <p className="text-[10px] text-muted-foreground italic leading-relaxed">
                        <span className="text-primary font-bold">How to use:</span> Each row represents an active finger. The horizontal position (P1-P6) is determined by your hand orientation (B1, B2 sensors).
                    </p>
                    <div className="flex gap-4 mt-2">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-primary" />
                            <span className="text-[9px] uppercase tracking-tighter font-bold text-muted-foreground">Select Finger</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-secondary" />
                            <span className="text-[9px] uppercase tracking-tighter font-bold text-muted-foreground">Tilt to Pick</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default GloveGuide;
