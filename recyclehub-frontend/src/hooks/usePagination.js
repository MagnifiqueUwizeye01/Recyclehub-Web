import { useState } from 'react';

export const usePagination = (initialPage = 1, initialPageSize = 12) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize] = useState(initialPageSize);
  const [totalPages, setTotalPages] = useState(1);

  const goToPage = (p) => setPage(Math.max(1, Math.min(p, totalPages)));
  const nextPage = () => goToPage(page + 1);
  const prevPage = () => goToPage(page - 1);
  const reset = () => setPage(1);

  return { page, pageSize, totalPages, setTotalPages, goToPage, nextPage, prevPage, reset };
};

export default usePagination;
