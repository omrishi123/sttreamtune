
import { getAllUsers } from '@/lib/admin-actions';
import { UsersTable } from './_components/users-table';

export default async function AdminUsersPage() {
  const users = await getAllUsers();

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">User Management</h2>
      <UsersTable initialUsers={users} />
    </div>
  );
}
