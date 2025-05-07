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
      query: (args) => ({
        url: `/lectures/${args.id}/get-lectures`,
        method: "GET",
      }),
      providesTags: ["lectures", "courses", "course"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
    }),

    getLectureById: builder.query({
      query: (args) => ({
        url: `/lectures/${args.id}`,
        method: "GET",
      }),
      providesTags: ["lecture"],
      transformResponse: (response: TResponseRedux<any>) => ({
        data: response.data,
      }),
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
