import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-config';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import BroadcastManager from './BroadcastManager';

export default async function BroadcastPage() {
  let user;
  try {
    user = await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  return (
    <div className="container-custom py-8">
      <h1 className="text-3xl font-bold mb-8 text-dark-text">Рассылка в Telegram</h1>
      <BroadcastManager />
    </div>
  );
}


















