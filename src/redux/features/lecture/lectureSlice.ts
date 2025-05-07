import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface ILecture {
  _id?: string;
  lectureTitle: string;
  instruction?: string;
  videoUrl: string;
  pdfUrl?: string;
  isPreviewFree: boolean;
  courseId: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// For the Redux slice state
export interface ILectureState {
  lectures: ILecture[];
  isLoading: boolean;
  error: string | null;
  uploadProgress: {
    video: number;
    pdf: number;
  };
}
const initialState: ILectureState = {
  lectures: [],
  isLoading: false,
  error: null,
  uploadProgress: {
    video: 0,
    pdf: 0,
  },
};

const lectureSlice = createSlice({
  name: "lecture",
  initialState,
  reducers: {
    // For general loading state
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // For error messages
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    // For storing lectures list
    setLectures: (state, action: PayloadAction<ILecture[]>) => {
      state.lectures = action.payload;
    },

    // For adding a single lecture
    addLecture: (state, action: PayloadAction<ILecture>) => {
      state.lectures.push(action.payload);
    },

    // For upload progress tracking
    setVideoUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress.video = action.payload;
    },

    setPdfUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress.pdf = action.payload;
    },

    // Reset upload progress
    resetUploadProgress: (state) => {
      state.uploadProgress = {
        video: 0,
        pdf: 0,
      };
    },

    // Reset entire state
    resetLectureState: () => initialState,
  },
});

export const {
  setLoading,
  setError,
  setLectures,
  addLecture,
  setVideoUploadProgress,
  setPdfUploadProgress,
  resetUploadProgress,
  resetLectureState,
} = lectureSlice.actions;

export default lectureSlice.reducer;
