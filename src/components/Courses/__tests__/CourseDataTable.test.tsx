import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CourseDataTable from '../CourseDataTable';
import { EnhancedCourse } from '@/types/course-management';

// Mock data
const mockCourses: EnhancedCourse[] = [
  {
    _id: '1',
    title: 'React Fundamentals',
    subtitle: 'Learn React from scratch',
    description: 'A comprehensive React course',
    category: 'Programming',
    courseLevel: 'Beginner',
    coursePrice: 99,
    courseThumbnail: 'https://example.com/thumb1.jpg',
    enrolledStudents: ['student1', 'student2'],
    totalEnrollment: 2,
    lectures: [],
    creator: 'teacher1',
    isPublished: true,
    status: 'published',
    isFree: 'paid',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
    totalRevenue: 198,
    averageRating: 4.5,
    completionRate: 85,
    enrollmentTrend: 'up',
    analytics: {
      enrollmentCount: 2,
      completionRate: 85,
      averageRating: 4.5,
      totalRevenue: 198,
      monthlyEnrollments: 2,
      weeklyEnrollments: 1,
      enrollmentGrowth: 15,
      ratingTrend: 5,
      revenueTrend: 20,
      engagementScore: 90,
      dropoffRate: 10,
      averageWatchTime: 45,
      certificatesIssued: 1,
      studentSatisfaction: 95
    }
  },
  {
    _id: '2',
    title: 'Advanced JavaScript',
    subtitle: 'Master JavaScript concepts',
    description: 'Deep dive into JavaScript',
    category: 'Programming',
    courseLevel: 'Advanced',
    coursePrice: 0,
    courseThumbnail: 'https://example.com/thumb2.jpg',
    enrolledStudents: ['student3'],
    totalEnrollment: 1,
    lectures: [],
    creator: 'teacher1',
    isPublished: false,
    status: 'draft',
    isFree: 'free',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-20'),
    totalRevenue: 0,
    averageRating: 0,
    completionRate: 0,
    enrollmentTrend: 'stable',
    analytics: {
      enrollmentCount: 1,
      completionRate: 0,
      averageRating: 0,
      totalRevenue: 0,
      monthlyEnrollments: 1,
      weeklyEnrollments: 0,
      enrollmentGrowth: 0,
      ratingTrend: 0,
      revenueTrend: 0,
      engagementScore: 0,
      dropoffRate: 0,
      averageWatchTime: 0,
      certificatesIssued: 0,
      studentSatisfaction: 0
    }
  }
];

const mockColumns = [
  { key: 'title', label: 'Title', sortable: true, visible: true, width: 200 },
  { key: 'status', label: 'Status', sortable: true, visible: true, width: 100, type: 'status' },
  { key: 'enrollments', label: 'Students', sortable: true, visible: true, width: 100, type: 'number' },
  { key: 'price', label: 'Price', sortable: true, visible: true, width: 100, type: 'currency' },
  { key: 'updatedAt', label: 'Updated', sortable: true, visible: true, width: 120, type: 'date' }
];

const defaultProps = {
  courses: mockCourses,
  columns: mockColumns,
  selectedCourses: [],
  onSelectionChange: vi.fn(),
  onSort: vi.fn(),
  onColumnResize: vi.fn(),
  onColumnToggle: vi.fn(),
  onRowClick: vi.fn(),
  onBulkAction: vi.fn()
};

