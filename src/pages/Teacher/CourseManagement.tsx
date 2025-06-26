import React from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import EnhancedUnifiedCourseManager from "@/components/Course/EnhancedUnifiedCourseManager";
import Breadcrumb from "@/components/Navigation/Breadcrumb";

const CourseManagement: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  // Get the default tab from URL search params or location state
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = searchParams.get('tab') || location.state?.defaultTab || 'overview';

  if (!courseId) {
    return (
      <div className="max-w-6xl mx-auto p-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-red-600">Invalid Course ID</h2>
          <p className="text-muted-foreground mt-2">
            The course ID is missing or invalid. Please go back and try again.
          </p>
          <Button
            variant="outline"
            onClick={() => navigate('/teacher/courses')}
            className="mt-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Courses
          </Button>
        </div>
      </div>
    );
  }

  // Breadcrumb items
  const breadcrumbItems = [
    { label: 'Courses', href: '/teacher/courses' },
    { label: 'Course Management', current: true },
  ];

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-6">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center justify-between">
        <Breadcrumb items={breadcrumbItems} />
        <Button
          variant="outline"
          onClick={() => navigate('/teacher/courses')}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Courses
        </Button>
      </div>

      {/* Enhanced Unified Course Manager */}
      <EnhancedUnifiedCourseManager
        courseId={courseId}
        defaultTab={defaultTab}
      />
    </div>
  );
};

export default CourseManagement;
