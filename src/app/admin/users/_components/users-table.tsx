

'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import type { User } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, UserCog, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Icons } from '@/components/icons';

interface UsersTableProps {
  initialUsers: User[];
  onRoleChangeClick: (user: User) => void;
  onVerifyClick: (user: User) => void;
}

export function UsersTable({ initialUsers, onRoleChangeClick, onVerifyClick }: UsersTableProps) {
  const [users] = React.useState(initialUsers);

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Users</CardTitle>
        <CardDescription>View and manage all registered users.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead className="hidden sm:table-cell">Email</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex items-center gap-4">
                    <Avatar className="hidden h-9 w-9 sm:flex">
                      <AvatarImage src={user.photoURL} alt={user.name} />
                      <AvatarFallback>{user.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div className="grid gap-1">
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium truncate">{user.name}</p>
                        {user.isVerified && <Icons.verified className="h-4 w-4 text-blue-500" />}
                      </div>
                      <p className="text-xs text-muted-foreground sm:hidden truncate">{user.email}</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {user.isAdmin && <Badge variant="destructive">Admin</Badge>}
                    {user.isVerified && <Badge variant="default" className="bg-blue-500 hover:bg-blue-500/80">Verified</Badge>}
                    {!user.isAdmin && !user.isVerified && <Badge variant="outline">User</Badge>}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onVerifyClick(user)}>
                        <Check className="mr-2 h-4 w-4" />
                        {user.isVerified ? 'Remove Verification' : 'Verify User'}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => onRoleChangeClick(user)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        {user.isAdmin ? 'Demote to User' : 'Promote to Admin'}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
