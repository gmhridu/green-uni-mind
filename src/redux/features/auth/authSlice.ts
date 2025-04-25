import { RootState } from "@/redux/store";
import { createSlice } from "@reduxjs/toolkit";

export type TUserToken = {
  email: string;
  role: string;
  iat: number;
  exp: number;
};

type TUserName = {
  firstName: string;
  middleName?: string;
  lastName: string;
};

export type TUser = {
  email?: string;
  name?: TUserName;
  photoUrl?: string;
  profileImg?: string;
  role?: string;
  isDeleted?: boolean;
  isVerified?: boolean;
  createdAt?: string;
  updatedAt?: string;
};

type TAuthState = {
  user: null | TUser;
  token: null | string;
  isLoading: boolean;
};

const initialState: TAuthState = {
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
});

export const { setUser, setIsLoading, logout } = authSlice.actions;

export default authSlice.reducer;

export const useCurrentToken = (state: RootState) => state.auth.token;
export const selectCurrentUser = (state: RootState) => state.auth.user;

export const selectAuthLoading = (state: RootState) => state.auth.isLoading;
