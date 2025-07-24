"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  PlusCircle,
  User,
  LogOut,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { logout } from "@/lib/auth";
import { Icons } from "@/components/icons";
import { Player } from "@/components/player";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as AppUser, Playlist } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";

interface PlayerLayoutProps {
  children: React.ReactNode;
  user: AppUser | null;
}

export function PlayerLayout({ children, user }: PlayerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Your Library", icon: Library },
  ];
  
  const currentUserPlaylists: Playlist[] = [];

  if (!user) {
    return (
       <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Icons.logo className="h-12 w-12 animate-pulse" />
          <p className="text-muted-foreground">Loading your experience...</p>
        </div>
      </div>
    );
  }
  
  const isGuest = user.id === 'guest';

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            side="left"
            variant="sidebar"
            collapsible="icon"
            className="hidden md:flex border-r border-sidebar-border bg-sidebar"
          >
            <SidebarHeader>
              <Link
                href="/"
                className="flex items-center gap-2 text-lg font-semibold text-sidebar-foreground"
              >
                <Icons.logo className="h-6 w-6" />
                <span className="font-headline group-data-[collapsible=icon]:hidden">
                  StreamTune
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                    >
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              {!isGuest && currentUserPlaylists && currentUserPlaylists.length > 0 && (
                <>
                  <SidebarSeparator />
                  <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between">
                      <span>Playlists</span>
                      <button className="p-1 hover:text-sidebar-foreground transition-colors">
                        <PlusCircle className="h-4 w-4" />
                      </button>
                    </SidebarGroupLabel>
                    <SidebarMenu>
                      {currentUserPlaylists.map((playlist) => (
                        <SidebarMenuItem key={playlist.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === `/playlists/${playlist.id}`}
                            tooltip={playlist.name}
                          >
                            <Link href={`/playlists/${playlist.id}`}>
                              <Icons.playlist className="text-muted-foreground" />
                              <span>{playlist.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                </>
              )}
            </SidebarContent>
            <SidebarFooter>
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <SidebarMenuButton asChild tooltip="Profile" className="w-full justify-start">
                      <div>
                        <Avatar className="h-7 w-7">
                          <AvatarImage src="https://placehold.co/100x100.png" alt={user.name} data-ai-hint="user avatar" />
                          <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
                  <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem disabled={isGuest}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                   {!isGuest && (
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  )}
                  {isGuest && (
                     <DropdownMenuItem onClick={() => router.push('/login')}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log in</span>
                      </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="overflow-y-auto bg-background pb-24 md:pb-0">
            <header className="p-4 md:hidden flex items-center justify-between">
                 <Link
                    href="/"
                    className="flex items-center gap-2 text-lg font-semibold"
                  >
                    <Icons.logo className="h-6 w-6" />
                    <span className="font-headline">
                      StreamTune
                    </span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Avatar className="h-8 w-8 cursor-pointer">
                        <AvatarImage src="https://placehold.co/100x100.png" alt={user.name} data-ai-hint="user avatar" />
                        <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                      </Avatar>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-4" side="bottom" align="end">
                      <DropdownMenuLabel>{user.name}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem disabled={isGuest}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      {!isGuest && (
                        <DropdownMenuItem onClick={handleLogout}>
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      )}
                      {isGuest && (
                         <DropdownMenuItem onClick={() => router.push('/login')}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log in</span>
                          </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="p-6 pt-0 md:pt-6">{children}</main>
          </SidebarInset>
        </div>
        <Player />
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
            <div className="flex justify-around items-center h-16">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-1 w-20 transition-colors",
                    pathname === item.href ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  )}>
                    <item.icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{item.label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </nav>
        )}
      </div>
    </SidebarProvider>
  );
}
