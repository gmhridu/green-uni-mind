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
        // Handle potential errors or empty responses
        if (!response || !response.data) {
          console.error("Invalid response from published courses API:", response);
          return { data: [], meta: {} };
        }

        // The backend returns the courses directly in the data field
        return {
          data: response.data,
          meta: response.meta,
        };
      },
      // Add error handling
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching published courses:", error);
          // Don't dispatch logout for public endpoint errors
        }
      },
    }),
    getPopularCourses: builder.query({
      query: (limit?: number) => ({
        url: `/courses/popular-courses${limit ? `?limit=${limit}` : ''}`,
        method: "GET",
      }),
      providesTags: ["courses"],
      transformResponse: (response: TResponseRedux<any>) => {
        // Handle potential errors or empty responses
        if (!response || !response.data) {
          console.error("Invalid response from popular courses API:", response);
          return { data: [] };
        }

        return {
          data: response.data,
        };
      },
      // Add error handling
      onQueryStarted: async (_, { queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error) {
          console.error("Error fetching popular courses:", error);
          // Don't dispatch logout for public endpoint errors
        }
      },
    }),
    getCourseById: builder.query({
      query: (id) => {
        console.log("getCourseById query function called with ID:", id);
        if (!id) {
          console.error("getCourseById called with invalid ID:", id);
          throw new Error("Invalid course ID");
        }
        return {
          url: `/courses/${id}`,
          method: "GET",
        };
      },
      providesTags: ["course"],
      transformResponse: (response: TResponseRedux<any>) => {
        console.log("getCourseById response:", response);
        if (!response.data) {
          console.error("No data in response:", response);
          throw new Error("No course data found");
        }
        return {
          data: response.data,
        };
      },
      // Add error handling
      onQueryStarted: async (id, { dispatch, queryFulfilled }) => {
        try {
          console.log("getCourseById query started for ID:", id);
          const result = await queryFulfilled;
          console.log(
            "getCourseById query fulfilled for ID:",
            id,
            "Result:",
            result
          );
        } catch (error) {
          console.error("getCourseById query failed for ID:", id, error);
        }
      },
    }),
    editCourse: builder.mutation({
      query: (args) => {
        // For FormData, we need to let the browser set the Content-Type
        // to include the boundary string
        const formData = new FormData();

        // Add course data to FormData
        Object.keys(args.data).forEach((key) => {
          formData.append(key, args.data[key]);
        });

        // Add thumbnail if provided
        if (args.file) {
          formData.append("file", args.file);
        }

        return {
          url: `/courses/edit-course/${args.id}`,
          method: "PATCH",
          body: formData,
          formData: true, // This signals to use FormData
        };
      },
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error editing course"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["courses", "course"],
    }),
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/delete-course/${id}`,
        method: "DELETE",
      }),
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch (error) {
          dispatch(setError("Error deleting course"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["courses"],
    }),
  }),
});

export const {
  useCreateCourseMutation,
  useGetCreatorCourseQuery,
  useGetPublishedCoursesQuery,
  useGetPopularCoursesQuery,
  useGetCourseByIdQuery,
  useEditCourseMutation,
  useDeleteCourseMutation,
} = courseApi;
