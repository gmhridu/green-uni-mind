import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink } from "lucide-react";

const Settings = () => {
  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Settings</h1>
      </div>
      
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
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
            <Button className="bg-edu-accent hover:bg-orange-600 text-white w-full sm:w-auto flex items-center gap-2">
              <ExternalLink className="h-4 w-4" />
              Connect Stripe
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Settings;
