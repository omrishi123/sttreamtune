
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

interface UpdateDialogProps {
  isOpen: boolean;
  updateUrl: string | null;
  version: string | null;
}

export function UpdateDialog({ isOpen, updateUrl, version }: UpdateDialogProps) {
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
              A new version ({version}) of StreamTune is available. Please update to the latest version for the best experience.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
