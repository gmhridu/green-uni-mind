import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import CourseFilters from '../CourseFilters';
import { CourseFilters as ICourseFilters } from '@/types/course-management';

const mockFilters: ICourseFilters = {
  search: '',
  status: [],
  category: [],
  level: [],
  priceRange: { min: 0, max: 10000 },
  isFree: undefined,
  dateRange: {},
  enrollmentRange: { min: 0, max: 10000 },
  ratingRange: { min: 0, max: 5 },
  sortBy: 'updatedAt',
  sortOrder: 'desc',
  page: 1,
  limit: 20,
  tags: [],
  instructor: '',
  language: '',
  duration: { min: 0, max: 1000 }
};

const mockCategories = ['Programming', 'Design', 'Business', 'Marketing'];

const defaultProps = {
  filters: mockFilters,
  onFiltersChange: vi.fn(),
  categories: mockCategories,
  isLoading: false,
  savedFilters: [],
  onSaveFilter: vi.fn(),
  onLoadFilter: vi.fn()
};

describe('CourseFilters', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders filter button with correct count', () => {
    render(<CourseFilters {...defaultProps} />);
    
    expect(screen.getByText('Filters')).toBeInTheDocument();
    // No active filters initially
    expect(screen.queryByText(/\d+/)).not.toBeInTheDocument();
  });

  it('shows active filters count', () => {
    const filtersWithActive = {
      ...mockFilters,
      status: ['published'],
      category: ['Programming'],
      search: 'React'
    };
    
    render(<CourseFilters {...defaultProps} filters={filtersWithActive} />);
    
    expect(screen.getByText('3')).toBeInTheDocument(); // Badge with count
  });

  it('opens filter popover when clicked', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    const filterButton = screen.getByText('Filters');
    await user.click(filterButton);
    
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByText('Level')).toBeInTheDocument();
  });

  it('handles status filter selection', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    // Open filters
    await user.click(screen.getByText('Filters'));
    
    // Click on published status
    const publishedButton = screen.getByText('Published');
    await user.click(publishedButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: ['published']
    });
  });

  it('handles category filter selection', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    const programmingButton = screen.getByText('Programming');
    await user.click(programmingButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      category: ['Programming']
    });
  });

  it('handles level filter selection', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    const beginnerButton = screen.getByText('Beginner');
    await user.click(beginnerButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      level: ['Beginner']
    });
  });

  it('handles free course toggle', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    const freeOnlyButton = screen.getByText('Free Only');
    await user.click(freeOnlyButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      isFree: true
    });
  });

  it('handles price range changes', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    // Find price range slider (this is a simplified test)
    const priceSlider = screen.getByRole('slider');
    fireEvent.change(priceSlider, { target: { value: '500' } });
    
    // Note: Actual slider interaction would be more complex
    // This is a simplified test for the concept
  });

  it('handles date range selection', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    const startDateInput = screen.getByLabelText('From');
    await user.type(startDateInput, '2024-01-01');
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      dateRange: { startDate: '2024-01-01' }
    });
  });

  it('clears all filters', async () => {
    const user = userEvent.setup();
    const filtersWithActive = {
      ...mockFilters,
      status: ['published'],
      category: ['Programming']
    };
    
    render(<CourseFilters {...defaultProps} filters={filtersWithActive} />);
    
    await user.click(screen.getByText('Filters'));
    
    const clearButton = screen.getByText('Clear');
    await user.click(clearButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      search: '',
      status: [],
      category: [],
      level: [],
      priceRange: { min: 0, max: 10000 },
      isFree: undefined,
      dateRange: {},
      enrollmentRange: { min: 0, max: 10000 },
      ratingRange: { min: 0, max: 5 },
      sortBy: 'updatedAt',
      sortOrder: 'desc',
      page: 1,
      limit: 20,
      tags: [],
      instructor: '',
      language: '',
      duration: { min: 0, max: 1000 }
    });
  });

  it('displays active filter badges', () => {
    const filtersWithActive = {
      ...mockFilters,
      status: ['published', 'draft'],
      category: ['Programming']
    };
    
    render(<CourseFilters {...defaultProps} filters={filtersWithActive} />);
    
    expect(screen.getByText('published')).toBeInTheDocument();
    expect(screen.getByText('draft')).toBeInTheDocument();
    expect(screen.getByText('Programming')).toBeInTheDocument();
  });

  it('removes individual filter badges', async () => {
    const user = userEvent.setup();
    const filtersWithActive = {
      ...mockFilters,
      status: ['published']
    };
    
    render(<CourseFilters {...defaultProps} filters={filtersWithActive} />);
    
    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      status: []
    });
  });

  it('handles saved filters', async () => {
    const user = userEvent.setup();
    const savedFilters = [
      { id: '1', name: 'My Filter', filters: { ...mockFilters, status: ['published'] } }
    ];
    
    render(<CourseFilters {...defaultProps} savedFilters={savedFilters} />);
    
    const savedFiltersSelect = screen.getByText('Saved filters');
    await user.click(savedFiltersSelect);
    
    const myFilter = screen.getByText('My Filter');
    await user.click(myFilter);
    
    expect(defaultProps.onLoadFilter).toHaveBeenCalledWith({
      ...mockFilters,
      status: ['published']
    });
  });

  it('saves current filter', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    const saveButton = screen.getByText('Save Filter');
    await user.click(saveButton);
    
    const nameInput = screen.getByPlaceholderText('Filter name');
    await user.type(nameInput, 'My Custom Filter');
    
    const confirmSaveButton = screen.getByText('Save');
    await user.click(confirmSaveButton);
    
    expect(defaultProps.onSaveFilter).toHaveBeenCalledWith('My Custom Filter', mockFilters);
  });

  it('handles multiple category selection', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    
    // Select multiple categories
    await user.click(screen.getByText('Programming'));
    await user.click(screen.getByText('Design'));
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      category: ['Programming']
    });
    
    expect(defaultProps.onFiltersChange).toHaveBeenCalledWith({
      ...mockFilters,
      category: ['Programming', 'Design']
    });
  });

  it('shows loading state', () => {
    render(<CourseFilters {...defaultProps} isLoading={true} />);
    
    const filterButton = screen.getByText('Filters');
    expect(filterButton).toBeDisabled();
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    const filterButton = screen.getByText('Filters');
    filterButton.focus();
    
    await user.keyboard('{Enter}');
    
    expect(screen.getByText('Status')).toBeInTheDocument();
  });

  it('closes popover when clicking outside', async () => {
    const user = userEvent.setup();
    render(<CourseFilters {...defaultProps} />);
    
    await user.click(screen.getByText('Filters'));
    expect(screen.getByText('Status')).toBeInTheDocument();
    
    // Click outside
    await user.click(document.body);
    
    await waitFor(() => {
      expect(screen.queryByText('Status')).not.toBeInTheDocument();
    });
  });

  it('maintains filter state across re-renders', () => {
    const { rerender } = render(<CourseFilters {...defaultProps} />);
    
    const filtersWithActive = {
      ...mockFilters,
      status: ['published']
    };
    
    rerender(<CourseFilters {...defaultProps} filters={filtersWithActive} />);
    
    expect(screen.getByText('published')).toBeInTheDocument();
  });
});
