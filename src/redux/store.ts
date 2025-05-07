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

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: persistedAuthReducer,
    course: persistedCourseReducer,
    lecture: persistedLectureReducer,
    cart: persistedCartReducer,
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
