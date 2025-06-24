import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
// import { toast } from 'sonner'; // Reserved for future notifications

interface LectureProgress {
  lectureId: string;
  currentTime: number;
  duration: number;
  completionPercentage: number;
  lastUpdated: Date;
  isCompleted: boolean;
  watchTime: number;
  courseId: string;
}

interface CourseProgress {
  courseId: string;
  totalLectures: number;
  completedLectures: number;
  totalDuration: number;
  watchedDuration: number;
  overallProgress: number;
  lastAccessed: Date;
  lectures: Record<string, LectureProgress>;
}

interface ProgressState {
  courses: Record<string, CourseProgress>;
  isLoading: boolean;
  error: string | null;
  syncStatus: 'synced' | 'pending' | 'error' | 'offline';
  lastSyncTime: Date | null;
}

type ProgressAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_SYNC_STATUS'; payload: ProgressState['syncStatus'] }
  | { type: 'UPDATE_LECTURE_PROGRESS'; payload: LectureProgress }
  | { type: 'LOAD_COURSE_PROGRESS'; payload: CourseProgress }
  | { type: 'RESET_LECTURE_PROGRESS'; payload: { lectureId: string; courseId: string } }
  | { type: 'SYNC_COMPLETED'; payload: Date }
  | { type: 'BULK_UPDATE_PROGRESS'; payload: CourseProgress[] };

interface ProgressContextType {
  state: ProgressState;
  updateLectureProgress: (progress: LectureProgress) => void;
  getLectureProgress: (lectureId: string) => LectureProgress | null;
  getCourseProgress: (courseId: string) => CourseProgress | null;
  resetLectureProgress: (lectureId: string, courseId: string) => void;
  syncProgress: () => Promise<void>;
  loadCourseProgress: (courseId: string) => Promise<void>;
  getOverallStats: () => {
    totalCourses: number;
    completedCourses: number;
    totalWatchTime: number;
    averageProgress: number;
  };
}

const initialState: ProgressState = {
  courses: {},
  isLoading: false,
  error: null,
  syncStatus: 'synced',
  lastSyncTime: null,
};

const progressReducer = (state: ProgressState, action: ProgressAction): ProgressState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload };

    case 'SET_SYNC_STATUS':
      return { ...state, syncStatus: action.payload };

    case 'UPDATE_LECTURE_PROGRESS': {
      const { lectureId, courseId } = action.payload;
      const course = state.courses[courseId] || {
        courseId,
        totalLectures: 0,
        completedLectures: 0,
        totalDuration: 0,
        watchedDuration: 0,
        overallProgress: 0,
        lastAccessed: new Date(),
        lectures: {},
      };

      const updatedLectures = {
        ...course.lectures,
        [lectureId]: action.payload,
      };

      // Recalculate course progress
      const lectureProgresses = Object.values(updatedLectures);
      const completedLectures = lectureProgresses.filter(l => l.isCompleted).length;
      const totalWatchTime = lectureProgresses.reduce((sum, l) => sum + l.watchTime, 0);
      const totalDuration = lectureProgresses.reduce((sum, l) => sum + l.duration, 0);
      const overallProgress = lectureProgresses.length > 0
        ? lectureProgresses.reduce((sum, l) => sum + l.completionPercentage, 0) / lectureProgresses.length
        : 0;

      const updatedCourse: CourseProgress = {
        ...course,
        lectures: updatedLectures,
        totalLectures: lectureProgresses.length,
        completedLectures,
        watchedDuration: totalWatchTime,
        totalDuration,
        overallProgress,
        lastAccessed: new Date(),
      };

      return {
        ...state,
        courses: {
          ...state.courses,
          [courseId]: updatedCourse,
        },
      };
    }

    case 'LOAD_COURSE_PROGRESS':
      return {
        ...state,
        courses: {
          ...state.courses,
          [action.payload.courseId]: action.payload,
        },
      };

    case 'RESET_LECTURE_PROGRESS': {
      const { lectureId, courseId } = action.payload;
      const course = state.courses[courseId];
      
      if (!course) return state;

      const updatedLectures = { ...course.lectures };
      if (updatedLectures[lectureId]) {
        updatedLectures[lectureId] = {
          ...updatedLectures[lectureId],
          currentTime: 0,
          completionPercentage: 0,
          isCompleted: false,
          lastUpdated: new Date(),
        };
      }

      // Recalculate course progress
      const lectureProgresses = Object.values(updatedLectures);
      const completedLectures = lectureProgresses.filter(l => l.isCompleted).length;
      const overallProgress = lectureProgresses.length > 0
        ? lectureProgresses.reduce((sum, l) => sum + l.completionPercentage, 0) / lectureProgresses.length
        : 0;

      return {
        ...state,
        courses: {
          ...state.courses,
          [courseId]: {
            ...course,
            lectures: updatedLectures,
            completedLectures,
            overallProgress,
          },
        },
      };
    }

    case 'SYNC_COMPLETED':
      return {
        ...state,
        syncStatus: 'synced',
        lastSyncTime: action.payload,
        error: null,
      };

    case 'BULK_UPDATE_PROGRESS':
      const updatedCourses = { ...state.courses };
      action.payload.forEach(course => {
        updatedCourses[course.courseId] = course;
      });
      
      return {
        ...state,
        courses: updatedCourses,
      };

    default:
      return state;
  }
};

