import { baseApi } from "../../api/baseApi";
import { ICourse } from "@/types/course";

const courseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseById: builder.query<{ data: ICourse }, string>({
      query: (id) => ({
        url: `/courses/${id}`,
        method: "GET",
      }),
    }),
    getPublishedCourses: builder.query<{ data: ICourse[] }, void>({
      query: () => ({
        url: "/courses/published-courses",
        method: "GET",
      }),
    }),
    getPopularCourses: builder.query<{ data: ICourse[] }, number>({
      query: (limit = 8) => ({
        url: `/courses/popular-courses?limit=${limit}`,
        method: "GET",
      }),
    }),
    searchCourses: builder.query<{ data: ICourse[] }, string>({
      query: (searchTerm) => ({
        url: `/courses/search?searchTerm=${searchTerm}`,
        method: "GET",
      }),
    }),
  }),
});

export const {
  useGetCourseByIdQuery,
  useGetPublishedCoursesQuery,
  useGetPopularCoursesQuery,
  useSearchCoursesQuery,
} = courseApi;