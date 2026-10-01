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
  Flame,
  ShieldCheck,
  Moon,
  Sun,
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
import type { User as AppUser } from "@/lib/types";
import { useIsMobile } from "@/hooks/use-mobile";
import { useUserData } from "@/context/user-data-context";
import { AddPlaylistDialog } from "./add-playlist-dialog";
import { AppInitializer } from "./app-initializer";
import { LikeAnimation } from "./LikeAnimation";

interface PlayerLayoutProps {
  children: React.ReactNode;
  user: AppUser | null;
}

const ThemeSubMenu = ({ 
  theme, 
  setTheme, 
  isMobileVersion = false 
}: { 
  theme: string | undefined, 
  setTheme: (t: string) => void, 
  isMobileVersion?: boolean 
}) => (
  <DropdownMenuSub>
    <DropdownMenuSubTrigger className={cn("rounded-lg px-3", isMobileVersion ? "h-11" : "h-10")}>
      <div className="flex items-center">
        <Sun className="mr-3 h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 opacity-60" />
        <Moon className="absolute mr-3 h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 opacity-60" />
        <span className="font-medium capitalize">{theme} theme</span>
      </div>
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent className="glass-panel min-w-[140px] p-1 z-[100]">
        <DropdownMenuItem onClick={() => setTheme("light")} className="rounded-md">Light</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")} className="rounded-md">Dark</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("sunset")} className="rounded-md">Sunset Groove</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("zenith")} className="rounded-md">Zenith</DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")} className="rounded-md">System</DropdownMenuItem>
      </DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
);

