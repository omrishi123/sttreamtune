import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { userPlaylists } from "@/lib/mock-data";
import { PlaylistCard } from "@/components/playlist-card";

export default function LibraryPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold font-headline tracking-tight">Your Library</h1>
      
      <Tabs defaultValue="playlists">
        <TabsList>
          <TabsTrigger value="playlists">Playlists</TabsTrigger>
          <TabsTrigger value="artists" disabled>Artists</TabsTrigger>
          <TabsTrigger value="albums" disabled>Albums</TabsTrigger>
        </TabsList>
        <TabsContent value="playlists" className="mt-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {userPlaylists.map((playlist) => (
              <PlaylistCard key={playlist.id} playlist={playlist} />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
