
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const Settings = () => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            This is the settings page. Here you can manage your account settings, profile, 
            preferences and integrations.
          </p>
        </CardContent>
      </Card>
      
      {/* For teacher role only */}
      <Card>
        <CardHeader>
          <CardTitle>Connect Payment Account</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4 text-muted-foreground">
            Connect your Stripe account to receive payments for your courses.
          </p>
          <button className="bg-edu-accent hover:bg-orange-600 text-white px-4 py-2 rounded-md">
            Connect Stripe
          </button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;
