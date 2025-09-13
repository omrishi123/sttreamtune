
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
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserActivityStats } from '@/lib/admin-actions';
import { formatDistanceToNow } from 'date-fns';
import type { UserActivity } from '@/lib/types';
import { onAuthChange } from '@/lib/auth';

interface ActivityStats {
    activeUsers: {
        '24h': number;
        '7d': number;
        '15d': number;
        '30d': number;
    },
    allActivities: UserActivity[];
}

function AdminActivitySkeleton() {
    return (
        <div className="grid auto-rows-max items-start gap-4 md:gap-8">
            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                {Array.from({length: 4}).map((_, i) => (
                    <Card key={i}>
                        <CardHeader className="pb-2">
                            <Skeleton className="h-4 w-20" />
                            <Skeleton className="h-10 w-16" />
                        </CardHeader>
                        <CardContent>
                            <Skeleton className="h-4 w-24" />
                        </CardContent>
                    </Card>
                ))}
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>A list of recently active users and guests.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="space-y-2">
                        {Array.from({length: 5}).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

const getRole = (activity: UserActivity, adminId: string | undefined): string => {
    if (activity.userId === adminId) return 'Admin';
    if (activity.isGuest) return 'Guest';
    return 'User';
}


export default function AdminActivityPage() {
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentAdmin, setCurrentAdmin] = useState<{id: string} | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthChange(user => {
      if (user) {
        setCurrentAdmin({ id: user.id });
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const fetchedStats = await getUserActivityStats();
        setStats(fetchedStats);
      } catch (err: any) {
        console.error("Failed to fetch activity stats:", err);
        setError("Could not load activity data.");
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading || !currentAdmin) {
    return <AdminActivitySkeleton />;
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
    return <p>No activity data available.</p>;
  }

  return (
    <div className="grid auto-rows-max items-start gap-4 md:gap-8">
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 24 Hours</CardDescription>
            <CardTitle className="text-4xl">{stats.activeUsers['24h']}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Active users</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 7 Days</CardDescription>
            <CardTitle className="text-4xl">{stats.activeUsers['7d']}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Active users</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 15 Days</CardDescription>
            <CardTitle className="text-4xl">{stats.activeUsers['15d']}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Active users</div>
          </CardContent>
        </Card>
         <Card>
          <CardHeader className="pb-2">
            <CardDescription>Last 30 Days</CardDescription>
            <CardTitle className="text-4xl">{stats.activeUsers['30d']}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground">Active users</div>
          </CardContent>
        </Card>
      </div>

       <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>A list of the most recently active devices (up to 100).</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead className="text-right">Last Seen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats.allActivities.map((activity) => {
                  const role = getRole(activity, currentAdmin?.id);
                  return (
                    <TableRow key={activity.deviceId}>
                      <TableCell>
                        <div className="font-medium">{activity.userName}</div>
                        <div className="text-xs text-muted-foreground">{activity.deviceId}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={role === 'Admin' ? 'destructive' : role === 'User' ? 'default' : 'secondary'}>
                          {role}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.lastSeen), { addSuffix: true })}
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
    </div>
  );
}
