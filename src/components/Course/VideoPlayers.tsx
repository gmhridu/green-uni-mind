import { VideoPlayer } from "react-video-audio-player";
import { cn } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  initialPosition?: number;
  onTimeUpdate?: (time: number) => void;
  onComplete?: () => void;
  onDurationChange?: (duration: number) => void;
  className?: string;
}

const VideoPlayers = ({
  src,
  initialPosition = 0,
  onTimeUpdate,
  onComplete,
  onDurationChange,
  className,
}: VideoPlayerProps) => {
  return (
    <div className={cn("rounded-lg overflow-hidden bg-black", className)}>
      <VideoPlayer
        src={src}
        autoPlay={false}
        controls
        playsInline
        accentColor="#10b981"
        defaultPlaybackRate={1}
        seekTo={initialPosition}
        showDownloadButton
        doubleClickToFullscreen
        disableShortcuts={false}
        onProgress={(currentTime: number, duration: number) => {
          onTimeUpdate?.(Math.floor(currentTime));
          if (currentTime / duration > 0.95) onComplete?.();
        }}
        onDuration={(duration: number) => {
          onDurationChange?.(duration);
        }}
        className="w-full h-full"
        style={{
          borderRadius: "12px",
        }}
      />
    </div>
  );
};

export default VideoPlayers;
