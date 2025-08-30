
'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { clearAllRecommendationCaches, clearSearchHistoryCache } from '@/lib/recommendations';
import { clearUserPreferences } from '@/lib/preferences';
import { RefreshCcw, ListMusic, Trash2 } from 'lucide-react';

export function SettingsDialog({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const { toast } = useToast();
  const router = useRouter();

  const handleResetPlaylists = () => {
    clearAllRecommendationCaches();
    toast({
      title: 'Recommendations Reset',
      description: 'Your personalized playlists have been cleared. Refresh the home page to see new ones.',
    });
    setIsOpen(false);
  };
  
  const handleChangeCategories = () => {
    clearUserPreferences(); // This will force the welcome screen on next load
    clearAllRecommendationCaches();
    clearSearchHistoryCache();
    setIsOpen(false);
    router.push('/welcome');
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Recommendation Settings</DialogTitle>
          <DialogDescription>
            Manage your personalized music recommendations.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
            <Button variant="outline" className="justify-start" onClick={handleResetPlaylists}>
                <RefreshCcw className="mr-2 h-4 w-4" />
                Reset Recommended Playlists
            </Button>
             <Button variant="outline" className="justify-start" onClick={handleChangeCategories}>
                <ListMusic className="mr-2 h-4 w-4" />
                Change Music Taste / Genres
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
