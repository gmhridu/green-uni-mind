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
    }

    return headers;
  },
});

const baseQueryWithRefreshToken: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  const token = (api.getState() as RootState).auth?.token;

  if (token) {
    try {
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();

      if (expirationTime - currentTime < 30000) {
        const refreshResult = await fetch(
          `${config.apiBaseUrl}/auth/refresh-token`,
          {
            method: "POST",
            credentials: "include",
          }
        );

        const refreshData = await refreshResult.json();

        if (refreshData?.data?.accessToken) {
          const user = (api.getState() as RootState).auth.user;

          api.dispatch(
            setUser({
              user,
              token: refreshData.data.accessToken,
            })
          );
        } else {
          api.dispatch(logout());
          return {
            error: { status: 401, data: { message: "Session expired" } },
          };
        }
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
    }
  }

  let result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    try {
      const refreshResult = await fetch(
        `${config.apiBaseUrl}/auth/refresh-token`,
        {
          method: "POST",
          credentials: "include",
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

        // Retry the original failed request
        result = await baseQuery(args, api, extraOptions);
      } else {
        api.dispatch(logout());
      }
    } catch (error) {
      // If refresh API crashed
      console.error("Error during token refresh:", error);
      api.dispatch(logout());
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
    "UpcomingPayout",
    "questions",
    "notes",
    "Payouts",
    "PayoutPreferences",
    "Payout",
  ],
  baseQuery: baseQueryWithRefreshToken,
  endpoints: () => ({}),
});
