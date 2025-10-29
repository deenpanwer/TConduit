'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Papa from 'papaparse';
import { cn } from '@/lib/utils';

type ProblemEntry = {
  Email: string;
  Problem: string;
};

const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name[0]}***@${domain}`;
  }
  const first = name[0];
  const last = name[name.length - 1];
  const masked = '*'.repeat(Math.max(0, name.length - 2));
  return `${first}${masked}${last}@${domain}`;
};

const ITEMS_PER_PAGE = 10;

const shuffleArray = (array: any[]) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
};

const Pagination = ({ currentPage, totalPages, onPageChange }: { currentPage: number, totalPages: number, onPageChange: (page: number) => void }) => {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 10) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 4) {
        pages.push(1, 2, 3, 4, 5, '...', totalPages);
      } else if (currentPage >= totalPages - 3) {
        pages.push(1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className="flex items-center justify-center space-x-2 md:space-x-4">
      {currentPage > 1 && (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2 py-1 text-sm text-black hover:underline"
        >
          Previous
        </button>
      )}

      {pageNumbers.map((page, index) =>
        typeof page === 'number' ? (
          <button
            key={index}
            onClick={() => onPageChange(page)}
            className={cn(
              "px-3 py-1 text-sm border border-transparent",
              currentPage === page
                ? "border-black text-black font-bold"
                : "text-black hover:underline"
            )}
          >
            {page}
          </button>
        ) : (
          <span key={index} className="px-3 py-1 text-sm text-black">
            {page}
          </span>
        )
      )}

      {currentPage < totalPages && (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2 py-1 text-sm text-black hover:underline"
        >
          Next
        </button>
      )}
    </div>
  );
};


export default function ProblemsClientPage({ initialPage }: { initialPage: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [entries, setEntries] = useState<ProblemEntry[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const page = parseInt(searchParams.get('page') || String(initialPage), 10);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/problems');
        if (!response.ok) {
          if (response.status === 404) {
            setError('The problems.csv file was not found.');
          } else {
            throw new Error('Failed to fetch problems');
          }
          setEntries([]);
          setTotalPages(0);
          setLoading(false);
          return;
        }
        const csvText = await response.text();
        Papa.parse<ProblemEntry>(csvText, {
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            if (results.errors.length) {
              console.error('CSV parsing errors:', results.errors);
              setError('Failed to parse the CSV file.');
              setEntries([]);
              setLoading(false);
              return;
            }
            const validEntries = results.data.filter(entry => entry.Email && entry.Problem);
            const shuffledEntries = shuffleArray(validEntries);
            setEntries(shuffledEntries);
            setTotalPages(Math.ceil(shuffledEntries.length / ITEMS_PER_PAGE));
            setLoading(false);
          },
          error: (error) => {
            console.error('CSV parsing error:', error);
            setError('An error occurred while parsing the CSV file.');
            setEntries([]);
            setLoading(false);
          }
        });
      } catch (error) {
        console.error(error);
        setError('An error occurred while fetching the problems data.');
        setEntries([]);
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
      router.push(`/problems?page=${newPage}`);
    }
  };

  const startIndex = (page - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentEntries = entries.slice(startIndex, endIndex);

  return (
    <div className="bg-white min-h-screen font-serif text-black p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold">Problems</h1>
          <p className="text-sm md:text-base mt-2">A log of submissions from around the world.</p>
        </header>

        <main>
          <div className="border border-black">
            <div className="hidden md:grid md:grid-cols-3 border-b border-black font-bold">
              <div className="p-3">Email</div>
              <div className="p-3 col-span-2">Problem</div>
            </div>
            {loading ? (
              <div className="p-4 text-center">
                <p>Loading problems...</p>
              </div>
            ) : error ? (
              <div className="p-4 text-center text-red-600">
                <p>{error}</p>
                {error.includes('not found') && <p>Please add it at <code className="bg-gray-100 p-1 text-xs">src/lib/data/problems.csv</code></p>}
              </div>
            ) : currentEntries.length > 0 ? (
              currentEntries.map((entry, index) => (
                <div
                  key={`${entry.Email}-${index}`}
                  className="grid grid-cols-1 md:grid-cols-3 border-b border-black last:border-b-0"
                >
                  <div className="p-3 font-mono text-sm break-words border-b border-black md:border-b-0 md:border-r">
                    <span className="md:hidden font-bold font-serif">Email: </span>
                    {maskEmail(entry.Email)}
                  </div>
                  <div className="p-3 col-span-2 text-sm">
                    <span className="md:hidden font-bold font-serif">Problem: </span>
                    {entry.Problem}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center">
                <p>No problems found in the CSV file.</p>
              </div>
            )}
          </div>
          
          {!loading && !error && totalPages > 1 && (
             <div className="flex justify-center items-center mt-8">
                <Pagination 
                  currentPage={page}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
