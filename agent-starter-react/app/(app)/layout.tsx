import { headers } from 'next/headers';
import { getAppConfig } from '@/lib/utils';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default async function AppLayout({ children }: AppLayoutProps) {
  const hdrs = await headers();
  await getAppConfig(hdrs);

  return (
    <>
      {/* header removed per request */}
      {children}
    </>
  );
}
