'use server';

import { Suspense } from 'react';
import ProblemsClientPage from './ProblemsClientPage';

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1', 10);
  
  return (
    <Suspense fallback={<div>Loading problems...</div>}>
      <ProblemsClientPage initialPage={page} />
    </Suspense>
  );
}
