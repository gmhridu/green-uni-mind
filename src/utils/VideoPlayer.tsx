import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  PictureInPicture,
  Settings,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

export const VideoPlayer = ({
  src,
  poster,
  autoPlay = false,
  className = "",
}: VideoPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [qualities, setQualities] = useState<
    { label: string; level: number }[]
  >([]);
  const [currentQuality, setCurrentQuality] = useState(-1); // -1 for auto

  // Initialize HLS.js or native playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Clear previous sources
    video.src = "";

    // Check if this is an HLS stream
    const isHls = src.endsWith(".m3u8");

    if (isHls && Hls.isSupported()) {
      // Handle HLS stream
      const hls = new Hls();
      hlsRef.current = hls;

      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play();
        const levels = hls.levels.map((level, index) => ({
          label: `${level.height}p`,
          level: index,
        }));
        setQualities([{ label: "Auto", level: -1 }, ...levels]);
        setIsLoading(false);
      });

      hls.on(Hls.Events.ERROR, (event, data) => {
        console.error("HLS Error:", data);
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              toast.error("Network error - trying to recover");
              hls.startLoad();
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              toast.error("Media error - trying to recover");
              hls.recoverMediaError();
              break;
            default:
              // Fallback to direct source if HLS fails
              video.src = src.replace(".m3u8", ".mp4");
              video.load();
              break;
          }
        }
      });
    } else {
      // Handle direct video files (MP4, WebM, etc)
      video.src = src;
      video.load();

      const handleCanPlay = () => {
        setIsLoading(false);
        setDuration(video.duration);
        if (autoPlay) video.play();
      };

      video.addEventListener("canplay", handleCanPlay);
      video.addEventListener("error", () => {
        setIsLoading(false);
        toast.error("Failed to load video");
      });

      return () => {
        video.removeEventListener("canplay", handleCanPlay);
      };
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }
    };
  }, [src, autoPlay]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    const newVolume = value[0];
    video.volume = newVolume;
    video.muted = newVolume === 0;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
    if (video.muted) {
      setVolume(0);
    } else {
      setVolume(video.volume || 1);
    }
  };

  const handleSeek = (value: number[]) => {
    const video = videoRef.current;
    if (!video) return;

    video.currentTime = value[0] * duration;
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;

    if (!document.fullscreenElement) {
      containerRef.current
        .requestFullscreen()
        .then(() => setIsFullscreen(true))
        .catch(console.error);
    } else {
      document
        .exitFullscreen()
        .then(() => setIsFullscreen(false))
        .catch(console.error);
    }
  };

  const togglePiP = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (video !== document.pictureInPictureElement) {
        await video.requestPictureInPicture();
      } else {
        await document.exitPictureInPicture();
      }
    } catch (error) {
      console.error("PiP error:", error);
    }
  };

  const changeQuality = (level: number) => {
    if (hlsRef.current) {
      hlsRef.current.currentLevel = level;
      setCurrentQuality(level);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full aspect-video bg-black rounded-lg overflow-hidden group ${className}`}
    >
      <video
        ref={videoRef}
        poster={poster}
        className="w-full h-full object-contain"
        onClick={togglePlay}
      />

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
        </div>
      )}

      {/* Controls overlay */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        {/* Timeline/progress bar */}
        <div className="flex items-center mb-2 gap-2">
          <Slider
            value={[duration ? currentTime / duration : 0]}
            onValueChange={handleSeek}
            max={1}
            step={0.01}
            className="flex-1"
          />
          <span className="text-xs text-white min-w-[40px] text-right">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>
        </div>

        {/* Bottom controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleMute}
                className="text-white hover:text-gray-300 transition-colors"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="h-5 w-5" />
                ) : (
                  <Volume2 className="h-5 w-5" />
                )}
              </button>

              <Slider
                value={[volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="w-20"
              />
            </div>

            <button
              onClick={() => {
                const video = videoRef.current;
                if (video) video.currentTime = 0;
              }}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {qualities.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="text-white hover:text-gray-300 transition-colors">
                    <Settings className="h-5 w-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-32">
                  {qualities.map((quality) => (
                    <DropdownMenuItem
                      key={quality.level}
                      onClick={() => changeQuality(quality.level)}
                      className={
                        currentQuality === quality.level ? "bg-gray-100" : ""
                      }
                    >
                      {quality.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}

            <button
              onClick={togglePiP}
              className="text-white hover:text-gray-300 transition-colors"
            >
              <PictureInPicture className="h-5 w-5" />
            </button>

            <button
              onClick={toggleFullscreen}
              className="text-white hover:text-gray-300 transition-colors"
            >
              {isFullscreen ? (
                <Minimize className="h-5 w-5" />
              ) : (
                <Maximize className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
