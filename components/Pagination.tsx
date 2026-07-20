import React from 'react';

interface PaginationProps {
  totalRecords: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

const ITEMS_PER_PAGE = 20;

const Pagination: React.FC<PaginationProps> = ({ 
  totalRecords, 
  currentPage, 
  onPageChange 
}) => {
  const totalPages = Math.ceil(totalRecords / ITEMS_PER_PAGE);

  if (totalRecords <= 0) return null;

  const handlePrevPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  const pages: (number | string)[] = [];
  const addedPages = new Set<number | string>();
  const maxVisible = 5;

  const addPage = (page: number | string) => {
    if (!addedPages.has(page)) {
      addedPages.add(page);
      pages.push(page);
    }
  };

  if (totalPages <= maxVisible) {
    for (let i = 1; i <= totalPages; i++) {
      addPage(i);
    }
  } else {
    addPage(1);
    
    if (currentPage > 3) {
      addPage('...');
    }
    
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      addPage(i);
    }
    
    if (currentPage < totalPages - 2) {
      addPage('...');
    }
    
    if (totalPages > 1) {
      addPage(totalPages);
    }
  }

  return (
    <div className="flex justify-center items-center gap-2 mt-6">
      <button
        onClick={handlePrevPage}
        disabled={currentPage === 1}
        className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <i className="fas fa-chevron-left mr-1"></i> 上一页
      </button>
      
      <div className="flex gap-1">
        {pages.map((page, index) => {
          if (page === '...') {
            return (
              <span key={`ellipsis-${index}`} className="w-9 h-9 flex items-center justify-center text-slate-400 font-bold">
                ...
              </span>
            );
          }
          return (
            <button
              key={`page-${page}`}
              onClick={() => handlePageClick(page as number)}
              className={`w-9 h-9 rounded-lg text-sm font-bold transition-colors ${
                currentPage === page
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {page}
            </button>
          );
        })}
      </div>
      
      <button
        onClick={handleNextPage}
        disabled={currentPage === totalPages}
        className="px-3 py-2 rounded-lg text-sm font-medium border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        下一页 <i className="fas fa-chevron-right ml-1"></i>
      </button>
      
      <span className="text-sm text-slate-500 ml-4">
        共 {totalRecords} 条记录，第 {currentPage}/{totalPages} 页
      </span>
    </div>
  );
};

export default Pagination;