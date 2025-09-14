import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Play } from "lucide-react";

interface MediaItem {
  url: string;
  publicId: string;
  type: 'image' | 'video';
  caption?: string;
}

interface MediaPreviewProps {
  media: MediaItem[];
  initialIndex?: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function MediaPreview({ 
  media, 
  initialIndex = 0, 
  open, 
  onOpenChange 
}: MediaPreviewProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  const currentMedia = media.length > 0 ? media[currentIndex] : undefined;

  const goToPrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : media.length - 1));
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev < media.length - 1 ? prev + 1 : 0));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") {
      goToPrevious();
    } else if (e.key === "ArrowRight") {
      goToNext();
    } else if (e.key === "Escape") {
      onOpenChange(false);
    }
  };

  if (!media || media.length === 0) {
    return null;
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] p-0 bg-black w-[95vw] md:w-auto"
        onKeyDown={handleKeyDown}
      >
        <DialogHeader className="p-4 absolute top-0 left-0 right-0 bg-black/50 text-white">
          <div className="flex justify-between items-center">
            <DialogTitle>
              {media.length > 0 ? `${currentIndex + 1} of ${media.length}` : 'No media'}
            </DialogTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => onOpenChange(false)}
              className="text-white hover:bg-white/20"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="flex items-center justify-center h-full w-full relative">
          {media.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 md:left-4 h-10 w-10 md:h-8 md:w-8"
              onClick={goToPrevious}
            >
              <ChevronLeft className="h-6 w-6" />
            </Button>
          )}

          <div className="flex items-center justify-center w-full h-full p-4 md:p-8">
            {currentMedia && currentMedia.type === 'image' ? (
              <img
                src={currentMedia.url}
                alt={currentMedia.caption || `Media ${currentIndex + 1}`}
                className="max-h-[70vh] max-w-full object-contain"
              />
            ) : (
              <div className="flex flex-col items-center w-full">
                {currentMedia ? (
                  <video
                    src={currentMedia.url}
                    controls
                    className="max-h-[60vh] max-w-full w-full"
                  />
                ) : null}
              </div>
            )}
          </div>

          {media.length > 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70 md:right-4 h-10 w-10 md:h-8 md:w-8"
              onClick={goToNext}
            >
              <ChevronRight className="h-6 w-6" />
            </Button>
          )}
        </div>

        {currentMedia && currentMedia.caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white p-4 text-center">
            {currentMedia.caption}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}