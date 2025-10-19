
'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { onAuthChange, updateUserProfile } from '@/lib/auth';
import type { User, Track } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Icons } from '@/components/icons';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Camera,
  Music,
  Clock,
  User as UserIcon,
  Heart,
  BarChart,
  Edit,
  X,
  BadgeCheck,
} from 'lucide-react';
import { useUserData } from '@/context/user-data-context';
import { genres as allGenres } from '@/lib/genres';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';

// Extend the window type to include our optional AndroidBridge and the new callback
declare global {
  interface Window {
    Android?: {
      chooseProfileImage: () => void;
    };
    window: any;
    updateProfileImage?: (imageDataUrl: string) => void;
  }
}

// Function to resize and compress the image
const resizeImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 256;
        const MAX_HEIGHT = 256;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return reject(new Error('Could not get canvas context'));
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.8)); // Compress to JPEG with 80% quality
      };
      img.onerror = reject;
      img.src = event.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

interface ListeningStats {
  topArtists: { name: string; plays: number; artwork: string }[];
  totalMinutes: number;
  genreDistribution: { name: string; value: number }[];
}

const COLORS = [
  '#0088FE',
  '#00C49F',
  '#FFBB28',
  '#FF8042',
  '#8884d8',
  '#ff4d4d',
];

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState('');
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { recentlyPlayed, getTrackById, likedSongs } = useUserData();

  const listeningStats: ListeningStats = useMemo(() => {
    if (!recentlyPlayed || recentlyPlayed.length === 0) {
      return { topArtists: [], totalMinutes: 0, genreDistribution: [] };
    }

    const artistCounts: { [artist: string]: { plays: number; artwork: string } } = {};
    let totalSeconds = 0;
    const genreCounts: { [genre: string]: number } = {};
    const lowerCaseGenres = allGenres.map((g) => g.toLowerCase());

    recentlyPlayed.forEach((trackId) => {
      const track = getTrackById(trackId);
      if (track) {
        if (track.artist !== 'Unknown Artist') {
            if (!artistCounts[track.artist]) {
              artistCounts[track.artist] = { plays: 0, artwork: track.artwork };
            }
            artistCounts[track.artist].plays += 1;
        }

        totalSeconds += track.duration;

        const combinedText = `${track.title} ${track.artist} ${track.album}`.toLowerCase();
        lowerCaseGenres.forEach((genre, index) => {
          if (combinedText.includes(genre)) {
            const originalGenre = allGenres[index];
            genreCounts[originalGenre] = (genreCounts[originalGenre] || 0) + 1;
          }
        });
      }
    });

    const sortedArtists = Object.entries(artistCounts)
      .sort(([, a], [, b]) => b.plays - a.plays)
      .slice(0, 5)
      .map(([name, data]) => ({ name, ...data }));

    const genreDistribution = Object.entries(genreCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    return {
      topArtists: sortedArtists,
      totalMinutes: Math.floor(totalSeconds / 60),
      genreDistribution,
    };
  }, [recentlyPlayed, getTrackById]);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name);
        setPhotoPreview(currentUser.photoURL || null);
      } else {
        router.push('/login');
      }
    });
    return () => unsubscribe();
  }, [router]);

  useEffect(() => {
    // Define the callback function that the native app will call
    window.updateProfileImage = async (imageDataUrl: string) => {
      try {
        // Since we get a data URL, we need to convert it to a Blob/File to resize it
        const response = await fetch(imageDataUrl);
        const blob = await response.blob();
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
        const compressedDataUrl = await resizeImage(file);
        setPhotoDataUrl(compressedDataUrl);
        setPhotoPreview(compressedDataUrl);
      } catch (error) {
        console.error('Error processing native image:', error);
        toast({
          variant: 'destructive',
          title: 'Image Processing Failed',
          description: 'Could not process the selected image.',
        });
      }
    };

    // Cleanup the function when the component unmounts
    return () => {
      if (window.updateProfileImage) {
        delete window.updateProfileImage;
      }
    };
  }, [toast]);

  // This function is for the web file input fallback
  const handleWebPhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      try {
        const compressedDataUrl = await resizeImage(file);
        setPhotoDataUrl(compressedDataUrl);
        setPhotoPreview(compressedDataUrl);
      } catch (error) {
        console.error('Error resizing image:', error);
        toast({
          variant: 'destructive',
          title: 'Image Processing Failed',
          description: 'Could not process the selected image.',
        });
      }
    }
  };

  const handleProfileImageClick = () => {
    if (window.Android?.chooseProfileImage) {
      // Use native image picker
      window.Android.chooseProfileImage();
    } else {
      // Fallback to web file input
      fileInputRef.current?.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);
    try {
      // Pass the name and the new photo data URL (if any) to the update function
      await updateUserProfile(name, photoDataUrl);
      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
      // Exit edit mode and refresh the app's data to reflect changes everywhere
      setIsEditMode(false);
      router.refresh();
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelEdit = () => {
    if (user) {
        setName(user.name);
        setPhotoPreview(user.photoURL || null);
        setPhotoDataUrl(null);
    }
    setIsEditMode(false);
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Icons.logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
            <div className="flex items-center gap-3">
              <h1 className="text-4xl font-bold font-headline tracking-tight">
                {isEditMode ? 'Edit Profile' : user.name}
              </h1>
              {user.isVerified && !isEditMode && <BadgeCheck className="h-8 w-8 text-primary" />}
            </div>
            <p className="text-muted-foreground mt-2">
              {isEditMode ? 'Make changes to your profile.' : 'Your stats and profile settings.'}
            </p>
        </div>
        {!isEditMode && (
             <Button variant="outline" onClick={() => setIsEditMode(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Profile
            </Button>
        )}
      </div>

      {isEditMode ? (
           <Card>
          <form onSubmit={handleSubmit}>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2 flex flex-col items-center">
                    <Label>Profile Picture</Label>
                    <div className="relative group">
                    <Avatar className="h-24 w-24">
                        <AvatarImage
                        src={photoPreview || undefined}
                        alt={user.name}
                        data-ai-hint="user avatar"
                        />
                        <AvatarFallback>
                        {user.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                    <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="absolute bottom-0 right-0 rounded-full bg-background/80 backdrop-blur-sm group-hover:bg-background"
                        onClick={handleProfileImageClick}
                    >
                        <Camera className="h-4 w-4" />
                        <span className="sr-only">Change Photo</span>
                    </Button>
                    </div>
                    <Input
                    id="picture"
                    type="file"
                    accept="image/*"
                    onChange={handleWebPhotoChange}
                    disabled={isLoading}
                    ref={fileInputRef}
                    className="hidden"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    disabled={isLoading}
                    />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={user.email} disabled />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={handleCancelEdit} disabled={isLoading}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                    {isLoading ? (
                    <>
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                    </>
                    ) : (
                    'Save Changes'
                    )}
                </Button>
              </CardFooter>
          </form>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3 space-y-6">
            <Card>
                <CardHeader>
                <CardTitle>Listening Stats</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
                    <Clock className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">
                    {listeningStats.totalMinutes}
                    </p>
                    <p className="text-sm text-muted-foreground">Minutes Listened</p>
                </div>
                <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
                    <Music className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{recentlyPlayed.length}</p>
                    <p className="text-sm text-muted-foreground">Songs Played</p>
                </div>
                <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
                    <Heart className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">{likedSongs.length}</p>
                    <p className="text-sm text-muted-foreground">Liked Songs</p>
                </div>
                <div className="flex flex-col items-center justify-center space-y-2 p-4 bg-muted/50 rounded-lg">
                    <UserIcon className="h-8 w-8 text-primary" />
                    <p className="text-2xl font-bold">
                    {listeningStats.topArtists.length}
                    </p>
                    <p className="text-sm text-muted-foreground">
                    Artists Discovered
                    </p>
                </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                <CardHeader>
                    <CardTitle>Top Artists</CardTitle>
                    <CardDescription>
                    Your most played artists recently.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {listeningStats.topArtists.length > 0 ? (
                    <div className="space-y-4">
                        {listeningStats.topArtists.map((artist, index) => (
                        <div key={index} className="flex items-center gap-4">
                            <Avatar>
                            <AvatarImage
                                src={artist.artwork}
                                alt={artist.name}
                            />
                            <AvatarFallback>
                                {artist.name.charAt(0)}
                            </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                            <p className="font-semibold">{artist.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {artist.plays} plays
                            </p>
                            </div>
                        </div>
                        ))}
                    </div>
                    ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        Play some songs to see your top artists here!
                    </p>
                    )}
                </CardContent>
                </Card>

                <Card>
                <CardHeader>
                    <CardTitle>Your Vibe</CardTitle>
                    <CardDescription>
                    A breakdown of your top genres.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {listeningStats.genreDistribution.length > 0 ? (
                    <div className="h-[250px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                            data={listeningStats.genreDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                                `${name} ${(percent * 100).toFixed(0)}%`
                            }
                            >
                            {listeningStats.genreDistribution.map(
                                (entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={COLORS[index % COLORS.length]}
                                />
                                )
                            )}
                            </Pie>
                            <Tooltip
                            contentStyle={{
                                backgroundColor: 'hsl(var(--background))',
                                borderColor: 'hsl(var(--border))',
                            }}
                            />
                            <Legend />
                        </PieChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <p className="text-muted-foreground text-sm text-center py-4">
                        Listen to more songs to see your genre breakdown!
                    </p>
                    )}
                </CardContent>
                </Card>
            </div>
            </div>
        </div>
      )}
    </div>
  );
}
