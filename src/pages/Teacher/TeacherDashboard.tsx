import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Plus } from "lucide-react";

const TeacherDashboard = () => {
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Teacher Dashboard</h1>
        <Button asChild className="bg-orange-600 w-full sm:w-auto">
          <Link to="/teacher/courses/create">
            <Plus className="mr-2 h-4 w-4" /> Create New Course
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2">
              <Button variant="outline" asChild className="w-full">
                <Link to="/teacher/courses">View All Courses</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/teacher/earnings">View Earnings</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Your recent teaching activity will appear here.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TeacherDashboard;
