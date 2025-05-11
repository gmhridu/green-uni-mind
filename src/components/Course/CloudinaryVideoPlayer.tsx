import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { useAppDispatch } from '@/redux/hooks';
import { setLastPosition as setLastPositionAction } from '@/redux/features/player/playerSlice';
import ReactPlayer from 'react-player';

interface VideoPlayerProps {
  src: string;
  initialPosition?: number;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
  onDurationChange?: (duration: number) => void;
  onReady?: () => void;
  className?: string;
  poster?: string;
  videoId?: string;
}

const CloudinaryVideoPlayer: React.FC<VideoPlayerProps> = ({
  src,
  initialPosition = 0,
  onTimeUpdate,
  onComplete,
  onDurationChange,
  onReady,
  className,
  poster,
  videoId,
}) => {
  const playerRef = useRef<ReactPlayer>(null);
  const isReadyRef = useRef(false);
  const { toast } = useToast();
  const dispatch = useAppDispatch();
  const [isPlaying, setIsPlaying] = useState(false);
  const [played, setPlayed] = useState(0);
  const [seeking, setSeeking] = useState(false);
  const [duration, setDuration] = useState(0);

  // Memoize handlers to prevent unnecessary re-renders
  const handlePlay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const handlePause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const handleProgress = useCallback((state: { played: number; playedSeconds: number; loaded: number; loadedSeconds: number }) => {
    if (!seeking) {
      setPlayed(state.played);
      onTimeUpdate?.(state.playedSeconds);
      if (videoId) {
        dispatch(setLastPositionAction({ videoId, position: state.playedSeconds }));
      }
    }
  }, [seeking, onTimeUpdate, videoId, dispatch]);

  const handleDuration = useCallback((duration: number) => {
    setDuration(duration);
    onDurationChange?.(duration);
  }, [onDurationChange]);

  const handleEnded = useCallback(() => {
    setIsPlaying(false);
    onComplete?.();
  }, [onComplete]);

  const handleReady = useCallback(() => {
    if (!isReadyRef.current) {
      isReadyRef.current = true;
      if (initialPosition > 0 && playerRef.current) {
        playerRef.current.seekTo(initialPosition);
      }
      onReady?.();
    }
  }, [initialPosition, onReady]);

  const handleError = useCallback((error: any) => {
    console.error('Video player error:', error);
    toast({
      title: "Video Error",
      description: "There was an error playing the video. Please try refreshing the page.",
      variant: "destructive"
    });
  }, [toast]);

  // Handle keyboard controls
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!playerRef.current) return;

    let seekBackward: number;
    let seekForward: number;
    let videoElement: HTMLVideoElement | null;
    let video: HTMLVideoElement | null;
    let percentage: number;

    switch (event.key.toLowerCase()) {
      case ' ':
      case 'k':
        event.preventDefault();
        setIsPlaying(prev => !prev);
        break;
      case 'arrowleft':
        event.preventDefault();
        seekBackward = Math.max(0, played * duration - 10);
        playerRef.current.seekTo(seekBackward);
        break;
      case 'arrowright':
        event.preventDefault();
        seekForward = Math.min(duration, played * duration + 10);
        playerRef.current.seekTo(seekForward);
        break;
      case 'f':
        event.preventDefault();
        videoElement = document.querySelector('video');
        if (videoElement) {
          if (document.fullscreenElement) {
            document.exitFullscreen();
          } else {
            videoElement.requestFullscreen();
          }
        }
        break;
      case 'm':
        event.preventDefault();
        video = document.querySelector('video');
        if (video) {
          video.muted = !video.muted;
        }
        break;
      case '0':
      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
      case '6':
      case '7':
      case '8':
      case '9':
        event.preventDefault();
        percentage = parseInt(event.key) / 10;
        playerRef.current.seekTo(percentage);
        break;
    }
  }, [played, duration]);

  // Add keyboard event listener
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isReadyRef.current = false;
    };
  }, []);

  return (
    <div className={cn("relative aspect-video bg-black", className)}>
      <ReactPlayer
        ref={playerRef}
        url={src}
        playing={isPlaying}
        controls={true}
        width="100%"
        height="100%"
        onPlay={handlePlay}
        onPause={handlePause}
        onProgress={handleProgress}
        onDuration={handleDuration}
        onEnded={handleEnded}
        onReady={handleReady}
        onError={handleError}
        config={{
          file: {
            attributes: {
              poster: poster,
              crossOrigin: "anonymous",
            },
            forceVideo: true,
          },
        }}
      />
    </div>
  );
};

export default CloudinaryVideoPlayer;