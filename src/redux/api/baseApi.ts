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

      // Try to get user data from localStorage
      const storedUserData = localStorage.getItem("userData");
      if (storedUserData) {
        try {
          // If we have user data but no token, try to refresh the token
          const refreshToken = localStorage.getItem("refreshToken");
          if (refreshToken) {
            console.log("Found user data but no token, will try to refresh token");
            // We'll let the 401 handler handle this case
          }
        } catch (error) {
          console.error("Error checking stored user data:", error);
        }
      }
    }

    // Don't add custom headers that might cause CORS issues
    // The Authorization header is sufficient for authentication

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

  // Skip token expiration check for public endpoints
  const isPublicEndpoint =
    args.url.includes('/published-courses') ||
    args.url.includes('/search') ||
    (args.url.includes('/auth/') && !args.url.includes('/refresh-token'));

  if (token && !isPublicEndpoint) {
    try {
      console.log("Checking token expiration");

      // Parse the JWT token to check expiration
      const tokenData = JSON.parse(atob(token.split(".")[1]));
      const expirationTime = tokenData.exp * 1000;
      const currentTime = Date.now();
      const timeToExpiration = expirationTime - currentTime;

      console.log(`Token expires in ${Math.floor(timeToExpiration / 1000)} seconds`);

      // If token is already expired or expires in less than 5 minutes, refresh it
      if (timeToExpiration <= 0) {
        console.log("Token already expired, refreshing immediately");
        // We'll let the 401 handler below handle this case
        // This will ensure we don't make two refresh attempts
      }
      else if (timeToExpiration < 300000) {
        console.log("Token expiring soon, refreshing proactively");

        // Get the refresh token from localStorage
        const storedRefreshToken = localStorage.getItem("refreshToken");

        if (!storedRefreshToken) {
          console.log("No refresh token found in localStorage");
          // Continue with the request even without refresh token
        } else {
          // Try to refresh the token with multiple approaches
          try {
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

            if (refreshResult.ok) {
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
              }
            } else {
              console.log("Proactive refresh failed with status:", refreshResult.status);
              // Continue with the request even if refresh failed
            }
          } catch (refreshError) {
            console.error("Error during token refresh:", refreshError);
            // Continue with the request even if refresh failed
          }
        }
      }
    } catch (error) {
      console.error("Error checking token expiration:", error);
      // This could be because the token is malformed or invalid
      // We'll let the request proceed and handle any 401 errors below
    }
  } else if (!isPublicEndpoint) {
    console.log("No token available for expiration check");
  }

  // We already defined isPublicEndpoint above, reuse it here

  // For public endpoints, don't add auth headers
  if (isPublicEndpoint) {
    // Clone args and remove any auth headers for public endpoints
    const publicArgs = { ...args };
    if (publicArgs.headers) {
      const headers = publicArgs.headers as Record<string, string>;
      delete headers.authorization;
    }
    return baseQuery(publicArgs, api, extraOptions);
  }

  // For protected endpoints, proceed with normal flow
  let result = await baseQuery(args, api, extraOptions);

  // Handle 401 errors by trying to refresh the token
  if (result.error?.status === 401) {
    try {
      console.log("Received 401 error, attempting to refresh token");

      // Check if the error is specifically about token expiration
      const errorData = result.error.data as ErrorResponse | undefined;
      const errorMessage = errorData?.message || '';
      const isTokenExpired =
        errorMessage.includes('expired') ||
        errorMessage.includes('jwt expired');

      if (isTokenExpired) {
        console.log("Token expired error confirmed:", errorMessage);
      }

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

        // Try to get more detailed error information
        try {
          const errorData = await refreshResult.json();
          console.error("Refresh token error details:", errorData);
        } catch (e) {
          console.error("Could not parse refresh token error response");
        }

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

        // Retry the original failed request with the new token
        console.log("Retrying original request with new token");

        // Create a new args object with the updated token
        const newArgs = { ...args };
        if (newArgs.headers) {
          const headers = newArgs.headers as Record<string, string>;
          headers.authorization = `Bearer ${refreshData.data.accessToken}`;
        }

        result = await baseQuery(newArgs, api, extraOptions);
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
