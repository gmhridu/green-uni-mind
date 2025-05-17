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
      transformResponse: (response) => ({
        user: {
          ...response.data.user,
          photoUrl: response.data.user.profileImg ?? null,
        },
        token: response.data.accessToken,
      }),
      // async onQueryStarted(_, { dispatch, queryFulfilled }) {
      //   try {
      //     const { data } = await queryFulfilled;
      //     if (data?.user) {
      //       dispatch(
      //         authApi.endpoints.getMe.initiate(undefined, {
      //           forceRefetch: true,
      //         })
      //       );
      //     }
      //   } catch (error) {
      //     // ignore
      //   }
      // },
    }),
    logout: builder.mutation({
      query: () => ({
        url: "/auth/logout",
        method: "POST",
      }),
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
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
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
} = authApi;
