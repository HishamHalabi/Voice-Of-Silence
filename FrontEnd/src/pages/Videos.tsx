import { useState, useEffect } from 'react';
import { apiRequest } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Play, BookOpen, GraduationCap, MessageSquare, Hand, Plus } from 'lucide-react';
import { ScrollContainer } from '@/components/ScrollContainer';
import { useAuthStore } from '@/stores/useAuthStore';
import { VideoUploadModal } from '@/components/VideoUploadModal';
import { VideoPlayerModal } from '@/components/VideoPlayerModal';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Video {
    _id?: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
    videoPath?: string;
}

const Videos = () => {
    const [videos, setVideos] = useState<Video[]>([]);
    const [category, setCategory] = useState<string>('all');
    const [difficulty, setDifficulty] = useState<string>('all');
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
    const [isPlayerOpen, setIsPlayerOpen] = useState(false);
    const user = useAuthStore(state => state.user);
    const isAdmin = user?.role === 'admin';

    const mockVideos: Video[] = [
        { title: 'Sign Language Alphabet', category: 'alphabet', difficulty: 'beginner', description: 'Learn the basic alphabet' },
        { title: 'Common Words', category: 'words', difficulty: 'intermediate', description: 'Everyday vocabulary' },
        { title: 'Full Sentences', category: 'sentences', difficulty: 'advanced', description: 'Practice complete sentences' },
        { title: 'Advanced Techniques', category: 'advanced', difficulty: 'advanced', description: 'Master complex signs' },
        { title: 'Practice Session', category: 'practice', difficulty: 'beginner', description: 'Guided practice' }
    ];

    useEffect(() => {
        loadVideos();
    }, [category, difficulty]);

    const loadVideos = async () => {
        try {
            const params = new URLSearchParams();
            if (category !== 'all') params.append('category', category);
            if (difficulty !== 'all') params.append('difficulty', difficulty);

            const data = await apiRequest(`/videos?${params.toString()}`);
            setVideos(data.data.videos.length > 0 ? data.data.videos : mockVideos);
        } catch (error) {
            setVideos(mockVideos);
        }
    };


    const handlePlayVideo = (video: Video) => {
        if (!video._id) {
            toast.error('This is a demo video and cannot be played.');
            return;
        }
        setSelectedVideo(video);
        setIsPlayerOpen(true);
    };

    const getCategoryIcon = (cat: string) => {
        switch (cat) {
            case 'alphabet': return <BookOpen className="w-5 h-5" />;
            case 'words': return <MessageSquare className="w-5 h-5" />;
            case 'sentences': return <Hand className="w-5 h-5" />;
            case 'advanced': return <GraduationCap className="w-5 h-5" />;
            default: return <Play className="w-5 h-5" />;
        }
    };

    return (
        <div className="min-h-screen pt-24 pb-12 px-6 bg-background">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <h1 className="text-4xl font-bold text-gradient">Educational Library</h1>
                        <p className="text-muted-foreground">Master Arabic Sign Language with our expert-led tutorials.</p>
                    </div>

                    <div className="flex gap-4 w-full md:w-auto">
                        <Select value={category} onValueChange={setCategory}>
                            <SelectTrigger className="w-full md:w-[180px] glass">
                                <SelectValue placeholder="Category" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Categories</SelectItem>
                                <SelectItem value="alphabet">Alphabet</SelectItem>
                                <SelectItem value="words">Words</SelectItem>
                                <SelectItem value="sentences">Sentences</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>

                        <Select value={difficulty} onValueChange={setDifficulty}>
                            <SelectTrigger className="w-full md:w-[180px] glass">
                                <SelectValue placeholder="Difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Levels</SelectItem>
                                <SelectItem value="beginner">Beginner</SelectItem>
                                <SelectItem value="intermediate">Intermediate</SelectItem>
                                <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {isAdmin && (
                        <Button
                            onClick={() => setIsUploadModalOpen(true)}
                            className="w-full md:w-auto glow-primary"
                        >
                            <Plus className="w-4 h-4 mr-2" />
                            Upload Video
                        </Button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {videos.map((video, i) => (
                        <Card
                            key={i}
                            className="glass hover:border-primary/50 transition-all duration-300 group cursor-pointer"
                            onClick={() => handlePlayVideo(video)}
                        >
                            <div className="aspect-video bg-muted relative overflow-hidden flex items-center justify-center">
                                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-primary-foreground shadow-lg scale-90 group-hover:scale-100 transition-transform">
                                        <Play className="w-6 h-6 fill-current" />
                                    </div>
                                </div>
                                <div className="text-muted-foreground/20 group-hover:text-primary/20 transition-colors">
                                    {getCategoryIcon(video.category)}
                                </div>
                            </div>
                            <CardHeader className="space-y-2">
                                <div className="flex justify-between items-start">
                                    <Badge variant="secondary" className="bg-primary/5 text-primary border-none">
                                        {video.category}
                                    </Badge>
                                    <Badge variant="outline" className="border-primary/20">
                                        {video.difficulty}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                                    {video.title}
                                </CardTitle>
                                <p className="text-sm text-muted-foreground line-clamp-2">
                                    {video.description}
                                </p>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>

            <ScrollContainer showSpacer={false}>
                <div className="relative z-0" />
            </ScrollContainer>

            <VideoUploadModal
                open={isUploadModalOpen}
                onOpenChange={setIsUploadModalOpen}
                onUploadSuccess={loadVideos}
            />

            <VideoPlayerModal
                video={selectedVideo}
                open={isPlayerOpen}
                onOpenChange={setIsPlayerOpen}
            />
        </div>
    );
};

export default Videos;
