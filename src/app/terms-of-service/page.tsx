import React from 'react';

const TermsOfServicePage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Terms of Service for Traconomics</h1>
        <p className="text-gray-600 mb-8">Last Updated: March 29, 2026</p>

        <div className="prose max-w-none">
          <p>
            Please read these Terms of Service ("Terms", "Terms of Service") carefully before using the
            traconomics.com website (the "Service") operated by Traconomics ("us", "we", or "our").
          </p>

          <p>
            Your access to and use of the Service is conditioned on your acceptance of and compliance with
            these Terms. These Terms apply to all visitors, users and others who access or use the
            Service.
          </p>

          <p>
            By accessing or using the Service you agree to be bound by these Terms. If you disagree with
            any part of the terms then you may not access the Service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Accounts</h2>

          <p>
            When you create an account with us, you must provide us information that is accurate,
            complete, and current at all times. Failure to do so constitutes a breach of the Terms,
            which may result in immediate termination of your account on our Service.
          </p>

          <p>
            You are responsible for safeguarding the password that you use to access the Service and for
            any activities or actions under your password, whether your password is with our Service or a
            third-party service.
          </p>

          <p>
            You agree not to disclose your password to any third party. You must notify us immediately
            upon becoming aware of any breach of security or unauthorized use of your account.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Gmail Integration</h2>

          <p>
            If you choose to connect your Gmail account, you grant us permission to access your gmail emails, metadata, and labels. We will use this information in accordance with our Privacy Policy.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Disconnect Gmail</h2>
          <p>
            You can revoke our access to your Gmail account at any time by clicking the "Disconnect
            Gmail" button in your account settings. This will remove our access to your Gmail data.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Termination</h2>

          <p>
            We may terminate or suspend your account immediately, without prior notice or liability, for
            any reason whatsoever, including without limitation if you breach the Terms.
          </p>

          <p>
            Upon termination, your right to use the Service will immediately cease. If you wish to
            terminate your account, you may simply discontinue using the Service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Governing Law</h2>

          <p>
            These Terms shall be governed and construed in accordance with the laws of the United
            States, without regard to its conflict of law provisions.
          </p>

          <p>
            Our failure to enforce any right or provision of these Terms will not be considered a waiver
            of those rights. If any provision of these Terms is held to be invalid or unenforceable by a
            court, the remaining provisions of these Terms will remain in effect. These Terms constitute
            the entire agreement between us regarding our Service, and supersede and replace any prior
            agreements we might have between us regarding the Service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Changes</h2>

          <p>
            We reserve the right, at our sole discretion, to modify or replace these Terms at any time.
            If a revision is material we will try to provide at least 30 days notice prior to any new
            terms taking effect. What constitutes a material change will be determined at our sole
            discretion.
          </p>

          <p>
            By continuing to access or use our Service after those revisions become effective, you agree
            to be bound by the revised terms. If you do not agree to the new terms, please stop using the
            Service.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>

          <p>
            If you have any questions about these Terms, please contact us at{' '}
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

export default TermsOfServicePage;
