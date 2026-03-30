import React from 'react';

const PrivacyPolicyPage = () => {
  return (
    <div className="bg-gray-100 min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-4">Privacy Policy for Traconomics</h1>
        <p className="text-gray-600 mb-8">Last Updated: March 29, 2026</p>

        <div className="prose max-w-none">
          <p>
            This Privacy Policy describes how Traconomics ("we," "us," or "our") collects, uses, and
            shares information when you use our website and services, particularly in connection with the
            integration of your Gmail account.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Information We Collect</h2>

          <h3 className="text-xl font-bold mt-4 mb-2">Gmail Integration</h3>
          <p>
            If you choose to connect your Gmail account to Traconomics, we will have access to the
            following information from your Gmail account:
          </p>
          <ul className="list-disc list-inside">
            <li>
              <strong>Emails:</strong> we access email content including subject, body, sender, and recipients only when needed to display conversations within the crm
            </li>
            <li>
              <strong>Metadata:</strong> we access metadata such as timestamps, labels, and headers to show contact activity timelines
            </li>
            <li>
              <strong>Labels:</strong> we access and manage gmail labels to sync crm pipeline stages with your inbox
            </li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">How We Use Your Information</h2>
          <p>
            We use the information we collect from your Gmail account to provide and improve our services,
            including:
          </p>
          <ul className="list-disc list-inside">
            <li>To enable features that interact with your email content.</li>
            <li>To analyze your email data to provide you with insights and analytics.</li>
            <li>To personalize your experience with our services.</li>
          </ul>

          <h2 className="text-2xl font-bold mt-8 mb-4">Data Storage and Retention</h2>
          <p>
            We store your Gmail data, including emails and metadata, for as long as your account is
            active with us. If you disconnect your Gmail account or delete your Traconomics account, we
            will delete your Gmail data from our servers within 30 days. we do not store raw email body content on our servers. we only store metadata and label information needed to power crm features.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">We Do Not Sell Your Data</h2>
          <p>
            We do not and will not sell your personal information, including your Gmail data, to any
            third party.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Google Limited Use Policy</h2>
          <p>
            Our use and transfer to any other app of information received from Google APIs will adhere
            to the{' '}
            <a
              href="https://developers.google.com/terms/api-services-user-data-policy"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              Google API Services User Data Policy
            </a>
            , including the Limited Use requirements.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Your Choices</h2>
          <p>
            You can disconnect your Gmail account from Traconomics at any time. We provide a visible
            "Disconnect Gmail" button within our application for you to easily revoke our access to your
            Gmail data.
          </p>

          <h2 className="text-2xl font-bold mt-8 mb-4">Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy, you can contact us at{' '}
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

export default PrivacyPolicyPage;
