
'use client';

import React, { useEffect, useState } from 'react';
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
import { Skeleton } from '@/components/ui/skeleton';
import { getAdminStats } from '@/lib/admin-actions';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowUpRight } from 'lucide-react';
import type { User, Playlist } from '@/lib/types';

interface AdminStats {
  userCount: number;
  publicPlaylistCount: number;
  latestSignups: User[];
  latestPlaylists: Playlist[];
}

function AdminDashboardSkeleton() {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Total Users</CardDescription>
                    <Skeleton className="h-10 w-16" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-24" />
                </CardContent>
                </Card>
                <Card>
                <CardHeader className="pb-2">
                    <CardDescription>Public Playlists</CardDescription>
                    <Skeleton className="h-10 w-16" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-4 w-32" />
                </CardContent>
                </Card>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Latest Signups</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle>Latest Playlists</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2">
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                            <Skeleton className="h-8 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}


export default function AdminDashboard() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const fetchedStats = await getAdminStats();
        setStats(fetchedStats);
      } catch (err: any) {
        console.error("Failed to fetch admin stats:", err);
        setError("Could not load dashboard data. Please ensure you have admin privileges and check the console.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <AdminDashboardSkeleton />;
  }

  if (error) {
    return (
        <Card className="bg-destructive/10 border-destructive">
            <CardHeader>
                <CardTitle className="text-destructive">Error</CardTitle>
                <CardDescription className="text-destructive">
                    {error}
                </CardDescription>
            </CardHeader>
        </Card>
    );
  }

  if (!stats) {
    return <p>No stats available.</p>;
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8 lg:col-span-2">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-4xl">{stats.userCount}</CardTitle>
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
            <CardTitle className="text-4xl">{stats.publicPlaylistCount}</CardTitle>
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
            <Button asChild variant="outline" size="sm" className="ml-auto gap-1">
              <Link href="/admin/users">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead className="hidden sm:table-cell">Email</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.latestSignups.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="font-medium">{user.name}</div>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{user.email}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Latest Playlists</CardTitle>
             <Button asChild variant="outline" size="sm" className="ml-auto gap-1">
              <Link href="/admin/playlists">
                View All
                <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Playlist</TableHead>
                  <TableHead className="hidden sm:table-cell">Owner</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.latestPlaylists.map((playlist) => (
                  <TableRow key={playlist.id}>
                    <TableCell>
                       <Link href={`/playlists/${playlist.id}`} className="font-medium hover:underline" target="_blank">
                        {playlist.name}
                       </Link>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">{playlist.owner}</TableCell>
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
