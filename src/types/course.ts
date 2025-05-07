import { Types } from 'mongoose';

export interface ILecture {
  _id: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl?: string;
  pdfUrl?: string;
  duration?: number;
  isPreviewFree?: boolean;
  courseId: string;
  order: number;
}

export interface ICourse {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  category: string;
  courseLevel: string;
  coursePrice?: number;
  courseThumbnail?: string;
  enrolledStudents?: Types.ObjectId[];
  lectures?: ILecture[];
  creator: Types.ObjectId;
  isPublished: boolean;
  status: string;
  courseThumbnailPublicId?: string;
  isFree?: string;
  createdAt?: Date;
  updatedAt?: Date;
} 