const ProgressTrackingContext = createContext<ProgressContextType | null>(null);

interface ProgressTrackingProviderProps {
  children: ReactNode;
}

export const ProgressTrackingProvider: React.FC<ProgressTrackingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(progressReducer, initialState);

  // Initialize progress tracking
  useEffect(() => {
    const initializeProgress = async () => {
      try {
        dispatch({ type: 'SET_LOADING', payload: true });

        // Load from localStorage
        const localProgress = localStorage.getItem('course_progress');
        if (localProgress) {
          const parsedProgress = JSON.parse(localProgress);
          const courses = Object.values(parsedProgress).map((course: any) => ({
            ...course,
            lastAccessed: new Date(course.lastAccessed),
            lectures: Object.fromEntries(
              Object.entries(course.lectures).map(([id, lecture]: [string, any]) => [
                id,
                { ...lecture, lastUpdated: new Date(lecture.lastUpdated) }
              ])
            ),
          }));
          dispatch({ type: 'BULK_UPDATE_PROGRESS', payload: courses });
        }

        // Sync with server if online
        if (navigator.onLine) {
          await syncWithServer();
        } else {
          dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
        }
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: 'Failed to initialize progress tracking' });
        console.error('Progress initialization error:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializeProgress();
  }, []);

  // Auto-sync functionality
  useEffect(() => {
    const syncInterval = setInterval(() => {
      if (navigator.onLine && state.syncStatus !== 'pending') {
        syncWithServer();
      }
    }, 30000); // Sync every 30 seconds

    return () => clearInterval(syncInterval);
  }, [state.syncStatus]);

  // Online/offline handling
  useEffect(() => {
    const handleOnline = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'pending' });
      syncWithServer();
    };

    const handleOffline = () => {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'offline' });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (Object.keys(state.courses).length > 0) {
      localStorage.setItem('course_progress', JSON.stringify(state.courses));
    }
  }, [state.courses]);

  const syncWithServer = async () => {
    try {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'pending' });

      // TODO: Implement progress sync endpoint on backend
      // For now, just mark as synced to avoid 404 errors
      console.log('Progress sync temporarily disabled - backend endpoint not implemented');
      dispatch({ type: 'SYNC_COMPLETED', payload: new Date() });

      // Uncomment when backend endpoint is ready:
      // const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
      // const response = await fetch(`${apiBaseUrl}/progress/sync`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   credentials: 'include',
      //   body: JSON.stringify({ courses: state.courses }),
      // });

      // if (response.ok) {
      //   const serverData = await response.json();
      //   if (serverData.courses) {
      //     dispatch({ type: 'BULK_UPDATE_PROGRESS', payload: serverData.courses });
      //   }
      //   dispatch({ type: 'SYNC_COMPLETED', payload: new Date() });
      // } else {
      //   throw new Error('Sync failed');
      // }
    } catch (error) {
      dispatch({ type: 'SET_SYNC_STATUS', payload: 'error' });
      console.error('Sync error:', error);
    }
  };

  const updateLectureProgress = (progress: LectureProgress) => {
    dispatch({ type: 'UPDATE_LECTURE_PROGRESS', payload: progress });
  };

  const getLectureProgress = (lectureId: string): LectureProgress | null => {
    for (const course of Object.values(state.courses)) {
      if (course.lectures[lectureId]) {
        return course.lectures[lectureId];
      }
    }
    return null;
  };

  const getCourseProgress = (courseId: string): CourseProgress | null => {
    return state.courses[courseId] || null;
  };

  const resetLectureProgress = (lectureId: string, courseId: string) => {
    dispatch({ type: 'RESET_LECTURE_PROGRESS', payload: { lectureId, courseId } });
  };

  const syncProgress = async (): Promise<void> => {
    await syncWithServer();
  };

  const loadCourseProgress = async (courseId: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // This would be replaced with actual API call
      const response = await fetch(`/api/courses/${courseId}/progress`, {
        credentials: 'include',
      });

      if (response.ok) {
        const courseProgress = await response.json();
        dispatch({ type: 'LOAD_COURSE_PROGRESS', payload: courseProgress });
      }
    } catch (error) {
      dispatch({ type: 'SET_ERROR', payload: 'Failed to load course progress' });
      console.error('Load course progress error:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const getOverallStats = () => {
    const courses = Object.values(state.courses);
    const totalCourses = courses.length;
    const completedCourses = courses.filter(c => c.overallProgress >= 90).length;
    const totalWatchTime = courses.reduce((sum, c) => sum + c.watchedDuration, 0);
    const averageProgress = courses.length > 0
      ? courses.reduce((sum, c) => sum + c.overallProgress, 0) / courses.length
      : 0;

    return {
      totalCourses,
      completedCourses,
      totalWatchTime,
      averageProgress,
    };
  };

  const contextValue: ProgressContextType = {
    state,
    updateLectureProgress,
    getLectureProgress,
    getCourseProgress,
    resetLectureProgress,
    syncProgress,
    loadCourseProgress,
    getOverallStats,
  };

  return (
    <ProgressTrackingContext.Provider value={contextValue}>
      {children}
    </ProgressTrackingContext.Provider>
  );
};

export const useProgressTracking = (): ProgressContextType => {
  const context = useContext(ProgressTrackingContext);
  if (!context) {
    throw new Error('useProgressTracking must be used within a ProgressTrackingProvider');
  }
  return context;
};

export default ProgressTrackingContext;
