import { useState } from 'react';
import { Play, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface VideoPlayerProps {
  videoUrl?: string;
  exerciseName: string;
}

/**
 * Extract video ID from YouTube or Vimeo URLs
 */
function getEmbedUrl(url: string): string | null {
  // YouTube patterns
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo patterns
  const vimeoRegex = /vimeo\.com\/(?:channels\/(?:\w+\/)?|groups\/([^\/]*)\/videos\/|album\/(\d+)\/video\/|)(\d+)(?:$|\/|\?)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[3]}`;
  }

  // Direct video URL (mp4, webm, etc.)
  if (url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }

  return null;
}

export function VideoPlayer({ videoUrl, exerciseName }: VideoPlayerProps) {
  const [isOpen, setIsOpen] = useState(false);

  if (!videoUrl) return null;

  const embedUrl = getEmbedUrl(videoUrl);
  if (!embedUrl) return null;

  const isDirectVideo = embedUrl.match(/\.(mp4|webm|ogg)$/i);

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Play className="w-4 h-4" />
        Watch Tutorial
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 z-10 bg-background/80 hover:bg-background"
            >
              <X className="w-4 h-4" />
            </Button>

            <div className="p-4 border-b">
              <h3 className="font-semibold text-lg">{exerciseName}</h3>
              <p className="text-sm text-muted-foreground">Form Tutorial</p>
            </div>

            <div className="aspect-video bg-black">
              {isDirectVideo ? (
                <video
                  src={embedUrl}
                  controls
                  className="w-full h-full"
                  autoPlay
                >
                  Your browser does not support the video tag.
                </video>
              ) : (
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={`${exerciseName} Tutorial`}
                />
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
