

'use client';

import { getAllUsers, updateUserRole, updateUserVerification } from '@/lib/admin-actions';
import { UsersTable } from './_components/users-table';
import React, { useEffect, useState } from 'react';
import type { User } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

function UsersPageSkeleton() {
  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <div className="border rounded-lg p-4">
        <Skeleton className="h-8 w-48 mb-4" />
        <div className="space-y-2">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

type DialogState = 
  | { type: 'role'; user: User }
  | { type: 'verify'; user: User }
  | null;

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogState, setDialogState] = useState<DialogState>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchUsers() {
      try {
        setLoading(true);
        const fetchedUsers = await getAllUsers();
        setUsers(fetchedUsers);
      } catch (err: any) {
        console.error("Failed to fetch users:", err);
        setError("Could not load users.");
      } finally {
        setLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const handleConfirm = async () => {
    if (!dialogState) return;
    setIsUpdating(true);

    const { type, user } = dialogState;

    try {
        if (type === 'role') {
            const newAdminStatus = !user.isAdmin;
            await updateUserRole(user.id, newAdminStatus);
            setUsers(users.map(u => u.id === user.id ? { ...u, isAdmin: newAdminStatus } : u));
            toast({
                title: 'Success',
                description: `${user.name}'s role has been updated.`,
            });
        } else if (type === 'verify') {
            const newVerifiedStatus = !user.isVerified;
            await updateUserVerification(user.id, newVerifiedStatus);
             setUsers(users.map(u => u.id === user.id ? { ...u, isVerified: newVerifiedStatus } : u));
            toast({
                title: 'Success',
                description: `${user.name}'s verification status has been updated.`,
            });
        }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update user.',
      });
    } finally {
      setIsUpdating(false);
      setDialogState(null);
    }
  };

  if (loading) {
    return <UsersPageSkeleton />;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  const getDialogContent = () => {
    if (!dialogState) return null;
    if (dialogState.type === 'role') {
        return {
            title: 'Confirm Role Change',
            description: `Are you sure you want to ${dialogState.user.isAdmin ? 'demote' : 'promote'} ${dialogState.user.name} to ${dialogState.user.isAdmin ? 'a regular User' : 'an Admin'}?`
        }
    }
     if (dialogState.type === 'verify') {
        return {
            title: 'Confirm Verification',
            description: `Are you sure you want to ${dialogState.user.isVerified ? 'remove verification from' : 'verify'} ${dialogState.user.name}?`
        }
    }
    return null;
  }

  const dialogContent = getDialogContent();

  return (
    <>
      <div className="space-y-6">
        <UsersTable 
          initialUsers={users}
          onRoleChangeClick={(user) => setDialogState({ type: 'role', user })}
          onVerifyClick={(user) => setDialogState({ type: 'verify', user })}
        />
      </div>
      <AlertDialog open={!!dialogState} onOpenChange={() => setDialogState(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogContent?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {dialogContent?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
