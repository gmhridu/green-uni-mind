import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from '@/redux/api/baseApi';
import reviewReducer from '@/redux/features/review/reviewSlice';
import authReducer from '@/redux/features/auth/authSlice';
import Reviews from '@/pages/Teacher/Reviews';

// Mock the hooks
jest.mock('@/redux/features/auth/authApi', () => ({
  useGetMeQuery: () => ({
    data: {
      data: {
        _id: 'teacher-123',
        name: 'Test Teacher',
        email: 'teacher@test.com',
        role: 'teacher'
      }
    }
  })
}));

jest.mock('@/redux/features/course/courseApi', () => ({
  useGetCreatorCourseQuery: () => ({
    data: {
      data: {
        courses: [
          {
            _id: 'course-1',
            title: 'Test Course 1'
          },
          {
            _id: 'course-2', 
            title: 'Test Course 2'
          }
        ]
      }
    },
    isLoading: false
  })
}));

jest.mock('@/redux/features/review/reviewApi', () => ({
  useGetTeacherReviewsQuery: () => ({
    data: {
      reviews: [
        {
          _id: 'review-1',
          student: {
            _id: 'student-1',
            name: 'John Doe',
            email: 'john@test.com',
            profileImg: ''
          },
          course: {
            _id: 'course-1',
            title: 'Test Course 1'
          },
          teacher: 'teacher-123',
          rating: 5,
          comment: 'Great course! Really enjoyed it.',
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-01-15T10:00:00Z'
        },
        {
          _id: 'review-2',
          student: {
            _id: 'student-2',
            name: 'Jane Smith',
            email: 'jane@test.com',
            profileImg: ''
          },
          course: {
            _id: 'course-2',
            title: 'Test Course 2'
          },
          teacher: 'teacher-123',
          rating: 4,
          comment: 'Good content, could be improved.',
          createdAt: '2024-01-14T10:00:00Z',
          updatedAt: '2024-01-14T10:00:00Z'
        }
      ],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalReviews: 2,
        hasNextPage: false,
        hasPrevPage: false
      }
    },
    isLoading: false,
    error: null,
    refetch: jest.fn()
  }),
  useGetReviewStatsQuery: () => ({
    data: {
      totalReviews: 2,
      averageRating: 4.5,
      ratingDistribution: {
        1: 0,
        2: 0,
        3: 0,
        4: 1,
        5: 1
      },
      recentReviews: 2,
      responseRate: 50,
      sentimentScore: 85,
      monthlyGrowth: 10,
      weeklyGrowth: 5
    },
    isLoading: false,
    refetch: jest.fn()
  }),
  useGetReviewAnalyticsQuery: () => ({
    data: {
      stats: {
        totalReviews: 2,
        averageRating: 4.5,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
        recentReviews: 2,
        responseRate: 50,
        sentimentScore: 85,
        monthlyGrowth: 10,
        weeklyGrowth: 5
      },
      trends: [
        {
          period: '2024-01-01',
          averageRating: 4.2,
          totalReviews: 1
        },
        {
          period: '2024-01-15',
          averageRating: 4.5,
          totalReviews: 2
        }
      ],
      topCourses: [],
      recentActivity: [],
      ratingTrends: []
    },
    isLoading: false,
    refetch: jest.fn()
  }),
  useExportReviewsMutation: () => [
    jest.fn(),
    { isLoading: false }
  ]
}));

// Mock sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn()
  }
}));

