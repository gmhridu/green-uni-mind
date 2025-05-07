import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setError, setLoading } from "./courseSlice";

export const courseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createCourse: builder.mutation({
      query: (args) => ({
        url: `/courses/create-course/${args.id}`,
        method: "POST",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error creating course"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["courses", "course"],
    }),
    getCreatorCourse: builder.query({
      query: (args) => ({
        url: `/courses/creator/${args.id}`,
        method: "GET",
      }),
      providesTags: ["courses", "course"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),
    getPublishedCourses: builder.query({
      query: () => ({
        url: "/courses/published-courses",
        method: "GET",
      }),
      providesTags: ["courses"],
      transformResponse: (response: TResponseRedux<any>) => {
        // The backend returns the courses directly in the data field
        return response.data;
      },
    }),
  }),
});

export const { 
  useCreateCourseMutation, 
  useGetCreatorCourseQuery,
  useGetPublishedCoursesQuery,
} = courseApi;
