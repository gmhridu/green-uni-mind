

export interface VideoResolution {
  url: string;
  quality: string;
  format?: string;
}

export interface ILecture {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  videoResolutions?: VideoResolution[];
  hlsUrl?: string;
  pdfUrl?: string;
  duration?: number;
  isPreviewFree?: boolean;
  courseId: string;
  order: number;
  thumbnailUrl?: string;
  views?: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICourse {
  progress?: number;
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  courseLevel: string;
  coursePrice?: number;
  courseThumbnail?: string;
  enrolledStudents?: string[];
  totalEnrollment?: number;
  lectures?: ILecture[];
  creator: string | { _id: string; name: string; profileImg?: string };
  isPublished: boolean;
  status: string;
  courseThumbnailPublicId?: string;
  isFree?: string;
  createdAt?: Date;
  updatedAt?: Date;
}