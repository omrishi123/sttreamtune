
'use client';

import { getAllUsers, updateUserRole } from '@/lib/admin-actions';
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
import { Button } from '@/components/ui/button';

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


export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
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

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setIsUpdating(true);
    try {
      const newAdminStatus = !selectedUser.isAdmin;
      await updateUserRole(selectedUser.id, newAdminStatus);
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, isAdmin: newAdminStatus } : u));
      toast({
        title: 'Success',
        description: `${selectedUser.name}'s role has been updated.`,
      });
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: err.message || 'Failed to update user role.',
      });
    } finally {
      setIsUpdating(false);
      setSelectedUser(null);
    }
  };

  if (loading) {
    return <UsersPageSkeleton />;
  }

  if (error) {
    return <div className="text-destructive">{error}</div>;
  }

  return (
    <>
      <div className="space-y-6">
        <h2 className="text-2xl font-bold mb-4">User Management</h2>
        <UsersTable 
          initialUsers={users}
          onRoleChangeClick={setSelectedUser}
        />
      </div>
      <AlertDialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Role Change</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {selectedUser?.isAdmin ? 'demote' : 'promote'} <span className="font-bold">{selectedUser?.name}</span> to {selectedUser?.isAdmin ? 'a regular User' : 'an Admin'}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRoleChange} disabled={isUpdating}>
              {isUpdating ? 'Updating...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
