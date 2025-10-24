
'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Icons } from './icons';

interface CustomSleepTimerDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onSetTimer: (durationMillis: number, label: string) => void;
}

export function CustomSleepTimerDialog({ isOpen, onOpenChange, onSetTimer }: CustomSleepTimerDialogProps) {
  const [minutes, setMinutes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const durationInMinutes = parseInt(minutes, 10);

    if (isNaN(durationInMinutes) || durationInMinutes <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Time',
        description: 'Please enter a valid number of minutes.',
      });
      return;
    }

    setIsLoading(true);
    const durationInMillis = durationInMinutes * 60 * 1000;
    onSetTimer(durationInMillis, `${durationInMinutes} minutes`);
    
    // Reset and close
    setIsLoading(false);
    setMinutes('');
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Custom Sleep Timer</DialogTitle>
          <DialogDescription>
            Playback will stop after the specified number of minutes.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="minutes" className="text-right">
                Minutes
              </Label>
              <Input
                id="minutes"
                type="number"
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                className="col-span-3"
                placeholder="e.g., 45"
                required
                min="1"
                disabled={isLoading}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />}
              Set Timer
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

    