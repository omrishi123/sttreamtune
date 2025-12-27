
'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { clearRecommendationsCache } from '@/lib/recommendations';
import { updateUserRefreshPromptTimestamp } from '@/lib/preferences';

interface RefreshDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export function RefreshRecommendationsDialog({ isOpen, onOpenChange }: RefreshDialogProps) {
  const { toast } = useToast();

  const handleRefresh = () => {
    clearRecommendationsCache();
    updateUserRefreshPromptTimestamp();
    toast({
      title: 'Recommendations Refreshed',
      description: 'Your personalized playlists will be updated. You may need to refresh the page.',
    });
    onOpenChange(false);
    // Optionally force a reload to see changes immediately
    window.location.reload();
  };

  const handleCancel = () => {
    updateUserRefreshPromptTimestamp(); // Snooze for another 15 days
    onOpenChange(false);
  }

  return (
    <AlertDialog open={isOpen} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Refresh Your Vibe?</AlertDialogTitle>
          <AlertDialogDescription>
            It's been a while! Would you like to discover new playlists based on
            your music tastes?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel}>Maybe Later</AlertDialogCancel>
          <AlertDialogAction onClick={handleRefresh}>Yes, Refresh</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
