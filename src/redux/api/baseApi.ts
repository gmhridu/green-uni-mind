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
    // Get token from Redux store
    const token = (getState() as RootState).auth?.token;

    // If no token in Redux, try localStorage as fallback
    const localToken = !token ? localStorage.getItem("accessToken") : null;

    // Use token from Redux or localStorage
    const finalToken = token || localToken;

    if (finalToken) {
      headers.set("authorization", `Bearer ${finalToken}`);
      console.log("Setting authorization header with token");
    } else {
      console.log("No token available for authorization header");
    }

    // Add CORS headers for production
    if (config.node_env === 'production') {
      headers.set('X-Requested-With', 'XMLHttpRequest');
    }

    return headers;
  },
});

const baseQueryWithRefreshToken: BaseQueryFn<
  FetchArgs,
  BaseQueryApi,
  DefinitionType
> = async (args, api, extraOptions): Promise<any> => {
  // Get token from Redux store or localStorage
  const token = (api.getState() as RootState).auth?.token || localStorage.getItem("accessToken");

  if (token) {
    try {
      console.log("Checking token expiration");

      // Parse the JWT token to check expiration
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeToExpiration = expirationTime - currentTime;

      console.log(`Token expires in ${Math.floor(timeToExpiration / 1000)} seconds`);

      // If token expires in less than 5 minutes, refresh it
      if (timeToExpiration < 300000) {
        console.log("Token expiring soon, refreshing");

        // Get the refresh token from localStorage
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (!storedRefreshToken) {
          console.log("No refresh token found in localStorage");
          return;
        }

        // Try to refresh the token with multiple approaches
        const refreshResult = await fetch(
          `${config.apiBaseUrl}/auth/refresh-token`,
          {
            method: "POST",
            credentials: "include",
            headers: {
              "Content-Type": "application/json",
              "X-Refresh-Token": "true",
              "Authorization": `Bearer ${storedRefreshToken}` // Also try as Authorization header
            },
            // Also send the token in the body as a fallback
            body: JSON.stringify({
              refreshToken: storedRefreshToken
            }),
          }
        );

        if (!refreshResult.ok) {
          console.log("Proactive refresh failed with status:", refreshResult.status);
          return;
        }

        const refreshData = await refreshResult.json();

        if (refreshData?.data?.accessToken) {
          console.log("New access token received from proactive refresh");

          // Store the new tokens
          if (refreshData.data.refreshToken) {
            localStorage.setItem("refreshToken", refreshData.data.refreshToken);
          }
          localStorage.setItem("accessToken", refreshData.data.accessToken);

          const user = (api.getState() as RootState).auth.user;

          api.dispatch(
            setUser({
              user,
              token: refreshData.data.accessToken,
            })
          );
        } else {
          console.log("No access token in proactive refresh response");
          api.dispatch(logout());
          return {
            error: { status: 401, data: { message: "Session expired" } },
          };
        }
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
    }
  } else {
    console.log("No token available for expiration check");
  }

  let result = await baseQuery(args, api, extraOptions);
  if (result.error?.status === 401) {
    try {
      console.log("Received 401 error, attempting to refresh token");

      // Get the refresh token from localStorage
      const storedRefreshToken = localStorage.getItem("refreshToken");

      if (!storedRefreshToken) {
        console.log("No refresh token found in localStorage, logging out");
        api.dispatch(logout());
        return result;
      }

      console.log("Refresh token found, attempting to refresh");

      // Try to refresh the token with both cookie and body approach
      const refreshResult = await fetch(
        `${config.apiBaseUrl}/auth/refresh-token`,
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            "X-Refresh-Token": "true",
            "Authorization": `Bearer ${storedRefreshToken}` // Also try as Authorization header
          },
          // Also send the token in the body as a fallback
          body: JSON.stringify({
            refreshToken: storedRefreshToken
          }),
        }
      );

      if (!refreshResult.ok) {
        console.log("Refresh token request failed with status:", refreshResult.status);
        api.dispatch(logout());
        return result;
      }

      const refreshData = await refreshResult.json();
      console.log("Refresh token response:", refreshData);

      if (refreshData?.data?.accessToken) {
        console.log("New access token received, updating Redux store");

        // Store the new tokens
        if (refreshData.data.refreshToken) {
          localStorage.setItem("refreshToken", refreshData.data.refreshToken);
        }
        localStorage.setItem("accessToken", refreshData.data.accessToken);

        const user = (api.getState() as RootState).auth.user;

        // Update token in Redux
        api.dispatch(
          setUser({
            user,
            token: refreshData.data.accessToken,
          })
        );

        // Retry the original failed request
        console.log("Retrying original request with new token");
        result = await baseQuery(args, api, extraOptions);
      } else {
        console.log("No access token in refresh response, logging out");
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
