/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  BaseQueryApi,
  BaseQueryFn,
  createApi,
  DefinitionType,
  FetchArgs,
  fetchBaseQuery,
} from "@reduxjs/toolkit/query/react";
import { RootState } from "../store";
import { toast } from "sonner";
import { logout, setUser } from "../features/auth/authSlice";
import { config } from "@/config";

type ErrorResponse = {
  message: string;
};

const baseQuery = fetchBaseQuery({
  baseUrl: config.apiBaseUrl,
  credentials: "include",
  prepareHeaders: (headers, { getState }) => {
    const token = (getState() as RootState).auth?.token;

    if (token) {
      headers.set("authorization", `Bearer ${token}`);
      console.log("Setting authorization header:", `Bearer ${token}`);
    }

    return headers;
  },
});

const baseQueryWithRefreshToken: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  // Get the current token from state
  const token = (api.getState() as RootState).auth?.token;

  // Check if token exists and is not expired before making the request
  if (token) {
    try {
      // Simple check for token expiration (decode JWT and check exp)
      const tokenData = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = tokenData.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();

      // If token is expired or about to expire (within 30 seconds), refresh it first
      if (expirationTime - currentTime < 30000) {
        console.log('Token is about to expire, refreshing...');
        const refreshResult = await fetch(
          `${config.apiBaseUrl}/auth/refresh-token`,
          {
            method: "POST",
            credentials: "include", // Important!
          }
        );

        const refreshData = await refreshResult.json();

        if (refreshData?.data?.accessToken) {
          const user = (api.getState() as RootState).auth.user;

          // Update token in Redux
          api.dispatch(
            setUser({
              user,
              token: refreshData.data.accessToken,
            })
          );

          console.log('Token refreshed successfully');
        } else {
          // Refresh token failed => Force logout
          api.dispatch(logout());
          toast.error("Session expired. Please login again.");
          return { error: { status: 401, data: { message: 'Session expired' } } };
        }
      }
    } catch (error) {
      console.error('Error checking token expiration:', error);
      // Continue with the request even if token check fails
    }
  }

  // Make the original request
  let result = await baseQuery(args, api, extraOptions);

  // If token expired (401 Unauthorized)
  if (result.error?.status === 401) {
    console.log('Received 401 error, attempting to refresh token...');
    try {
      // Try refreshing token
      const refreshResult = await fetch(
        `${config.apiBaseUrl}/auth/refresh-token`,
        {
          method: "POST",
          credentials: "include", // Important!
        }
      );

      const refreshData = await refreshResult.json();

      if (refreshData?.data?.accessToken) {
        const user = (api.getState() as RootState).auth.user;

        // Update token in Redux
        api.dispatch(
          setUser({
            user,
            token: refreshData.data.accessToken,
          })
        );

        console.log('Token refreshed, retrying original request');
        // Retry the original failed request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh token failed => Force logout
        console.log('Token refresh failed, logging out');
        api.dispatch(logout());
        toast.error("Session expired. Please login again.");
      }
    } catch (error) {
      // If refresh API crashed
      console.error('Error during token refresh:', error);
      api.dispatch(logout());
      toast.error("Session expired. Please login again.");
    }
  }

  // Handle other server errors
  if (result.error?.status === 403) {
    const errorMessage =
      (result.error.data as ErrorResponse)?.message || "Forbidden";
    toast.error(errorMessage);
  }

  if (result.error?.status === 404) {
    toast.error((result.error.data as ErrorResponse)?.message || "Not found");
  }

  return result;
};

export const baseApi = createApi({
  reducerPath: "baseApi",
  tagTypes: [
    "getMe",
    "courses",
    "course",
    "lectures",
    "lecture",
    "enrolledCourses",
    "enrolledStudents",
    "courseProgress",
    "bookmarks",
    "questions",
    "notes"
  ],
  baseQuery: baseQueryWithRefreshToken,
  endpoints: () => ({}),
});
