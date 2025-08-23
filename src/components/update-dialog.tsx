
'use client';

import React, { useState, useEffect } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from './ui/scroll-area';

interface UpdateDialogProps {
  isOpen: boolean;
  updateUrl: string | null;
  latestVersion: string | null;
  updateNotes: string | null;
}

export function UpdateDialog({ isOpen, updateUrl, latestVersion, updateNotes }: UpdateDialogProps) {
    const [open, setOpen] = useState(isOpen);

    useEffect(() => {
        setOpen(isOpen);
    }, [isOpen]);

    const handleUpdate = () => {
        if (updateUrl) {
            window.open(updateUrl, '_blank');
        }
        setOpen(false);
    }
  
  return (
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Update Available</AlertDialogTitle>
            <AlertDialogDescription>
              A new version ({latestVersion}) of StreamTune is available. Please update for the best experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {updateNotes && (
            <div className="space-y-2">
                <h3 className="font-semibold text-sm">What's new:</h3>
                <ScrollArea className="h-24 w-full rounded-md border p-3 bg-muted/50">
                   <p className="text-sm text-muted-foreground whitespace-pre-wrap">{updateNotes}</p>
                </ScrollArea>
            </div>
          )}
          <AlertDialogFooter>
             <AlertDialogCancel asChild>
                <Button variant="outline" onClick={() => setOpen(false)}>Later</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
                <Button onClick={handleUpdate}>Update Now</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
  );
}
