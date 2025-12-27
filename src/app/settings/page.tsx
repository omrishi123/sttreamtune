
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { usePlayer } from '@/context/player-context';
import { useToast } from '@/hooks/use-toast';
import { clearRecommendationsCache, clearSearchHistoryCache } from '@/lib/recommendations';
import { clearUserPreferences } from '@/lib/preferences';
import { User, Palette, Film, HardDrive, Trash2, RefreshCcw, ListMusic } from 'lucide-react';
import { cn } from '@/lib/utils';
import { onAuthChange } from '@/lib/auth';
import type { User as AppUser } from '@/lib/types';


const themes = [
    { name: 'Light', value: 'light', bg: 'bg-slate-100' },
    { name: 'Dark', value: 'dark', bg: 'bg-slate-800' },
    { name: 'Sunset Groove', value: 'sunset', bg: 'bg-[#2a2a3f]' },
    { name: 'Zenith', value: 'zenith', bg: 'bg-[#f5f1ec]' },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { playbackQuality, setPlaybackQuality } = usePlayer();
  const [user, setUser] = useState<AppUser | null>(null);

  React.useEffect(() => {
    const unsubscribe = onAuthChange(setUser);
    return () => unsubscribe();
  }, []);

  const handleClearSearchHistory = () => {
    clearSearchHistoryCache();
    toast({ title: 'Search History Cleared' });
  };

  const handleResetRecommendations = () => {
    clearRecommendationsCache();
    toast({ title: 'Recommendations Reset', description: 'Your home page will now show fresh playlists. You may need to refresh the page.' });
  };

    const handleChangeCategories = () => {
    clearUserPreferences(); 
    clearRecommendationsCache();
    clearSearchHistoryCache();
    router.push('/welcome');
  };
  
  const handleClearAllData = () => {
    if (typeof window !== 'undefined') {
        const devicePrefs = localStorage.getItem('streamtune-device-preferences');
        
        localStorage.clear();

        if (devicePrefs) {
            localStorage.setItem('streamtune-device-preferences', devicePrefs);
        }
        
        toast({ title: 'All Cached Data Cleared', description: 'App data has been reset to defaults.' });
    }
  };

  const isGuest = user?.id === 'guest';


  return (
    <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex justify-between items-start">
            <div>
                <h1 className="text-4xl font-bold font-headline tracking-tight">
                    Settings
                </h1>
                <p className="text-muted-foreground mt-2">
                    Customize your app experience.
                </p>
            </div>
            {!isGuest && (
                 <Button onClick={() => router.push('/profile')} variant="outline">
                    <User className="mr-2 h-4 w-4" />
                    View Profile
                </Button>
            )}
        </div>
        
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Palette /> Appearance
                </CardTitle>
                <CardDescription>
                    Choose how StreamTune looks and feels. Your current theme is <span className="font-semibold text-primary">{theme}</span>.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {themes.map((t) => (
                         <div key={t.value} className="space-y-2">
                            <Button 
                                variant="outline" 
                                className={cn("w-full h-24 border-2", theme === t.value && "border-primary ring-2 ring-primary")}
                                onClick={() => setTheme(t.value)}
                            >
                                <div className={cn("h-full w-full rounded-sm", t.bg)} />
                            </Button>
                            <p className="text-sm text-center font-medium">{t.name}</p>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Film /> Playback
                </CardTitle>
                <CardDescription>
                    Manage audio and video playback settings.
                </CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="grid w-full max-w-sm items-center gap-2">
                    <Label htmlFor="quality">Video Quality</Label>
                    <Select value={playbackQuality} onValueChange={setPlaybackQuality}>
                        <SelectTrigger id="quality">
                            <SelectValue placeholder="Select quality..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="default">Auto</SelectItem>
                            <SelectItem value="highres">Highest</SelectItem>
                            <SelectItem value="hd1080">1080p</SelectItem>
                            <SelectItem value="hd720">720p</SelectItem>
                            <SelectItem value="large">480p</SelectItem>
                            <SelectItem value="medium">360p (Data Saver)</SelectItem>
                            <SelectItem value="small">240p (Extreme Data Saver)</SelectItem>
                        </SelectContent>
                    </Select>
                     <p className="text-xs text-muted-foreground pt-1">
                        Select a lower quality to save data on mobile networks.
                    </p>
                </div>
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <HardDrive /> Data Management
                </CardTitle>
                <CardDescription>
                    Manage your locally stored data and recommendations.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Clear Search History</h4>
                        <p className="text-sm text-muted-foreground">This will remove your recent search terms.</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm">Clear</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will permanently delete your search history.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleClearSearchHistory}>Clear</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Reset Recommended Playlists</h4>
                        <p className="text-sm text-muted-foreground">Clears cached personalized playlists to fetch new ones.</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" size="sm">Reset</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will clear all AI-generated genre playlists. They will be re-fetched the next time you visit the home page.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleResetRecommendations}>Reset</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                        <h4 className="font-semibold">Change Music Taste</h4>
                        <p className="text-sm text-muted-foreground">Go back to the welcome screen to re-select your genres.</p>
                    </div>
                     <AlertDialog>
                        <AlertDialogTrigger asChild>
                             <Button variant="outline" size="sm">Change</Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>Change your genres?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This will take you to the welcome screen to pick new genres. Your recommendations will be updated.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleChangeCategories}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </CardContent>
            <CardFooter>
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Clear All Cached App Data
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will clear all tracks, playlists, and settings from your device's cache. Your account data will not be affected. This action cannot be undone.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleClearAllData} className="bg-destructive hover:bg-destructive/90">
                            Clear Everything
                        </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    </div>
  )
}
