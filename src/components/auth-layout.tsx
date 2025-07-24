import React from "react";
import { Icons } from "@/components/icons";

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 left-8">
        <div className="flex items-center gap-2 text-lg font-semibold">
          <Icons.logo className="h-6 w-6" />
          <span className="font-headline">StreamTune</span>
        </div>
      </div>
      {children}
    </div>
  );
}
