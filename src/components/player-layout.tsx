"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Search,
  Library,
  PlusCircle,
  User,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { userPlaylists } from "@/lib/mock-data";
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

export function PlayerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const navItems = [
    { href: "/", label: "Home", icon: Home },
    { href: "/search", label: "Search", icon: Search },
    { href: "/library", label: "Your Library", icon: Library },
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-screen flex-col">
        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            side="left"
            variant="sidebar"
            collapsible="icon"
            className="border-r border-sidebar-border bg-sidebar"
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
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel className="flex items-center justify-between">
                  <span>Playlists</span>
                  <button className="p-1 hover:text-sidebar-foreground transition-colors">
                    <PlusCircle className="h-4 w-4" />
                  </button>
                </SidebarGroupLabel>
                <SidebarMenu>
                  {userPlaylists.map((playlist) => (
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
            </SidebarContent>
            <SidebarFooter>
              <SidebarMenu>
                 <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Profile">
                    <Link href="#">
                      <Avatar className="h-7 w-7">
                        <AvatarImage src="https://placehold.co/100x100.png" alt="User" data-ai-hint="user avatar" />
                        <AvatarFallback>JD</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">Jane Doe</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="overflow-y-auto bg-background">
            <main className="p-6">{children}</main>
          </SidebarInset>
        </div>
        <Player />
      </div>
    </SidebarProvider>
  );
}
