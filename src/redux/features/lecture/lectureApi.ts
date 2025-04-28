import { baseApi } from "@/redux/api/baseApi";
import { TResponseRedux } from "@/types/global";
import { setError, setLoading } from "./lectureSlice";

export const lectureApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createLecture: builder.mutation({
      query: (args) => ({
        url: `/lectures/${args.courseId}/create-lecture`,
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
      invalidatesTags: ["lectures"],
    }),
  }),
});

export const { useCreateLectureMutation } = lectureApi;
