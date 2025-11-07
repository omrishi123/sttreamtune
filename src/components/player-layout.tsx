
"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  Users,
  PlusCircle,
  User as UserIcon,
  LogOut,
  Radio,
  Flame,
  ShieldCheck,
  Moon,
  Sun,
  MicVocal,
} from "lucide-react";
import { useTheme } from "next-themes";
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
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import type { User as AppUser, Playlist } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserData } from "@/context/user-data-context";
import { AddPlaylistDialog } from "./add-playlist-dialog";
import { AppInitializer } from "./app-initializer";
import { AnimatePresence, motion } from 'framer-motion';

interface PlayerLayoutProps {
  children: React.ReactNode;
  user: AppUser | null;
}

export function PlayerLayout({ children, user }: PlayerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { playlists: userPlaylists } = useUserData();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  const [navItems, setNavItems] = useState([
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/live", label: "Live", icon: Radio },
    { href: "/recommended", label: "Recommended", icon: Flame },
    { href: "/library", label: "Library", icon: Library },
    { href: "/community", label: "Community", icon: Users },
  ]);

  useEffect(() => {
    if (user?.isAdmin) {
      setNavItems(prev => {
        if (prev.some(item => item.href === '/admin')) {
          return prev;
        }
        return [
          ...prev,
          { href: "/admin", label: "Admin", icon: ShieldCheck }
        ];
      });
    }
  }, [user]);

  
  const currentUserPlaylists = userPlaylists;

  if (isMobile === undefined) {
     return null; // Return null during SSR or initial client render
  }

  if (!user) {
    // This case should not be hit if LayoutProvider logic is correct, but as a fallback
    return null;
  }
  
  const isGuest = user.id === 'guest';
  const userAvatar = user.photoURL || "https://placehold.co/100x100.png";

  return (
    <SidebarProvider defaultOpen>
      <AppInitializer />
      <div className="relative flex h-screen flex-col">
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
                      <AddPlaylistDialog>
                        <button className="p-1 hover:text-sidebar-foreground transition-colors">
                          <PlusCircle className="h-4 w-4" />
                        </button>
                      </AddPlaylistDialog>
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
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="h-7 w-7">
                            <AvatarImage src={userAvatar} alt={user.name} data-ai-hint="user avatar" />
                            <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                          </Avatar>
                          {user.isVerified && (
                             <Icons.verified className="absolute -bottom-1 -right-1 h-4 w-4" />
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 mb-2 ml-2" side="top" align="start">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.isVerified && <Icons.verified className="h-4 w-4" />}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push('/profile')} disabled={isGuest}>
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span>Toggle theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setTheme("light")}>
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")}>
                          Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("sunset")}>
                          Sunset Groove
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("zenith")}>
                          Zenith
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")}>
                          System
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
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
          <SidebarInset className="overflow-y-auto bg-background pb-48 md:pb-24">
             <div className="absolute inset-0 z-[-1] bg-gradient-to-tr from-background via-primary/10 to-accent/10 dark:via-primary/5 dark:to-accent/5 opacity-70 blur-3xl"></div>
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
                      <div className="relative">
                        <Avatar className="h-8 w-8 cursor-pointer">
                          <AvatarImage src={userAvatar} alt={user.name} data-ai-hint="user avatar" />
                          <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                        </Avatar>
                         {user.isVerified && (
                             <Icons.verified className="absolute -bottom-1 -right-1 h-4 w-4" />
                          )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-4" side="bottom" align="end">
                      <DropdownMenuLabel className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {user.isVerified && <Icons.verified className="h-4 w-4" />}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push('/profile')} disabled={isGuest}>
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger>
                          <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          <span>Toggle theme</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent>
                            <DropdownMenuItem onClick={() => setTheme("light")}>
                              Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")}>
                              Dark
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setTheme("sunset")}>
                              Sunset Groove
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("zenith")}>
                              Zenith
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")}>
                              System
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
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
            <main className="p-6 pt-0 md:pt-6">
                {children}
            </main>
          </SidebarInset>
        </div>
        <Player />
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 md:hidden">
            <div className="flex justify-around items-center h-16">
              {navItems.map((item) => (
                <Link key={item.href} href={item.href} className="flex-1">
                  <div className={cn(
                    "flex flex-col items-center justify-center gap-1 h-full transition-colors",
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
