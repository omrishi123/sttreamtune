
import { getAppConfig } from '@/lib/admin-actions';
import { AppConfigForm } from './_components/app-config-form';

export default async function AdminSettingsPage() {
  const appConfig = await getAppConfig();

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-2">
      <h1 className="text-3xl font-semibold">Settings</h1>
      <div className="grid gap-6">
        <AppConfigForm initialConfig={appConfig} />
      </div>
    </div>
  );
}
