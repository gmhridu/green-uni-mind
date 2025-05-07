import { baseApi } from "../../api/baseApi";

const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    connectStripeAccount: builder.mutation({
      query: (teacherId) => ({
        url: `/payments/connect-stripe/${teacherId}`,
        method: "POST",
      }),
    }),
    saveStripeAccountDetails: builder.mutation({
      query: ({ teacherId, stripeAccountId, stripeEmail }) => ({
        url: `/payments/save-stripe-details/${teacherId}`,
        method: "POST",
        body: { stripeAccountId, stripeEmail },
      }),
    }),
    getTeacherEarnings: builder.query({
      query: (teacherId) => ({
        url: `/payments/earnings/${teacherId}`,
        method: "GET",
      }),
    }),
    getStripeConnectUrl: builder.query({
      query: (teacherId) => ({
        url: `/payments/connect-stripe-url/${teacherId}`,
        method: "GET",
      }),
    }),
    exchangeStripeCode: builder.mutation({
      query: ({ code, teacherId }) => ({
        url: "/payments/exchange-stripe-code",
        method: "POST",
        body: { code, teacherId },
      }),
    }),
    createPaymentIntent: builder.mutation({
      query: ({ studentId, courseId, amount }) => ({
        url: "/payments/create-payment-intent",
        method: "POST",
        body: { studentId, courseId, amount },
      }),
    }),
    createCheckoutSession: builder.mutation({
      query: ({ courseId, amount }) => ({
        url: "/payments/create-checkout-session",
        method: "POST",
        body: { courseId, amount },
      }),
    }),
  }),
});

export const {
  useCreatePaymentIntentMutation,
  useCreateCheckoutSessionMutation,
  useConnectStripeAccountMutation,
  useSaveStripeAccountDetailsMutation,
  useGetTeacherEarningsQuery,
  useGetStripeConnectUrlQuery,
  useExchangeStripeCodeMutation
} = paymentApi;