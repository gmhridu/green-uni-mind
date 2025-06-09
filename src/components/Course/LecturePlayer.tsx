import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectLastPosition } from '@/redux/features/player/playerSlice';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { isCloudinaryUrl } from '@/utils/videoUtils';
import CloudinaryVideoPlayer from './CloudinaryVideoPlayer';

interface Lecture {
  _id: string;
  title: string;
  description: string;
  videoUrl: string;
  videoResolutions?: Array<{ url: string; quality: string; format?: string }>;
  hlsUrl?: string;
  duration: number;
  poster?: string;
  cloudinaryPublicId?: string;
}

interface LecturePlayerProps {
  lecture: Lecture;
  nextLectureId?: string;
  prevLectureId?: string;
  onComplete?: (lectureId: string) => void;
  courseId: string;
}

const LecturePlayer: React.FC<LecturePlayerProps> = ({
  lecture,
  nextLectureId,
  prevLectureId,
  onComplete,
  courseId,
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [isCompleted, setIsCompleted] = useState(false);
  
  // Get the last position from Redux
  const lastPosition = useAppSelector((state) => 
    selectLastPosition(state, lecture._id)
  );

  // Determine if we should use Cloudinary player
  const isCloudinary = isCloudinaryUrl(lecture.videoUrl);
  const cloudName = isCloudinary ? 'your-cloud-name' : undefined; // Replace with your actual cloud name
  
  // Extract Cloudinary public ID if available
  const publicId = lecture.cloudinaryPublicId || undefined;

  // Handle video completion
  const handleComplete = (player: any) => {
    if (!isCompleted) {
      setIsCompleted(true);
      
      // Call the onComplete callback
      if (onComplete) {
        onComplete(lecture._id);
      }
      
      // Show completion toast
      toast({
        title: 'Lecture Completed',
        description: 'You have completed this lecture.',
        variant: 'default',
      });
    }
  };

  // Handle navigation to next lecture
  const handleNextLecture = () => {
    if (nextLectureId) {
      navigate(`/courses/${courseId}/lectures/${nextLectureId}`);
    } else {
      // Show toast if there's no next lecture
      toast({
        title: 'End of Course',
        description: 'You have reached the end of this course.',
        variant: 'default',
      });
    }
  };

  // Handle navigation to previous lecture
  const handlePrevLecture = () => {
    if (prevLectureId) {
      navigate(`/courses/${courseId}/lectures/${prevLectureId}`);
    }
  };

  return (
    <div className="lecture-player-container">
      <div className="video-container mb-4">
        <CloudinaryVideoPlayer
          src={lecture.videoUrl}
          initialPosition={lastPosition}
          poster={lecture.poster}
          videoId={lecture._id}
        />
      </div>
      
      <div className="lecture-navigation flex justify-between mt-4">
        <Button
          variant="outline"
          onClick={handlePrevLecture}
          disabled={!prevLectureId}
          className="flex items-center"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Previous Lecture
        </Button>
        
        <Button
          variant="default"
          onClick={handleNextLecture}
          disabled={!nextLectureId}
          className="flex items-center"
        >
          Next Lecture
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
      
      <div className="lecture-info mt-6">
        <h2 className="text-2xl font-bold mb-2">{lecture.title}</h2>
        <p className="text-gray-700">{lecture.description}</p>
      </div>
    </div>
  );
};

export default LecturePlayer;
