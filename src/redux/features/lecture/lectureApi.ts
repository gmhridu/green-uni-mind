import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setError, setLoading } from "./lectureSlice";

export const lectureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLecture: builder.mutation({
      query: (args) => ({
        url: `/lectures/${args.id}/create-lecture`,
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
          dispatch(setError("Error creating Lecture"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["lectures", "courses", "course"],
    }),

    getLectureByCourseId: builder.query({
      query: (args) => {
        // Check if id is valid
        if (!args.id) {
          throw new Error('Course ID is required');
        }
        return {
          url: `/lectures/${args.id}/get-lectures`,
          method: "GET",
        };
      },
      providesTags: ["lectures", "courses", "course"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      // Add error handling
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error: any) {
          console.error("Error fetching lectures:", error);

          if (error?.error?.status === 403) {
            dispatch(setError("You don't have permission to access these lectures"));
          } else if (error?.error?.status === 404) {
            dispatch(setError("Course not found"));
          } else if (error?.error?.status === 401) {
            dispatch(setError("You need to be logged in to access lectures"));
          } else {
            dispatch(setError("Error fetching lectures"));
          }
        }
      },
    }),

    getLectureById: builder.query({
      query: (args) => {
        // Check if id is valid
        if (!args.id) {
          throw new Error('Lecture ID is required');
        }
        return {
          url: `/lectures/${args.id}`,
          method: "GET",
        };
      },
      providesTags: ["lecture"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      // Add error handling
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        try {
          await queryFulfilled;
        } catch (error: any) {
          console.error("Error fetching lecture:", error);

          // Check if it's an access error (403)
          if (error?.error?.status === 403) {
            dispatch(setError("You must be enrolled in this course to access this lecture"));
          } else if (error?.error?.status === 404) {
            dispatch(setError("Lecture not found"));
          } else if (error?.error?.status === 401) {
            dispatch(setError("You need to be logged in to access this lecture"));
          } else {
            dispatch(setError("Error fetching lecture"));
          }
        }
      },
    }),

    updateLectureOrder: builder.mutation({
      query: (args) => ({
        url: `/lectures/${args.id}/update-order`,
        method: "PATCH",
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
          dispatch(setError("Error updating lecture order"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["lectures", "courses", "course"],
    }),
    updateLecture: builder.mutation({
      query: (args: {
        courseId: string;
        lectureId: string;
        data: Partial<{
          lectureTitle: string;
          instruction: string;
          videoUrl: string;
          pdfUrl: string;
          isPreviewFree: boolean;
        }>;
      }) => ({
        url: `/lectures/${args.courseId}/update-lecture/${args.lectureId}`,
        method: "PATCH",
        body: args.data,
      }),
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
      onQueryStarted: async (args, { dispatch, queryFulfilled }) => {
        dispatch(setLoading(true));
        try {
          await queryFulfilled;
        } catch {
          dispatch(setError("Error updating lecture"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: ["lectures", "lecture", "courses", "course"],
    }),
  }),
});

export const {
  useCreateLectureMutation,
  useGetLectureByIdQuery,
  useGetLectureByCourseIdQuery,
  useUpdateLectureOrderMutation,
  useUpdateLectureMutation,
} = lectureApi;
