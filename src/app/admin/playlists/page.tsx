
import { getAllPublicPlaylists } from '@/lib/admin-actions';
import { PlaylistsTable } from './_components/playlists-table';

export default async function AdminPlaylistsPage() {
  const playlists = await getAllPublicPlaylists();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Community Playlists</h2>
      <PlaylistsTable initialPlaylists={playlists} />
    </div>
  );
}
