
'use client';

import { getAppConfig } from '@/lib/admin-actions';
import { AppConfigForm } from './_components/app-config-form';
import React, { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface AppConfig {
  latestVersion: string;
  updateUrl: string;
}

function SettingsPageSkeleton() {
    return (
         <div className="mx-auto grid w-full max-w-6xl gap-2">
            <h1 className="text-3xl font-semibold">Settings</h1>
            <div className="grid gap-6">
                <div className="border rounded-lg p-6 space-y-4">
                    <Skeleton className="h-8 w-72" />
                    <Skeleton className="h-4 w-96" />
                    <div className="pt-4 space-y-6">
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                         <div className="space-y-2">
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-10 w-full" />
                        </div>
                    </div>
                    <Skeleton className="h-10 w-20 mt-4" />
                </div>
            </div>
        </div>
    )
}

export default function AdminSettingsPage() {
  const [appConfig, setAppConfig] = useState<AppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConfig() {
        try {
            setLoading(true);
            const config = await getAppConfig();
            setAppConfig(config);
        } catch (err: any) {
            console.error("Failed to fetch app config:", err);
            setError("Could not load settings.");
        } finally {
            setLoading(false);
        }
    }
    fetchConfig();
  }, []);

  if (loading) {
    return <SettingsPageSkeleton />;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }
  
  if (!appConfig) {
      return <div>Could not load configuration.</div>
  }

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-2">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="grid gap-6">
        <AppConfigForm initialConfig={appConfig} />
      </div>
    </div>
  );
}
