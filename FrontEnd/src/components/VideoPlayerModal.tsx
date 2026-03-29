import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { API_BASE_URL } from '@/lib/api';
import { Badge } from '@/components/ui/badge';

interface Video {
    _id?: string;
    title: string;
    description: string;
    category: string;
    difficulty: string;
}

interface VideoPlayerModalProps {
    video: Video | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({ video, open, onOpenChange }: VideoPlayerModalProps) {
    if (!video) return null;

    const videoSrc = `${API_BASE_URL}/videos/stream/${video._id}`;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] glass border-primary/20 p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-0">
                    <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                            <DialogTitle className="text-2xl font-bold">{video.title}</DialogTitle>
                            <DialogDescription className="sr-only">
                                Playing educational video: {video.title}
                            </DialogDescription>
                            <div className="flex gap-2">
                                <Badge variant="secondary" className="bg-primary/10 text-primary border-none text-xs">
                                    {video.category}
                                </Badge>
                                <Badge variant="outline" className="border-primary/20 text-xs text-muted-foreground">
                                    {video.difficulty}
                                </Badge>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="p-6 pt-4 space-y-4">
                    <div className="aspect-video bg-black rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10">
                        {open && (
                            <video
                                controls
                                autoPlay
                                className="w-full h-full object-contain"
                                key={video._id} // Re-mount video tag when video changes
                            >
                                <source src={videoSrc} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        )}
                    </div>

                    <div className="space-y-2">
                        <p className="text-muted-foreground text-sm leading-relaxed">
                            {video.description}
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
