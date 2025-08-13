
'use server';

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Users, Music, Activity } from 'lucide-react';
import { getAdminStats } from '@/lib/admin-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';

export default async function AdminDashboard() {
  const {
    userCount,
    publicPlaylistCount,
    latestSignups,
    latestPlaylists,
  } = await getAdminStats();

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-4xl">{userCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              All registered users
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Public Playlists</CardDescription>
            <CardTitle className="text-4xl">{publicPlaylistCount}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">
              Playlists shared by the community
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Signups</CardTitle>
            <Link href="/admin/users">
              <Button asChild variant="outline" size="sm" className="ml-auto gap-1">
                <Link href="/admin/users">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestSignups.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                    </TableCell>
                    <TableCell>{user.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Playlists</CardTitle>
             <Link href="/admin/playlists">
              <Button asChild variant="outline" size="sm" className="ml-auto gap-1">
                <Link href="/admin/playlists">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playlist</TableHead>
                  <TableHead>Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestPlaylists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell>
                       <Link href={`/playlists/${playlist.id}`} className="font-medium hover:underline" target="_blank">
                        {playlist.name}
                       </Link>
                    </TableCell>
                    <TableCell>{playlist.owner}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
