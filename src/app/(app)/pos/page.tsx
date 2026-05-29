"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PosHomePage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/pos/checkout');
  }, [router]);

  // Return null or a loading spinner while redirecting
  return null;
}
