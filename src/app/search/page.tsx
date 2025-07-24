import Image from "next/image";
import { Input } from "@/components/ui/input";
import { tracks } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Play } from "lucide-react";

export default function SearchPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold font-headline tracking-tight">Search</h1>
        <div className="mt-4">
          <Input
            type="search"
            placeholder="Search for songs, artists, playlists..."
            className="max-w-md text-base"
          />
        </div>
      </div>
      
      {/* Mock search results */}
      <section>
        <h2 className="text-xl font-semibold font-headline mb-4">Results</h2>
        <div className="space-y-2">
          {tracks.slice(0, 5).map((track) => (
            <div
              key={track.id}
              className="flex items-center gap-4 p-2 rounded-md hover:bg-muted/50 transition-colors group"
            >
              <Image
                src={track.artwork}
                alt={track.title}
                width={48}
                height={48}
                className="rounded-md"
                data-ai-hint={track['data-ai-hint']}
              />
              <div className="flex-1">
                <p className="font-semibold">{track.title}</p>
                <p className="text-sm text-muted-foreground">{track.artist}</p>
              </div>
              <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                <Play className="h-5 w-5" />
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
