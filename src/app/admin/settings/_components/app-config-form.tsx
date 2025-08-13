
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { updateAppConfig } from '@/lib/admin-actions';

interface AppConfig {
  latestVersion: string;
  updateUrl: string;
}

interface AppConfigFormProps {
  initialConfig: AppConfig;
}

export function AppConfigForm({ initialConfig }: AppConfigFormProps) {
  const [config, setConfig] = React.useState(initialConfig);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await updateAppConfig(config);
      toast({
        title: 'Success!',
        description: 'App configuration has been updated.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to update app configuration.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setConfig((prev) => ({ ...prev, [id]: value }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>App Update Configuration</CardTitle>
          <CardDescription>
            Control the in-app update notification for Android users.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="grid gap-3">
              <Label htmlFor="latestVersion">Latest Version</Label>
              <Input
                id="latestVersion"
                type="text"
                className="w-full"
                value={config.latestVersion}
                onChange={handleChange}
                placeholder="e.g., 1.0.2"
              />
            </div>
            <div className="grid gap-3">
              <Label htmlFor="updateUrl">Update URL</Label>
              <Input
                id="updateUrl"
                type="url"
                className="w-full"
                value={config.updateUrl}
                onChange={handleChange}
                placeholder="e.g., https://yourapp.com/update.apk"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Saving...' : 'Save'}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
