import { AuthPage } from '@/components/auth-page';

export const metadata = { title: 'Recuperar senha' };

export default function Page({searchParams}: {searchParams:Promise<Record<string,string | string[] | undefined>>}) {
  return <AuthPage kind="forgot" query={searchParams}/>;
}
