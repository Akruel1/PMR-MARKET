'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
}

export default function Pagination({ currentPage, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', page.toString());
    router.push(`/?${params.toString()}`);
  };

  // Don't show pagination if there's only one page or no pages
  if (totalPages <= 1) return null;

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPages = 7;
    
    if (totalPages <= maxPages) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      if (currentPage > 3) {
        pages.push('...');
      }
      
      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pageNumbers = generatePageNumbers();

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      {/* Previous button */}
      <button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className={`
          px-3 py-2 rounded-lg border transition-all duration-200
          ${currentPage === 1
            ? 'border-neutral-700 text-neutral-500 cursor-not-allowed bg-dark-bg2'
            : 'border-neutral-600 text-dark-textSecondary hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/10'
          }
        `}
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      {/* Page numbers */}
      {pageNumbers.map((page, index) => {
        if (page === '...') {
          return (
            <span key={`dots-${index}`} className="px-3 py-2 text-neutral-500">
              ...
            </span>
          );
        }

        return (
          <button
            key={page}
            onClick={() => handlePageChange(page as number)}
            className={`
              min-w-[40px] px-3 py-2 rounded-lg border transition-all duration-200 font-medium
              ${currentPage === page
                ? 'border-primary-500 bg-primary-500 text-white'
                : 'border-neutral-600 text-dark-textSecondary hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/10'
              }
            `}
          >
            {page}
          </button>
        );
      })}

      {/* Next button */}
      <button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className={`
          px-3 py-2 rounded-lg border transition-all duration-200
          ${currentPage === totalPages
            ? 'border-neutral-700 text-neutral-500 cursor-not-allowed bg-dark-bg2'
            : 'border-neutral-600 text-dark-textSecondary hover:border-primary-500 hover:text-primary-500 hover:bg-primary-500/10'
          }
        `}
      >
        <ChevronRight className="h-5 w-5" />
      </button>
    </div>
  );
}

















