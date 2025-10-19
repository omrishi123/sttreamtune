
'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Ban } from 'lucide-react';

export default function AdminActivityPage() {
  return (
    <Card className="bg-destructive/10 border-destructive">
        <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
                <Ban />
                Feature Disabled
            </CardTitle>
            <CardDescription className="text-destructive/80">
                The user activity tracking feature has been disabled by request.
            </CardDescription>
        </CardHeader>
        <CardContent>
            <p className="text-sm text-destructive-foreground/90">
                This page and its related features are no longer active. All data collection for user activity has been stopped.
            </p>
        </CardContent>
    </Card>
  );
}