export function PlayerLayout({ children, user }: PlayerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isMobile = useIsMobile();
  const { playlists: userPlaylists, likeAnimationTrigger } = useUserData();
  const { setTheme, theme } = useTheme();

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
        if (prev.some(item => item.href === '/admin')) return prev;
        return [...prev, { href: "/admin", label: "Admin", icon: ShieldCheck }];
      });
    }
  }, [user]);

  if (isMobile === undefined) return null;
  if (!user) return null;
  
  const isGuest = user.id === 'guest';
  const userAvatar = user.photoURL || "https://placehold.co/100x100.png";

  return (
    <SidebarProvider defaultOpen>
      <AppInitializer />
      <LikeAnimation trigger={likeAnimationTrigger} />
      <div className="relative flex h-screen flex-col bg-transparent overflow-hidden">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            side="left"
            variant="sidebar"
            collapsible="icon"
            className="hidden md:flex border-r border-white/5 bg-background/5 backdrop-blur-3xl"
          >
            <SidebarHeader className="pt-6 px-4">
              <Link
                href="/"
                className="flex items-center gap-3 text-xl font-bold text-foreground"
              >
                <div className="bg-primary p-1.5 rounded-xl shadow-lg">
                    <Icons.logo className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="font-headline group-data-[collapsible=icon]:hidden tracking-tighter">
                  StreamTune
                </span>
              </Link>
            </SidebarHeader>
            <SidebarContent className="px-2">
              <SidebarMenu>
                {navItems.map((item) => (
                  <SidebarMenuItem key={item.label}>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === item.href}
                      tooltip={item.label}
                      className={cn(
                        "transition-all duration-300 rounded-xl h-11",
                        pathname === item.href ? "bg-primary/10 text-primary shadow-sm" : "hover:bg-foreground/5"
                      )}
                    >
                      <Link href={item.href}>
                        <item.icon className="h-5 w-5" />
                        <span className="font-medium">{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
              {!isGuest && userPlaylists && userPlaylists.length > 0 && (
                <>
                  <SidebarSeparator className="my-4 opacity-10" />
                  <SidebarGroup>
                    <SidebarGroupLabel className="flex items-center justify-between px-3 text-muted-foreground/60 text-[10px] uppercase font-bold tracking-widest">
                      <span>Library</span>
                      <AddPlaylistDialog>
                        <button className="p-1 hover:text-foreground transition-colors">
                          <PlusCircle className="h-4 w-4" />
                        </button>
                      </AddPlaylistDialog>
                    </SidebarGroupLabel>
                    <SidebarMenu className="mt-2">
                      {userPlaylists.map((playlist) => (
                        <SidebarMenuItem key={playlist.id}>
                          <SidebarMenuButton
                            asChild
                            isActive={pathname === `/playlists/${playlist.id}`}
                            tooltip={playlist.name}
                            className={cn(
                                "transition-all duration-300 rounded-xl",
                                pathname === `/playlists/${playlist.id}` ? "bg-foreground/10" : "hover:bg-foreground/5"
                            )}
                          >
                            <Link href={`/playlists/${playlist.id}`}>
                              <Icons.playlist className="h-4 w-4 opacity-60" />
                              <span className="truncate">{playlist.name}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenu>
                  </SidebarGroup>
                </>
              )}
            </SidebarContent>
            <SidebarFooter className="p-4">
               <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <button className="flex items-center gap-3 w-full p-2 rounded-2xl hover:bg-foreground/5 transition-all group text-left">
                      <div className="relative">
                        <Avatar className="h-9 w-9 border-2 border-transparent group-hover:border-primary/50 transition-all shadow-md">
                          <AvatarImage src={userAvatar} alt={user.name} />
                          <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                        </Avatar>
                        {user.isVerified && (
                           <Icons.verified className="absolute -bottom-1 -right-1 h-4 w-4 shadow-sm" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                        <p className="text-sm font-bold truncate leading-none">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">{isGuest ? 'Guest User' : 'Premium'}</p>
                      </div>
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-64 mb-4 glass-panel p-2" side="right" align="end" sideOffset={12}>
                  <DropdownMenuLabel className="px-3 py-2">
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-bold truncate">{user.name}</p>
                      {user.isVerified && <Icons.verified className="h-4 w-4 flex-shrink-0" />}
                    </div>
                    <p className="text-xs text-muted-foreground font-medium truncate">{user.email}</p>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="my-2 opacity-10" />
                  <DropdownMenuItem onClick={() => router.push('/profile')} disabled={isGuest} className="rounded-lg h-10 px-3">
                    <UserIcon className="mr-3 h-4 w-4 opacity-60" />
                    <span className="font-medium">Account Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg h-10 px-3">
                    <Settings className="mr-3 h-4 w-4 opacity-60" />
                    <span className="font-medium">Preferences</span>
                  </DropdownMenuItem>
                  <ThemeSubMenu theme={theme} setTheme={setTheme} />
                  <DropdownMenuSeparator className="my-2 opacity-10" />
                   {!isGuest ? (
                    <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive focus:bg-destructive/10 rounded-lg h-10 px-3">
                      <LogOut className="mr-3 h-4 w-4" />
                      <span className="font-bold">Sign Out</span>
                    </DropdownMenuItem>
                  ) : (
                     <DropdownMenuItem onClick={() => router.push('/login')} className="text-primary focus:text-primary focus:bg-primary/10 rounded-lg h-10 px-3">
                        <LogOut className="mr-3 h-4 w-4" />
                        <span className="font-bold">Sign In</span>
                      </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="bg-transparent pb-32 md:pb-24 overflow-y-auto overflow-x-hidden w-full">
            <header className="p-4 md:hidden flex items-center justify-between sticky top-0 z-50 glass-morphic">
                 <Link href="/" className="flex items-center gap-2">
                    <Icons.logo className="h-6 w-6 text-primary" />
                    <span className="font-headline font-bold text-lg">StreamTune</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="relative">
                        <Avatar className="h-9 w-9 border-2 border-foreground/10">
                          <AvatarImage src={userAvatar} alt={user.name} />
                          <AvatarFallback>{user.name?.charAt(0) || 'G'}</AvatarFallback>
                        </Avatar>
                         {user.isVerified && (
                             <Icons.verified className="absolute -bottom-1 -right-1 h-4 w-4 shadow-sm" />
                          )}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64 mr-4 glass-panel p-2" side="bottom" align="end" sideOffset={8}>
                       <DropdownMenuLabel className="px-3 py-2">
                        <div className="flex items-center gap-1">
                          <p className="text-sm font-bold truncate">{user.name}</p>
                          {user.isVerified && <Icons.verified className="h-4 w-4 flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground font-medium truncate">{user.email}</p>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className="my-2 opacity-10" />
                      <DropdownMenuItem onClick={() => router.push('/profile')} disabled={isGuest} className="rounded-lg h-11">
                        <UserIcon className="mr-3 h-4 w-4 opacity-60" />
                        <span>Profile</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => router.push('/settings')} className="rounded-lg h-11">
                        <Settings className="mr-3 h-4 w-4" />
                        <span>Settings</span>
                      </DropdownMenuItem>
                      <ThemeSubMenu theme={theme} setTheme={setTheme} isMobileVersion />
                      <DropdownMenuSeparator className="my-2 opacity-10" />
                      {!isGuest ? (
                        <DropdownMenuItem onClick={handleLogout} className="text-destructive rounded-lg h-11">
                          <LogOut className="mr-3 h-4 w-4" />
                          <span>Log out</span>
                        </DropdownMenuItem>
                      ) : (
                         <DropdownMenuItem onClick={() => router.push('/login')} className="text-primary rounded-lg h-11">
                            <LogOut className="mr-3 h-4 w-4" />
                            <span>Log in</span>
                          </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </header>
            <main className="relative z-10 px-4 md:px-10 py-6 md:py-8 max-w-[1800px] mx-auto w-full">
                {children}
            </main>
          </SidebarInset>
        </div>
        
        <Player />
        
        {isMobile && (
          <nav className="fixed bottom-3 left-4 right-4 glass-panel h-14 z-50 md:hidden flex justify-around items-center px-4 rounded-2xl shadow-2xl overflow-hidden">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href} className="relative flex flex-col items-center gap-0.5 group">
                   {isActive && (
                      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-full blur-[1px]" />
                   )}
                   <item.icon className={cn(
                     "h-5 w-5 transition-all",
                     isActive ? "text-primary scale-110" : "text-muted-foreground/60 group-hover:text-foreground"
                   )} />
                   <span className={cn(
                     "text-[9px] font-bold uppercase tracking-tight",
                     isActive ? "text-primary" : "text-muted-foreground/40"
                   )}>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        )}
      </div>
    </SidebarProvider>
  );
}