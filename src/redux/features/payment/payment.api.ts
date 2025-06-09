import { baseApi } from "../../api/baseApi";

const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Payout endpoints
    getPayoutPreferences: builder.query({
      query: (teacherId) => ({
        url: `/payments/payouts/preferences/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["PayoutPreferences"],
    }),

    updatePayoutPreferences: builder.mutation({
      query: ({ teacherId, ...data }) => ({
        url: `/payments/payouts/preferences/${teacherId}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["PayoutPreferences"],
    }),

    getPayoutHistory: builder.query({
      query: (teacherId) => ({
        url: `/payments/payouts/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["Payouts"],
    }),

    getPayoutById: builder.query({
      query: (payoutId) => ({
        url: `/payments/payouts/details/${payoutId}`,
        method: "GET",
      }),
      providesTags: (result, error, payoutId) => [
        { type: "Payout", id: payoutId },
      ],
    }),

    // Mutation for requesting a payout
    createPayoutRequest: builder.mutation({
      query: ({ teacherId, amount }) => ({
        url: `/payments/payouts/${teacherId}`,
        method: "POST",
        body: { amount },
      }),
      invalidatesTags: ["Payouts", "PayoutPreferences"],
    }),
    // Stripe Connect for teachers
    connectStripeAccount: builder.mutation({
      query: (teacherId) => ({
        url: `/payments/connect-stripe/${teacherId}`,
        method: "POST",
      }),
    }),

    createOnboardingLink: builder.mutation({
      query: (teacherId) => ({
        url: `/payments/create-onboarding-link/${teacherId}`,
        method: "POST",
      }),
    }),

    checkStripeAccountStatus: builder.query({
      query: (teacherId) => ({
        url: `/payments/stripe-account-status/${teacherId}`,
        method: "GET",
      }),
    }),

    saveStripeAccountDetails: builder.mutation({
      query: ({
        teacherId,
        stripeAccountId,
        stripeEmail,
        stripeVerified,
        stripeOnboardingComplete,
      }) => ({
        url: `/payments/save-stripe-details/${teacherId}`,
        method: "POST",
        body: {
          stripeAccountId,
          stripeEmail,
          stripeVerified,
          stripeOnboardingComplete,
        },
      }),
    }),

    // Earnings and transactions
    getTeacherEarnings: builder.query({
      query: (teacherId) => ({
        url: `/payments/earnings/${teacherId}`,
        method: "GET",
      }),
    }),

    getTeacherTransactions: builder.query({
      query: ({ teacherId, period = "month" }) => ({
        url: `/payments/transactions/${teacherId}?period=${period}`,
        method: "GET",
      }),
    }),

    getPayoutInfo: builder.query({
      query: ({ teacherId, period }) => ({
        url: `/payments/payout-info/${teacherId}${
          period ? `?period=${period}` : ""
        }`,
        method: "GET",
      }),
    }),

    getUpcomingPayout: builder.query({
      query: (teacherId) => ({
        url: `/payments/upcoming-payout/${teacherId}`,
        method: "GET",
      }),
      providesTags: ["UpcomingPayout"],
    }),

    getTransactionById: builder.query({
      query: (transactionId) => ({
        url: `/payments/transaction/${transactionId}`,
        method: "GET",
      }),
    }),

    getTransactionBySessionId: builder.query({
      query: (sessionId) => ({
        url: `/payments/session/${sessionId}`,
        method: "GET",
      }),
    }),

    getStudentTransactions: builder.query({
      query: (studentId) => ({
        url: `/payments/student-transactions/${studentId}`,
        method: "GET",
      }),
    }),

    getTransactionAnalytics: builder.query({
      query: ({ teacherId, startDate, endDate, groupBy = "day" }) => ({
        url: `/payments/analytics/${teacherId}?startDate=${startDate}&endDate=${endDate}&groupBy=${groupBy}`,
        method: "GET",
      }),
    }),

    // Legacy endpoints
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

    // Payment processing
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
  // Payout endpoints
  useGetPayoutPreferencesQuery,
  useUpdatePayoutPreferencesMutation,
  useGetPayoutHistoryQuery,
  useGetPayoutByIdQuery,
  useCreatePayoutRequestMutation, // Mutation for requesting payouts

  // Stripe Connect for teachers
  useConnectStripeAccountMutation,
  useCreateOnboardingLinkMutation,
  useCheckStripeAccountStatusQuery,
  useSaveStripeAccountDetailsMutation,

  // Earnings and transactions
  useGetTeacherEarningsQuery,
  useGetTeacherTransactionsQuery,
  useGetPayoutInfoQuery,
  useGetUpcomingPayoutQuery,
  useGetTransactionByIdQuery,
  useGetTransactionBySessionIdQuery,
  useGetStudentTransactionsQuery,
  useGetTransactionAnalyticsQuery,

  // Legacy endpoints
  useGetStripeConnectUrlQuery,
  useExchangeStripeCodeMutation,

  // Payment processing
  useCreatePaymentIntentMutation,
  useCreateCheckoutSessionMutation,
} = paymentApi;
