
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { onAuthChange, updateUserProfile } from "@/lib/auth";
import type { User } from "@/lib/types";
import { useToast } from "@/hooks/use-toast";
import { Icons } from "@/components/icons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Camera } from "lucide-react";

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


export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [name, setName] = useState("");
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setName(currentUser.name);
        setPhotoPreview(currentUser.photoURL || null);
      } else {
        router.push("/login");
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
        const file = new File([blob], "profile.jpg", { type: "image/jpeg" });
        const compressedDataUrl = await resizeImage(file);
        setPhotoDataUrl(compressedDataUrl);
        setPhotoPreview(compressedDataUrl);
      } catch (error) {
        console.error("Error processing native image:", error);
        toast({
          variant: "destructive",
          title: "Image Processing Failed",
          description: "Could not process the selected image.",
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
        console.error("Error resizing image:", error);
        toast({
          variant: "destructive",
          title: "Image Processing Failed",
          description: "Could not process the selected image.",
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
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
      // Refresh the app's data to reflect changes everywhere
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Update Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

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
        <div>
            <h1 className="text-4xl font-bold font-headline tracking-tight">
            Manage Profile
            </h1>
            <p className="text-muted-foreground mt-2">
            Update your name and profile picture.
            </p>
        </div>
        <Card className="max-w-2xl">
            <CardHeader>
                <CardTitle>Profile Details</CardTitle>
                <CardDescription>Make changes to your profile here. Click save when you're done.</CardDescription>
            </CardHeader>
            <CardContent>
                 <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      <Label>Profile Picture</Label>
                      <div className="flex items-center gap-6">
                        <div className="relative group">
                          <Avatar className="h-24 w-24">
                            <AvatarImage src={photoPreview || undefined} alt={user.name} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.name?.charAt(0) || "U"}</AvatarFallback>
                          </Avatar>
                           <Button 
                              type="button" 
                              variant="outline" 
                              size="icon" 
                              className="absolute bottom-0 right-0 rounded-full bg-background/80 backdrop-blur-sm group-hover:bg-background"
                              onClick={handleProfileImageClick}
                            >
                                <Camera className="h-4 w-4"/>
                                <span className="sr-only">Change Photo</span>
                            </Button>
                        </div>
                        <p className="text-sm text-muted-foreground flex-1">
                          Click the camera icon to choose a new profile picture from your device.
                        </p>
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
                        <Input
                        id="email"
                        type="email"
                        value={user.email}
                        disabled
                        />
                         <p className="text-sm text-muted-foreground">Your email address cannot be changed.</p>
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    </div>
  );
}