describe('CourseDataTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders course data correctly', () => {
    render(<CourseDataTable {...defaultProps} />);
    
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
    expect(screen.getByText('Advanced JavaScript')).toBeInTheDocument();
    expect(screen.getByText('Courses (2)')).toBeInTheDocument();
  });

  it('displays loading state', () => {
    render(<CourseDataTable {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Courses')).toBeInTheDocument();
    // Should show skeleton loaders
    expect(screen.getAllByRole('row')).toHaveLength(6); // Header + 5 skeleton rows
  });

  it('handles course selection', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[1]); // First course checkbox (index 0 is select all)
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('handles select all functionality', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    await user.click(selectAllCheckbox);
    
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1', '2']);
  });

  it('handles column sorting', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const titleHeader = screen.getByText('Title');
    await user.click(titleHeader);
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('title', 'asc');
  });

  it('handles row click', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const firstRow = screen.getByText('React Fundamentals').closest('tr');
    await user.click(firstRow!);
    
    expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockCourses[0]);
  });

  it('displays correct status badges', () => {
    render(<CourseDataTable {...defaultProps} />);
    
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<CourseDataTable {...defaultProps} />);
    
    expect(screen.getByText('$99')).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
  });

  it('shows empty state when no courses', () => {
    render(<CourseDataTable {...defaultProps} courses={[]} />);
    
    expect(screen.getByText('No courses found')).toBeInTheDocument();
    expect(screen.getByText(/Get started by creating your first course/)).toBeInTheDocument();
  });

  it('handles column visibility toggle', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const columnsButton = screen.getByText('Columns');
    await user.click(columnsButton);
    
    const titleOption = screen.getByText('Title');
    await user.click(titleOption);
    
    expect(defaultProps.onColumnToggle).toHaveBeenCalledWith('title', false);
  });

  it('displays selected courses count', () => {
    render(<CourseDataTable {...defaultProps} selectedCourses={['1']} />);
    
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const firstCheckbox = screen.getAllByRole('checkbox')[1];
    firstCheckbox.focus();
    
    await user.keyboard('{Space}');
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('supports accessibility features', () => {
    render(<CourseDataTable {...defaultProps} />);
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0];
    expect(selectAllCheckbox).toHaveAttribute('aria-label', 'Select all courses');
    
    const firstCourseCheckbox = screen.getAllByRole('checkbox')[1];
    expect(firstCourseCheckbox).toHaveAttribute('aria-label', 'Select React Fundamentals');
  });

  it('shows action menu for each course', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const actionButtons = screen.getAllByLabelText('Open menu');
    await user.click(actionButtons[0]);
    
    expect(screen.getByText('View')).toBeInTheDocument();
    expect(screen.getByText('Edit')).toBeInTheDocument();
    expect(screen.getByText('Duplicate')).toBeInTheDocument();
  });

  it('prevents row click when clicking on interactive elements', async () => {
    const user = userEvent.setup();
    render(<CourseDataTable {...defaultProps} />);
    
    const checkbox = screen.getAllByRole('checkbox')[1];
    await user.click(checkbox);
    
    // Row click should not be triggered when clicking checkbox
    expect(defaultProps.onRowClick).not.toHaveBeenCalled();
    expect(defaultProps.onSelectionChange).toHaveBeenCalledWith(['1']);
  });

  it('handles error states gracefully', () => {
    const coursesWithError = [
      {
        ...mockCourses[0],
        courseThumbnail: undefined,
        averageRating: undefined
      }
    ];
    
    render(<CourseDataTable {...defaultProps} courses={coursesWithError as any} />);
    
    // Should still render without crashing
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
  });

  it('supports responsive behavior', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });
    
    render(<CourseDataTable {...defaultProps} />);
    
    // Table should still be functional on mobile
    expect(screen.getByText('React Fundamentals')).toBeInTheDocument();
  });
});

// Integration tests
describe('CourseDataTable Integration', () => {
  it('works with real user interactions', async () => {
    const user = userEvent.setup();
    const mockProps = {
      ...defaultProps,
      onSelectionChange: vi.fn(),
      onSort: vi.fn()
    };
    
    render(<CourseDataTable {...mockProps} />);
    
    // Select a course
    const firstCheckbox = screen.getAllByRole('checkbox')[1];
    await user.click(firstCheckbox);
    
    // Sort by title
    const titleHeader = screen.getByText('Title');
    await user.click(titleHeader);
    
    // Verify interactions
    expect(mockProps.onSelectionChange).toHaveBeenCalledWith(['1']);
    expect(mockProps.onSort).toHaveBeenCalledWith('title', 'asc');
  });

  it('maintains selection state across re-renders', () => {
    const { rerender } = render(<CourseDataTable {...defaultProps} selectedCourses={['1']} />);
    
    expect(screen.getByText('1 selected')).toBeInTheDocument();
    
    // Re-render with same selection
    rerender(<CourseDataTable {...defaultProps} selectedCourses={['1']} />);
    
    expect(screen.getByText('1 selected')).toBeInTheDocument();
  });
});
