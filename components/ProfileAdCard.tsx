'use client';

import { useRouter } from 'next/navigation';
import AdCard from './AdCard';
import DeleteAdButton from './DeleteAdButton';
import type { AdWithRelations } from '@/types';

interface ProfileAdCardProps {
  ad: AdWithRelations;
  isOwner: boolean;
}

export default function ProfileAdCard({ ad, isOwner }: ProfileAdCardProps) {
  const router = useRouter();

  const handleDeleted = () => {
    router.refresh();
  };

  return (
    <div className="relative group">
      <AdCard ad={ad} />
      {isOwner && (
        <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <DeleteAdButton
            adId={ad.id}
            adTitle={ad.title}
            variant="icon"
            onDeleted={handleDeleted}
          />
        </div>
      )}
    </div>
  );
}

