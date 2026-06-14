import React from 'react';
import { Navbar } from '@/components/home/Navbar';
import { Footer } from '@/components/home/Footer';

const OwnershipStatementPage = () => {
  return (
    <div className="bg-background min-h-screen">
      <Navbar />
      <div className="container mx-auto px-4 py-20">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Ownership Statement</h1>
        <p className="text-muted-foreground mb-8">Last Updated: April 26, 2026</p>

        <div className="prose dark:prose-invert max-w-none">
          <p>
            This website and the brand 'Trac AI' are owned and operated by Trac AI Private Limited. The information on this website is the property of Trac AI Private Limited and is protected by copyright and other intellectual property laws. You may not copy, reproduce, or distribute any of the information on this website without our prior written consent.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Ownership Statement, please contact us at{' '}
            <a href="mailto:support@heytracai.com" className="text-blue-500 hover:underline">
              support@heytracai.com
            </a>
            .
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default OwnershipStatementPage;
