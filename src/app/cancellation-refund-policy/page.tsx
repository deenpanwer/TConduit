import React from 'react';

const CancellationRefundPolicyPage = () => {
  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">Cancellation, Return, and Refund Policy</h1>
        <p className="text-muted-foreground mb-8">Last Updated: April 26, 2026</p>

        <div className="prose dark:prose-invert max-w-none">
          <h2 className="text-2xl font-bold mt-8 mb-4">Cancellation</h2>
          <p>
            You may cancel your subscription at any time. To cancel your subscription, please contact us at support@traconomics.com. Your subscription will remain active until the end of the current billing cycle.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Returns</h2>
          <p>
            We do not offer returns for any of our products.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Refunds</h2>
          <p>
            We offer a 30-day money-back guarantee for all of our products. If you are not satisfied with your purchase, you may request a full refund within 30 days of the purchase date. To request a refund, please contact us at support@traconomics.com. We do not offer refunds for any purchases made after the 30-day period.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about our Cancellation, Return, and Refund Policy, please contact us at{' '}
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

export default CancellationRefundPolicyPage;
