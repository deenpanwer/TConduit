'use client';

import { useRouter, useSearchParams } from 'next/navigation';

// This is a mock function. In a real scenario, you would fetch this data.
// For the purpose of this example, we will pass the data as a prop.
const mockData = {
  entries: Array.from({ length: 53 }, (_, i) => ({
    Email: `user${i + 1}@example.com`,
    Problem: `This is problem number ${i + 1}. It's a significant issue that needs to be resolved as soon as possible to ensure the project's success.`,
  })),
  totalPages: 6,
};


const maskEmail = (email: string) => {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [name, domain] = email.split('@');
  if (name.length <= 2) {
    return `${name}***@${domain}`;
  }
  const first = name[0];
  const last = name[name.length - 1];
  const masked = '*'.repeat(Math.max(0, name.length - 2));
  return `${first}${masked}${last}@${domain}`;
};

export default function ProblemsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const page = parseInt(searchParams.get('page') || '1', 10);
  const { entries, totalPages } = mockData;
  const ITEMS_PER_PAGE = 10;

  const handlePrevious = () => {
    if (page > 1) {
      router.push(`/problems?page=${page - 1}`);
    }
  };

  const handleNext = () => {
    if (page < totalPages) {
      router.push(`/problems?page=${page + 1}`);
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
            {currentEntries.length > 0 ? (
              currentEntries.map((entry, index) => (
                <div
                  key={index}
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
                <p>No problems found. You can add the data file at <code className="bg-gray-100 p-1 text-xs">src/lib/data/problems.json</code>.</p>
              </div>
            )}
          </div>
          
          {totalPages > 1 && (
             <div className="flex justify-between items-center mt-6">
                <button
                    onClick={handlePrevious}
                    disabled={page <= 1}
                    className="border border-black bg-white px-4 py-2 text-black transition-colors hover:bg-black hover:text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Previous
                </button>
                <span className="text-sm">
                    Page {page} of {totalPages}
                </span>
                <button
                    onClick={handleNext}
                    disabled={page >= totalPages}
                    className="border border-black bg-white px-4 py-2 text-black transition-colors hover:bg-black hover:text-white disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
