import { AuthPage } from '@/components/auth-page';

export const metadata = { title: 'Cadastro' };

export default function Page({searchParams}: {searchParams:Promise<Record<string,string | string[] | undefined>>}) {
  return <AuthPage kind="register" query={searchParams}/>;
}
