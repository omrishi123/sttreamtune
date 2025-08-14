
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from 'next/navigation';
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
import { login, signInWithGoogle, sendPasswordReset, handleGoogleSignInFromNative } from "@/lib/auth";

// Extend the window object to include our native callback handler
declare global {
  interface Window {
    handleGoogleSignInFromNative?: (token: string) => Promise<any>;
  }
}

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // This effect handles the callback from the native Android app
  useEffect(() => {
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

    // Expose the function to the window object for the native app to call.
    window.handleGoogleSignInFromNative = processNativeSignIn;

    // Cleanup the function when the component unmounts
    return () => {
      delete window.handleGoogleSignInFromNative;
    };
  }, [router, toast]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      router.push('/');
      router.refresh();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Login Failed",
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
      // @ts-ignore
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
      // @ts-ignore
      if (!window.Android) {
          setIsGoogleLoading(false);
      }
    }
  };
  
  const handlePasswordReset = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email Required",
        description: "Please enter your email address to reset your password.",
      });
      return;
    }
    try {
      await sendPasswordReset(email);
      toast({
        title: "Password Reset Email Sent",
        description: "Check your inbox (and spam folder) for a link to reset your password.",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Reset Failed",
        description: error.message,
      });
    }
  };

  const handleGuest = () => {
    router.push('/');
  };

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={handleLogin}>
        <CardHeader>
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account or continue as a guest.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
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
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="m@example.com" required value={email} onChange={e => setEmail(e.target.value)} disabled={isGoogleLoading} />
          </div>
          <div className="grid gap-2">
             <div className="flex items-center justify-between">
               <Label htmlFor="password">Password</Label>
               <Button type="button" variant="link" className="px-0 h-auto text-sm" onClick={handlePasswordReset}>
                  Forgot password?
               </Button>
             </div>
            <Input id="password" type="password" required value={password} onChange={e => setPassword(e.target.value)} disabled={isGoogleLoading} />
          </div>
          <Button type="submit" className="w-full" disabled={isLoading || isGoogleLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
           <Button variant="secondary" className="w-full" type="button" onClick={handleGuest}>
            Continue as a Guest
          </Button>
        </CardContent>
        <CardFooter className="text-sm">
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="underline hover:text-primary">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