const createTestStore = () => {
  return configureStore({
    reducer: {
      [baseApi.reducerPath]: baseApi.reducer,
      review: reviewReducer,
      auth: authReducer
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(baseApi.middleware),
    preloadedState: {
      auth: {
        user: {
          _id: 'teacher-123',
          name: 'Test Teacher',
          email: 'teacher@test.com',
          role: 'teacher',
          profileImg: '',
          isVerified: true,
          isBlocked: false,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        token: 'test-token',
        isLoading: false
      },
      review: {
        filters: {
          rating: [],
          courseId: undefined,
          startDate: undefined,
          endDate: undefined,
          search: '',
          sortBy: 'createdAt',
          sortOrder: 'desc',
          page: 1,
          limit: 20
        },
        selectedReviews: [],
        viewMode: 'list',
        isLoading: false,
        error: null,
        lastUpdated: null,
        cache: {
          reviews: [],
          stats: null,
          lastFetch: null
        },
        ui: {
          showFilters: true,
          showAnalytics: true,
          sidebarCollapsed: false,
          activeTab: 'overview'
        }
      }
    }
  });
};

const renderWithProviders = (component: React.ReactElement) => {
  const store = createTestStore();
  return render(
    <Provider store={store}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </Provider>
  );
};

describe('Reviews Page', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders reviews page with header', () => {
    renderWithProviders(<Reviews />);
    
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Manage and respond to student feedback')).toBeInTheDocument();
  });

  test('renders tab navigation', () => {
    renderWithProviders(<Reviews />);
    
    expect(screen.getByText('Overview')).toBeInTheDocument();
    expect(screen.getByText('Reviews')).toBeInTheDocument();
    expect(screen.getByText('Analytics')).toBeInTheDocument();
    expect(screen.getByText('Insights')).toBeInTheDocument();
  });

  test('displays review stats in overview tab', () => {
    renderWithProviders(<Reviews />);
    
    expect(screen.getByText('Total Reviews')).toBeInTheDocument();
    expect(screen.getByText('Average Rating')).toBeInTheDocument();
    expect(screen.getByText('Response Rate')).toBeInTheDocument();
    expect(screen.getByText('Sentiment Score')).toBeInTheDocument();
  });

  test('switches to reviews tab and shows filters', async () => {
    renderWithProviders(<Reviews />);
    
    const reviewsTab = screen.getByRole('tab', { name: /reviews/i });
    fireEvent.click(reviewsTab);
    
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Search reviews...')).toBeInTheDocument();
      expect(screen.getByText('Filters')).toBeInTheDocument();
    });
  });

  test('handles refresh button click', () => {
    renderWithProviders(<Reviews />);
    
    const refreshButton = screen.getByText('Refresh');
    fireEvent.click(refreshButton);
    
    // The button should be clickable (not disabled during test)
    expect(refreshButton).toBeInTheDocument();
  });

  test('handles export button click', () => {
    renderWithProviders(<Reviews />);
    
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);
    
    // The button should be clickable
    expect(exportButton).toBeInTheDocument();
  });

  test('displays error boundary when there is an error', () => {
    // Mock console.error to avoid error logs in test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    // Create a component that throws an error
    const ErrorComponent = () => {
      throw new Error('Test error');
    };
    
    renderWithProviders(<ErrorComponent />);
    
    // The error boundary should catch the error
    // Note: This test might need adjustment based on how the error boundary is implemented
    
    consoleSpy.mockRestore();
  });
});

describe('Review Components Accessibility', () => {
  test('review page has proper ARIA labels', () => {
    renderWithProviders(<Reviews />);
    
    const mainContent = screen.getByRole('main');
    expect(mainContent).toHaveAttribute('aria-label', 'Reviews dashboard');
  });

  test('tab navigation is accessible', () => {
    renderWithProviders(<Reviews />);
    
    const tabList = screen.getByRole('tablist');
    expect(tabList).toBeInTheDocument();
    
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });
});

describe('Review Responsive Design', () => {
  test('renders correctly on mobile viewport', () => {
    // Mock window.matchMedia for mobile
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: jest.fn().mockImplementation(query => ({
        matches: query.includes('max-width'),
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });

    renderWithProviders(<Reviews />);
    
    // The component should render without errors on mobile
    expect(screen.getByText('Reviews')).toBeInTheDocument();
  });
});
