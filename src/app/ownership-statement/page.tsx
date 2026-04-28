import React from 'react';

const OwnershipStatementPage = () => {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Ownership Statement</h1>
        <p className="text-muted-foreground mb-8">Last Updated: April 26, 2026</p>

        <div className="prose dark:prose-invert max-w-none">
          <p>
            This website and the brand 'Traconomics' are owned and operated by Trac AI Private Limited. The information on this website is the property of Trac AI Private Limited and is protected by copyright and other intellectual property laws. You may not copy, reproduce, or distribute any of the information on this website without our prior written consent.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Ownership Statement, please contact us at{' '}
            <a href="mailto:support@traconomics.com" className="text-blue-500 hover:underline">
              support@traconomics.com
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
};

export default OwnershipStatementPage;
