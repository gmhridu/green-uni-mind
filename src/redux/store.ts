import { configureStore } from "@reduxjs/toolkit";
import { baseApi } from "./api/baseApi";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";
import authReducer from "../redux/features/auth/authSlice";
import courseReducer from "../redux/features/course/courseSlice";
import lectureReducer from "../redux/features/lecture/lectureSlice";
import cartReducer from "@/redux/features/cart/cartSlice";
import studentReducer from "@/redux/features/student/studentSlice";
import teacherReducer from "@/redux/features/teacher/teacherSlice";
import playerReducer from "@/redux/features/player/playerSlice";
import noteReducer from "@/redux/features/note/noteSlice";
import bookmarkReducer from "@/redux/features/bookmark/bookmarkSlice";
import questionReducer from "@/redux/features/question/questionSlice";
import { config } from "@/config";

const persistConfig = {
  key: "auth",
  storage,
};

const persistCourseConfig = {
  key: "course",
  storage,
};

const persistLectureConfig = {
  key: "lecture",
  storage,
};

const persistCartConfig = {
  key: "cart",
  storage,
};

const persistStudentConfig = {
  key: "student",
  storage,
};

const persistTeacherConfig = {
  key: "teacher",
  storage,
};

const persistPlayerConfig = {
  key: "player",
  storage,
};

const persistNoteConfig = {
  key: "note",
  storage,
};

const persistBookmarkConfig = {
  key: "bookmark",
  storage,
};

const persistQuestionConfig = {
  key: "question",
  storage,
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedCourseReducer = persistReducer(
  persistCourseConfig,
  courseReducer
);
const persistedLectureReducer = persistReducer(
  persistLectureConfig,
  lectureReducer
);

const persistedCartReducer = persistReducer(persistCartConfig, cartReducer);
const persistedStudentReducer = persistReducer(persistStudentConfig, studentReducer);
const persistedTeacherReducer = persistReducer(persistTeacherConfig, teacherReducer);
const persistedPlayerReducer = persistReducer(persistPlayerConfig, playerReducer);
const persistedNoteReducer = persistReducer(persistNoteConfig, noteReducer);
const persistedBookmarkReducer = persistReducer(persistBookmarkConfig, bookmarkReducer);
const persistedQuestionReducer = persistReducer(persistQuestionConfig, questionReducer);

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: persistedAuthReducer,
    course: persistedCourseReducer,
    lecture: persistedLectureReducer,
    cart: persistedCartReducer,
    student: persistedStudentReducer,
    teacher: persistedTeacherReducer,
    player: persistedPlayerReducer,
    note: persistedNoteReducer,
    bookmark: persistedBookmarkReducer,
    question: persistedQuestionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),
  // 👇 This is all you need to hide DevTools in production
  devTools: config.node_env === "development",
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// Only enable persistStore in development
export const persistor = persistStore(store);
