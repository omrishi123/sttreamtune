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
  Settings,
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
} from "@/components/ui/dropdown-menu";
import {
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
import { LikeAnimation } from "./LikeAnimation";

interface PlayerLayoutProps {
  children: React.ReactNode;
  user: AppUser | null;
}

export function PlayerLayout({ children, user }: PlayerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { playlists: userPlaylists, likeAnimationTrigger } = useUserData();
  const { setTheme } = useTheme();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
    router.refresh();
  };

  const [navItems, setNavItems] = useState([
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
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
      <LikeAnimation trigger={likeAnimationTrigger} />
      <div className="relative flex h-screen flex-col bg-transparent">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            side="left"
            variant="sidebar"
            collapsible="icon"
            className="hidden md:flex border-r border-white/5 bg-black/20 backdrop-blur-3xl"
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
                      className={cn(
                        "transition-all duration-300",
                        pathname === item.href ? "bg-white/10 shadow-lg" : "hover:bg-white/5"
                      )}
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
                  <SidebarSeparator className="bg-white/5" />
                  <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between text-white/40">
                      <span>Playlists</span>
                      <AddPlaylistDialog>
                        <button className="p-1 hover:text-white transition-colors">
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
                            className={cn(
                                "transition-all duration-300",
                                pathname === `/playlists/${playlist.id}` ? "bg-white/10" : "hover:bg-white/5"
                            )}
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
                   <SidebarMenuButton asChild tooltip="Profile" className="w-full justify-start hover:bg-white/5">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <Avatar className="h-7 w-7 ring-1 ring-white/10">
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
                <DropdownMenuContent className="w-56 mb-2 ml-2 glass-panel" side="top" align="start">
                  <DropdownMenuLabel className="flex items-center gap-2">
                    <span>{user.name}</span>
                    {user.isVerified && <Icons.verified className="h-4 w-4" />}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} disabled={isGuest} className="hover:bg-white/10">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="hover:bg-white/10">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </DropdownMenuItem>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="hover:bg-white/10">
                      <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                      <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                      <span>Toggle theme</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent className="glass-panel">
                        <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-white/10">
                          Light
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-white/10">
                          Dark
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("sunset")} className="hover:bg-white/10">
                          Sunset Groove
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("zenith")} className="hover:bg-white/10">
                          Zenith
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-white/10">
                          System
                        </DropdownMenuItem>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                   {!isGuest && (
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive hover:bg-destructive/10">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  )}
                  {isGuest && (
                     <DropdownMenuItem onClick={() => router.push('/login')} className="hover:bg-white/10">
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log in</span>
                      </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="overflow-y-auto bg-transparent pb-48 md:pb-24">
            <header className="p-4 md:hidden flex items-center justify-between sticky top-0 z-50 bg-black/40 backdrop-blur-xl border-b border-white/5">
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
                        <Avatar className="h-8 w-8 cursor-pointer ring-1 ring-white/20">
                          <AvatarImage src={userAvatar} alt={user.name} data-ai-hint="user avatar" />
                          <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                        </Avatar>
                         {user.isVerified && (
                             <Icons.verified className="absolute -bottom-1 -right-1 h-4 w-4" />
                          )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 mr-4 glass-panel" side="bottom" align="end">
                      <DropdownMenuLabel className="flex items-center gap-2">
                        <span>{user.name}</span>
                        {user.isVerified && <Icons.verified className="h-4 w-4" />}
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={() => router.push('/profile')} disabled={isGuest} className="hover:bg-white/10">
                        <UserIcon className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/settings')} className="hover:bg-white/10">
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <DropdownMenuSub>
                        <DropdownMenuSubTrigger className="hover:bg-white/10">
                          <Sun className="mr-2 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                          <Moon className="absolute mr-2 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                          <span>Toggle theme</span>
                        </DropdownMenuSubTrigger>
                        <DropdownMenuPortal>
                          <DropdownMenuSubContent className="glass-panel">
                            <DropdownMenuItem onClick={() => setTheme("light")} className="hover:bg-white/10">
                              Light
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("dark")} className="hover:bg-white/10">
                              Dark
                            </DropdownMenuItem>
                             <DropdownMenuItem onClick={() => setTheme("sunset")} className="hover:bg-white/10">
                              Sunset Groove
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("zenith")} className="hover:bg-white/10">
                              Zenith
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setTheme("system")} className="hover:bg-white/10">
                              System
                            </DropdownMenuItem>
                          </DropdownMenuSubContent>
                        </DropdownMenuPortal>
                      </DropdownMenuSub>
                      {!isGuest && (
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive hover:bg-destructive/10">
                          <LogOut className="mr-2 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      )}
                      {isGuest && (
                         <DropdownMenuItem onClick={() => router.push('/login')} className="hover:bg-white/10">
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log in</span>
                          </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="p-6 pt-6 relative">
                {children}
            </main>
          </SidebarInset>
        </div>
        <Player />
        {isMobile && (
          <nav className="fixed bottom-0 left-0 right-0 bg-black/40 border-t border-white/5 z-50 md:hidden backdrop-blur-3xl">
            <div className="flex justify-around items-center h-16 px-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} className="flex-1 group">
                    <div className="flex flex-col items-center justify-center gap-1 h-full">
                      <div className={cn(
                        "relative flex items-center justify-center w-12 h-7 rounded-full transition-all duration-300",
                        isActive 
                          ? "bg-white/20"
                          : "group-hover:bg-white/10"
                      )}>
                         <div className={cn(
                           "absolute inset-0 rounded-full bg-primary opacity-0 blur-md transition-opacity duration-300",
                           isActive && "opacity-40"
                         )}></div>
                         <item.icon className={cn(
                           "h-5 w-5 z-10 transition-colors duration-300",
                           isActive ? "text-white" : "text-neutral-400 group-hover:text-white"
                         )} />
                      </div>
                      <span className={cn(
                        "text-[10px] font-medium transition-colors duration-300",
                        isActive ? "text-white" : "text-neutral-400 group-hover:text-white"
                      )}>
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </nav>
        )}
      </div>
    </SidebarProvider>
  );
}