import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { StatusIcon } from "./StatusIcon";
import { X, ChevronLeft, ChevronRight, Pause, Play, VolumeX, Volume2, MoreVertical, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";

interface StatusContent {
  id: string;
  type: 'text' | 'image' | 'video';
  content: string;
  backgroundColor?: string;
  timestamp: string;
}

interface StatusViewerProps {
  contactName: string;
  contactAvatar?: string;
  statuses: StatusContent[];
  onClose: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export const StatusViewer: React.FC<StatusViewerProps> = ({
  contactName,
  contactAvatar,
  statuses,
  onClose,
  onNext,
  onPrevious,
  hasNext = false,
  hasPrevious = false
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [progress, setProgress] = useState(0);

  const currentStatus = statuses[currentIndex];
  const totalStatuses = statuses.length;

  // Auto-progress through statuses
  useEffect(() => {
    if (isPaused || !currentStatus) return;

    const duration = currentStatus.type === 'video' ? 15000 : 5000; // 5s for images/text, 15s for video
    const interval = 50;
    const increment = (interval / duration) * 100;

    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          if (currentIndex < totalStatuses - 1) {
            setCurrentIndex(currentIndex + 1);
            return 0;
          } else if (hasNext && onNext) {
            onNext();
            return 0;
          } else {
            onClose();
            return 100;
          }
        }
        return prev + increment;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, totalStatuses, hasNext, onNext, onClose, currentStatus]);

  // Reset progress when changing status
  useEffect(() => {
    setProgress(0);
  }, [currentIndex]);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    } else if (hasPrevious && onPrevious) {
      onPrevious();
    }
  };

  const handleNext = () => {
    if (currentIndex < totalStatuses - 1) {
      setCurrentIndex(currentIndex + 1);
    } else if (hasNext && onNext) {
      onNext();
    }
  };

  if (!currentStatus) {
    return (
      <div className="h-full flex items-center justify-center bg-background">
        <div className="text-center">
          <StatusIcon size={64} className="text-muted-foreground mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Compartilhe atualizações de status
          </h2>
          <p className="text-muted-foreground max-w-md">
            Compartilhe fotos, vídeos e textos que desaparecem após 24 horas.
          </p>
          <div className="flex items-center justify-center gap-2 mt-8 text-muted-foreground text-sm">
            <Lock size={14} />
            <span>Suas atualizações de status são protegidas com a criptografia de ponta a ponta.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="h-full flex flex-col"
      style={{ 
        backgroundColor: currentStatus.type === 'text' 
          ? (currentStatus.backgroundColor || 'hsl(var(--muted))') 
          : 'hsl(var(--background))'
      }}
    >
      {/* Progress bars */}
      <div className="absolute top-0 left-0 right-0 flex gap-1 p-2 z-10">
        {statuses.map((_, index) => (
          <div 
            key={index} 
            className="flex-1 h-1 bg-background/30 rounded-full overflow-hidden"
          >
            <div 
              className="h-full bg-foreground transition-all duration-75"
              style={{ 
                width: index < currentIndex 
                  ? '100%' 
                  : index === currentIndex 
                    ? `${progress}%` 
                    : '0%' 
              }}
            />
          </div>
        ))}
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 p-4 pt-6 z-10">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contactAvatar} />
          <AvatarFallback className="bg-muted">
            {contactName.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground truncate">{contactName}</p>
          <p className="text-sm text-muted-foreground">{currentStatus.timestamp}</p>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:bg-foreground/10"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? <Play size={20} /> : <Pause size={20} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:bg-foreground/10"
            onClick={() => setIsMuted(!isMuted)}
          >
            {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-foreground hover:bg-foreground/10"
          >
            <MoreVertical size={20} />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-foreground hover:bg-foreground/10"
          onClick={onClose}
        >
          <X size={20} />
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center relative px-12">
        {/* Navigation buttons */}
        {(currentIndex > 0 || hasPrevious) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute left-2 h-12 w-12 rounded-full bg-background/20 hover:bg-background/40"
            onClick={handlePrevious}
          >
            <ChevronLeft size={24} />
          </Button>
        )}

        {currentStatus.type === 'text' && (
          <div className="text-center max-w-2xl px-8">
            <p className="text-3xl font-medium text-foreground whitespace-pre-wrap">
              {currentStatus.content}
            </p>
          </div>
        )}

        {currentStatus.type === 'image' && (
          <img 
            src={currentStatus.content} 
            alt="Status"
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        )}

        {currentStatus.type === 'video' && (
          <video 
            src={currentStatus.content}
            className="max-h-full max-w-full object-contain rounded-lg"
            autoPlay
            muted={isMuted}
            loop={false}
          />
        )}

        {(currentIndex < totalStatuses - 1 || hasNext) && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-2 h-12 w-12 rounded-full bg-background/20 hover:bg-background/40"
            onClick={handleNext}
          >
            <ChevronRight size={24} />
          </Button>
        )}
      </div>

      {/* Footer - Optional reply */}
      <div className="p-4 z-10">
        <div className="flex items-center gap-2">
          <input 
            type="text"
            placeholder="Digite uma resposta..."
            className="flex-1 bg-background/20 border border-border/30 rounded-full px-4 py-2 text-foreground placeholder:text-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
          <Button 
            size="icon" 
            className="h-10 w-10 rounded-full"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>
    </div>
  );
};
