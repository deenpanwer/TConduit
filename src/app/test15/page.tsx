'use client';

import React, { useState } from 'react';
import { IndividualPulse } from './components/IndividualPulse';
import { DUMMY_EMPLOYEES } from '@/lib/dashboard-demo-data';
import { useRouter } from 'next/navigation';

export default function Test15Page() {
  const router = useRouter();
  // Using the first dummy employee (Deen Panwer) as the focus for this test page
  const [activeEmployee] = useState(DUMMY_EMPLOYEES[0]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#09090b] p-4 md:p-12">
      <IndividualPulse 
        employee={activeEmployee} 
        onBack={() => router.push('/dashboard')}
      />
    </div>
  );
}
