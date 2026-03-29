import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/stores/useAuthStore';
import { apiRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { User as UserIcon, Mail, Calendar, Trophy, MessageSquare, Hand, BookOpen, Activity } from 'lucide-react';
import { ScrollContainer } from '@/components/ScrollContainer';

const Profile = () => {
    const { user } = useAuthStore();
    const [statsData, setStatsData] = useState({
        messagesSent: 0,
        gesturesRecognized: 0,
        totalHours: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await apiRequest('/users/profile/stats');
                if (response.success) {
                    setStatsData(response.data.stats);
                }
            } catch (error) {
                console.error('Failed to fetch stats:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchStats();
        }
    }, [user]);

    if (!user) return null;

    const stats = [
        {
            label: 'Gestures Recognized',
            value: statsData.gesturesRecognized,
            icon: <Hand className="w-5 h-5 text-primary" />,
            description: 'Total sign language characters captured'
        },
        {
            label: 'Messages Sent',
            value: statsData.messagesSent,
            icon: <MessageSquare className="w-5 h-5 text-secondary" />,
            description: 'Conversations powered by AI'
        },
        {
            label: 'Usage Hours',
            value: statsData.totalHours,
            icon: <Calendar className="w-5 h-5 text-accent" />,
            description: 'Total time spent using the device'
        },
    ];

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 bg-background">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header Card */}
                <Card className="glass border-primary/20 overflow-hidden">
                    <div className="h-32 bg-gradient-to-r from-primary/20 via-secondary/20 to-accent/20" />
                    <CardContent className="relative pt-0 pb-8 px-8">
                        <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
                            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
                                <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                                    {user.name.charAt(0)}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 pb-2 space-y-1 text-center md:text-left">
                                <h1 className="text-3xl font-bold">{user.name}</h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-muted-foreground">
                                    <span className="flex items-center gap-1 text-sm"><Mail className="w-4 h-4" /> {user.email}</span>
                                    <span className="flex items-center gap-1 text-sm">
                                        <Calendar className="w-4 h-4" />
                                        Joined {new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Real Statistics Section */}
                <div className="space-y-4">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                        <Activity className="w-5 h-5 text-primary" />
                        Platform Activity
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {stats.map((stat, i) => (
                            <Card key={i} className="glass hover:border-primary/30 transition-all group relative overflow-hidden">
                                <CardContent className="p-6 flex items-center gap-6">
                                    <div className="p-4 rounded-2xl bg-background/50 group-hover:bg-primary/10 transition-colors">
                                        {stat.icon}
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-sm text-muted-foreground">{stat.label}</p>
                                        <p className="text-3xl font-bold">
                                            {loading ? '...' : stat.value.toLocaleString()}
                                        </p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{stat.description}</p>
                                    </div>
                                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-primary/10 transition-all" />
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>

                <Card className="glass border-dashed border-primary/20">
                    <CardContent className="p-12 text-center space-y-4">
                        <div className="inline-flex p-4 rounded-full bg-primary/5 text-primary mb-2">
                            <Trophy className="w-8 h-8 opacity-20" />
                        </div>
                        <h4 className="text-xl font-bold opacity-50">Advanced Achievements System</h4>
                        <p className="text-sm text-muted-foreground mx-auto max-w-sm">
                            We are currently calibrating your neural progress. Stay tuned for real-time achievements and learning milestones!
                        </p>
                    </CardContent>
                </Card>
            </div>

            <ScrollContainer showSpacer={false}>
                <div className="relative z-0" />
            </ScrollContainer>
        </div>
    );
};

export default Profile;
