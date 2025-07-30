
'use client';

import React, { useState } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useUserData } from '@/context/user-data-context';
import { Switch } from './ui/switch';

export function AddPlaylistDialog({ children }: { children: React.ReactNode }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { createPlaylist } = useUserData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name) {
      createPlaylist(name, description, isPublic);
      setIsOpen(false);
      setName('');
      setDescription('');
      setIsPublic(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create new playlist</DialogTitle>
          <DialogDescription>
            Give your playlist a name and an optional description.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="col-span-3"
                required
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Input
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="col-span-3"
                placeholder="(Optional)"
              />
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="public" className="text-right">
                Public
              </Label>
              <div className="col-span-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Share with the community</span>
                <Switch
                    id="public"
                    checked={isPublic}
                    onCheckedChange={setIsPublic}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="secondary">
                Cancel
              </Button>
            </DialogClose>
            <Button type="submit">Create Playlist</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
