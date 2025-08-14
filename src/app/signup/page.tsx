
"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Icons } from "@/components/icons";
import { useToast } from "@/hooks/use-toast";
import { signUp, signInWithGoogle, handleGoogleSignInFromNative } from "@/lib/auth";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Camera } from "lucide-react";

// Extend the window type to include our optional AndroidBridge and the new callback
declare global {
  interface Window {
    Android?: {
      chooseProfileImage: () => void;
      signInWithGoogle: () => void;
    };
    updateProfileImage?: (imageDataUrl: string) => void;
    handleGoogleSignInFromNative?: (token: string) => Promise<any>;
  }
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // This effect handles the callback from the native Android app
  useEffect(() => {
    // Define the callback function that the native app will call for profile images
    window.updateProfileImage = (imageDataUrl: string) => {
      setPhotoDataUrl(imageDataUrl); // Store the raw data for submission
      setPhotoPreview(imageDataUrl); // Update the preview
    };
    
    // A function to handle the native sign-in result and redirect
    const processNativeSignIn = async (idToken: string) => {
        setIsGoogleLoading(true);
        try {
            await handleGoogleSignInFromNative(idToken);
            router.push('/');
            router.refresh();
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Google Sign-In Failed",
                description: "Could not sign in with the provided Google account.",
            });
            setIsGoogleLoading(false);
        }
        // No finally block for setIsLoading(false) because the page will redirect on success
    };

    // Expose the Google Sign-In function to the window object for the native app to call.
    window.handleGoogleSignInFromNative = processNativeSignIn;

    // Cleanup the functions when the component unmounts
    return () => {
      delete window.updateProfileImage;
      delete window.handleGoogleSignInFromNative;
    };
  }, [router, toast]);


  // This function is for the web file input fallback
  const handleWebPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUrl = reader.result as string;
        setPhotoDataUrl(dataUrl);
        setPhotoPreview(dataUrl);
      };
      reader.readAsDataURL(file);
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

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await signUp(email, password, name, photoDataUrl);
      router.push('/');
      router.refresh();
    } catch (error: any) {
       toast({
        variant: "destructive",
        title: "Sign-up Failed",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      // This will now either trigger the native flow or the web popup
      await signInWithGoogle();
      // For the web flow, we redirect here. For native, the useEffect handles it.
      if (!window.Android) {
        router.push('/');
        router.refresh();
      }
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Google Sign-In Failed",
        description: error.code === 'auth/popup-closed-by-user' 
          ? 'The sign-in popup was closed before completion.'
          : error.message,
      });
    } finally {
      if (!window.Android) {
          setIsGoogleLoading(false);
      }
    }
  };


  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleSignup}>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Sign Up</CardTitle>
          <CardDescription>
            Create an account to start listening.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="relative group mx-auto">
            <Avatar className="h-24 w-24">
              <AvatarImage src={photoPreview || undefined} alt={name} data-ai-hint="user avatar" />
              <AvatarFallback>{name?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
            </Avatar>
              <Button 
                type="button" 
                variant="outline" 
                size="icon" 
                className="absolute bottom-0 right-0 rounded-full bg-background/80 backdrop-blur-sm group-hover:bg-background"
                onClick={handleProfileImageClick}
              >
                  <Camera className="h-4 w-4"/>
                  <span className="sr-only">Add Photo</span>
              </Button>
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
           <div className="grid grid-cols-2 gap-4">
            <Button variant="outline" type="button" onClick={handleGoogleSignIn} disabled={isLoading || isGoogleLoading}>
               {isGoogleLoading ? (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Icons.google className="mr-2 h-4 w-4" />
              )}
              Google
            </Button>
            <Button variant="outline" type="button" disabled>
              <Icons.facebook className="mr-2 h-4 w-4" />
              Facebook
            </Button>
          </div>
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">
                Or continue with
              </span>
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" type="text" placeholder="Jane Doe" required value={name} onChange={e => setName(e.target.value)} disabled={isGoogleLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isGoogleLoading} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isGoogleLoading} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? "Creating Account..." : "Create Account"}
          </Button>
        </CardContent>
        <CardFooter className="text-sm">
          <p>
            Already have an account?{" "}
            <Link href="/login" className="underline hover:text-primary">
              Login
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
