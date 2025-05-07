import { baseApi } from "@/redux/api/baseApi";
import { RootState } from "@/redux/store";
import { createSlice } from "@reduxjs/toolkit";
import { clearCart } from "../cart/cartSlice";

export type TUser = {
  email: string;
  name: {
    firstName: string;
    middleName: string;
    lastName: string;
  };
  photoUrl?: string;
  profileImg?: string;
  role?: "student" | "teacher";
  isDeleted?: boolean;
  isVerified?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

const initialState = {
  user: null,
  token: null,
  isLoading: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.isLoading = false;
    },
    setIsLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(
      // Reset API on logout if needed
      baseApi.util.resetApiState,
      (state) => {}
    );
  },
});

export const { setUser, setIsLoading, logout } = authSlice.actions;
export default authSlice.reducer;

export const selectCurrentToken = (state: RootState) => state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
