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
import { config } from "@/config";

const persistConfig = {
  key: "auth",
  storage,
};

// const persistedAuthReducer = persistReducer(persistConfig, authReducer);

const safeAuthReducer =
  config.node_env === "production"
    ? () => undefined
    : persistReducer(persistConfig, authReducer);

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    auth: safeAuthReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(baseApi.middleware),

  // 🔒 Disable Redux DevTools in production
  devTools: config.node_env === "production" ? false : true,
});

export type RootState = ReturnType<typeof store.getState>;

export type AppDispatch = typeof store.dispatch;

// 👇 Don't even create persistor in production
export const persistor =
  config.node_env === "production" ? persistStore(store) : null;
