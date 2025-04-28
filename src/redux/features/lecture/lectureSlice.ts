import { RootState } from "@/redux/store";
import { createSlice } from "@reduxjs/toolkit";

export type TLecture = {
  _id?: string;
  lectureTitle: string;
  shortInstruction?: string;
  videoUrl?: string;
  publicId?: string;
  isPreviewFree?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const initialState = {
  lecture: null,
  loading: false,
  error: null,
};

const lectureSlice = createSlice({
  name: "course",
  initialState,
  reducers: {
    setLecture: (state, action) => {
      state.lecture = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setLecture, setLoading, setError } = lectureSlice.actions;

export default lectureSlice.reducer;

export const selectCurrentLecture = (state: RootState) => state.lecture.lecture;
