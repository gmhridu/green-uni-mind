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

        // Optimistic update - add temporary lecture to cache
        const optimisticLecture = {
          _id: `temp-${Date.now()}`,
          lectureTitle: args.data.lectureTitle,
          instruction: args.data.instruction || "",
          videoUrl: args.data.videoUrl || "",
          pdfUrl: args.data.pdfUrl || "",
          isPreviewFree: args.data.isPreviewFree || false,
          courseId: args.id,
          order: 999, // Will be updated with real order from server
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Update lectures cache optimistically
        const patchResult = dispatch(
          lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.id }, (draft) => {
            draft.data = draft.data || [];
            draft.data.push(optimisticLecture);
          })
        );

        try {
          const result = await queryFulfilled;
          // Update with real data from server
          dispatch(
            lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.id }, (draft) => {
              const tempIndex = draft.data.findIndex(l => l._id === optimisticLecture._id);
              if (tempIndex !== -1) {
                draft.data[tempIndex] = result.data.data;
              }
            })
          );
        } catch (error) {
          // Revert optimistic update on error
          patchResult.undo();
          dispatch(setError("Error creating Lecture"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "lectures", id: args.id },
        { type: "course", id: args.id }
      ],
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
          duration?: number;
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

        // Optimistic update
        const patchResult = dispatch(
          lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.courseId }, (draft) => {
            const lectureIndex = draft.data.findIndex(l => l._id === args.lectureId);
            if (lectureIndex !== -1) {
              Object.assign(draft.data[lectureIndex], {
                ...args.data,
                updatedAt: new Date().toISOString(),
              });
            }
          })
        );

        // Also update individual lecture cache if it exists
        const singleLecturePatch = dispatch(
          lectureApi.util.updateQueryData('getLectureById', { id: args.lectureId }, (draft) => {
            Object.assign(draft.data, {
              ...args.data,
              updatedAt: new Date().toISOString(),
            });
          })
        );

        try {
          const result = await queryFulfilled;

          // Update with real data from server
          dispatch(
            lectureApi.util.updateQueryData('getLectureByCourseId', { id: args.courseId }, (draft) => {
              const lectureIndex = draft.data.findIndex(l => l._id === args.lectureId);
              if (lectureIndex !== -1) {
                draft.data[lectureIndex] = result.data.data;
              }
            })
          );

          // Force immediate cache invalidation for real-time sync
          dispatch(baseApi.util.invalidateTags([
            'lectures',
            'course',
            { type: 'lectures', id: args.courseId },
            { type: 'course', id: args.courseId },
            { type: 'lecture', id: args.lectureId }
          ]));

        } catch (error) {
          // Revert optimistic updates on error
          patchResult.undo();
          singleLecturePatch.undo();
          dispatch(setError("Error updating lecture"));
        } finally {
          dispatch(setLoading(false));
        }
      },
      invalidatesTags: (result, error, args) => [
        { type: "lecture", id: args.lectureId },
        { type: "lectures", id: args.courseId }
      ],
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
