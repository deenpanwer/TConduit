'use server';

import ProblemsClientPage from './ProblemsClientPage';

export default async function ProblemsPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const page = parseInt(typeof searchParams.page === 'string' ? searchParams.page : '1', 10);
  
  return <ProblemsClientPage initialPage={page} />;
}
