import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setUser } from "@/redux/features/auth/authSlice";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation({
      query: (userInfo) => ({
        url: "/auth/login",
        method: "POST",
        body: userInfo,
      }),
      transformResponse: (response) => {
        // Store tokens in localStorage as a fallback mechanism
        // This is used only if cookies don't work in production
        if (response.data.refreshToken) {
          localStorage.setItem("refreshToken", response.data.refreshToken);
        }

        // Also store the access token for OAuth linking
        if (response.data.accessToken) {
          localStorage.setItem("accessToken", response.data.accessToken);
        }

        // Ensure the user role is preserved
        const user = {
          ...response.data.user,
          photoUrl: response.data.user.profileImg ?? null,
          // Explicitly set the role from the backend response
          role: response.data.user.role,
        };

        // Log the user role for debugging
        console.log("User role from login response:", user.role);

        // Store the user role in localStorage for verification
        // Check all possible locations for the role
        const userRole = user.role || user.user?.role;
        if (userRole) {
          localStorage.setItem("userRole", userRole);
          console.log("Stored user role in localStorage from login:", userRole);
        }

        return {
          user,
          token: response.data.accessToken,
        };
      },
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          console.log("Login successful, token obtained");
        } catch (error) {
          console.error("Login error:", error);
        }
      },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
      async onQueryStarted(_, { queryFulfilled }) {
        try {
          await queryFulfilled;
          // Clear tokens from localStorage
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("accessToken");
          console.log("Logout successful, tokens cleared");
        } catch (error) {
          console.error("Logout error:", error);
          // Still remove tokens from localStorage even if the API call fails
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("accessToken");
        }
      },
    }),
    register: builder.mutation({
      query: (userInfo) => ({
        url: "/users/create-student",
        method: "POST",
        body: userInfo,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            dispatch(
              authApi.endpoints.getMe.initiate({
                forceRefetch: true,
              })
            );
          }
        } catch (error) {
          // ignore
        }
      },
    }),
    registerTeacher: builder.mutation({
      query: (userInfo) => ({
        url: "/users/create-teacher",
        method: "POST",
        body: userInfo,
      }),
      async onQueryStarted(_, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          if (data?.user) {
            dispatch(
              authApi.endpoints.getMe.initiate({
                forceRefetch: true,
              })
            );
          }
        } catch (error) {
          // ignore
        }
      },
    }),
    getMe: builder.query({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),

      providesTags: ["getMe"],
      transformResponse: (response: TResponseRedux<any>) => {
        // Ensure the user role is preserved
        if (response.data) {
          // Check all possible locations for the role
          const userRole = response.data.role || response.data.user?.role;

          if (userRole) {
            // Log the user role for debugging
            console.log("User role from getMe response:", userRole);

            // Store the user role in localStorage for verification
            localStorage.setItem("userRole", userRole);
            console.log("Stored user role in localStorage from getMe:", userRole);
          }
        }

        return {
          data: response.data,
        };
      },
    }),
    updateUserProfile: builder.mutation({
      query: (args) => ({
        url: `/users/edit-profile/${args.id}`,
        method: "PATCH",
        body: args.data,
      }),
      invalidatesTags: ["getMe"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),
    // Password management endpoints
    changePassword: builder.mutation({
      query: (passwordData) => ({
        url: "/auth/change-password",
        method: "POST",
        body: passwordData,
      }),
    }),
    forgotPassword: builder.mutation({
      query: (email) => ({
        url: "/auth/forget-password",
        method: "POST",
        body: { email },
      }),
    }),
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
        headers: data.token ? { Authorization: data.token } : {},
      }),
    }),

    // OAuth account management
    linkOAuthAccount: builder.mutation({
      query: (data) => ({
        url: "/oauth/link",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
    unlinkOAuthAccount: builder.mutation({
      query: (data) => ({
        url: "/oauth/unlink",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),

    // Email verification
    verifyEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-email",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
    resendVerificationEmail: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-verification",
        method: "POST",
        body: data,
      }),
    }),

    // Two-factor authentication
    setupTwoFactor: builder.mutation({
      query: (userId) => ({
        url: `/auth/2fa/setup/${userId}`,
        method: "GET",
      }),
    }),
    verifyTwoFactor: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/verify",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
    verifyLoginTwoFactor: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/login-verify",
        method: "POST",
        body: data,
      }),
    }),
    disableTwoFactor: builder.mutation({
      query: (data) => ({
        url: "/auth/2fa/disable",
        method: "POST",
        body: data,
      }),
      invalidatesTags: ["getMe"],
    }),
  }),
  overrideExisting: false,
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useRegisterTeacherMutation,
  useGetMeQuery,
  useUpdateUserProfileMutation,
  useLogoutMutation,
  // Password management hooks
  useChangePasswordMutation,
  useForgotPasswordMutation,
  useResetPasswordMutation,
  // OAuth account management hooks
  useLinkOAuthAccountMutation,
  useUnlinkOAuthAccountMutation,
  // Email verification hooks
  useVerifyEmailMutation,
  useResendVerificationEmailMutation,
  // Two-factor authentication hooks
  useSetupTwoFactorMutation,
  useVerifyTwoFactorMutation,
  useVerifyLoginTwoFactorMutation,
  useDisableTwoFactorMutation,
} = authApi;
