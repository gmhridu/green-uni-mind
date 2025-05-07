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
  let result = await baseQuery(args, api, extraOptions);

  // If token expired (401 Unauthorized)
  if (result.error?.status === 401) {
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

        // Retry the original failed request
        result = await baseQuery(args, api, extraOptions);
      } else {
        // Refresh token failed => Force logout
        api.dispatch(logout());
        toast.error("Session expired. Please login again.");
      }
    } catch (error) {
      // If refresh API crashed
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
  tagTypes: ["getMe", "courses", "course", "lectures", "lecture"],
  baseQuery: baseQueryWithRefreshToken,
  endpoints: () => ({}),
});
