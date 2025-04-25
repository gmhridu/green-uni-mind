import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";

const authApi = baseApi.injectEndpoints({
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
    }),

    getMe: builder.query({
      query: () => ({
        url: "/users/me",
        method: "GET",
      }),
      providesTags: ["getMe"],
      transformResponse: (response: TResponseRedux<any>) => {
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
      transformResponse: (response: TResponseRedux<any>) => {
        return {
          data: response.data,
        };
      },
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetMeQuery,
  useUpdateUserProfileMutation,
  useLogoutMutation,
} = authApi;
