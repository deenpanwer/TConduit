
import React from 'react';
import Link from 'next/link';

const TermsPage = () => {
  return (
    <div className="bg-gray-50 min-h-screen">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link href="/" className="text-2xl font-black text-[#1a1919] tracking-tighter flex items-center gap-2">
              TRAC <span className="text-[#7B61FF]">AI</span>
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/login" className="text-sm font-bold text-gray-600 hover:text-black transition-colors">
                Log in
              </Link>
              <Link 
                href="/signup" 
                className="px-6 py-3 bg-[#1a1919] text-white rounded-xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-black/5"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      <main className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-6">Terms of Service</h1>
          <p className="text-gray-500 text-lg mb-8">Last updated: October 26, 2023</p>

          <div className="prose prose-lg max-w-none text-gray-700">
            <p>Welcome to Trac Diary. These Terms of Service ("Terms") govern your use of the Trac Diary software and any related services provided by TRAC AI (PRIVATE) LIMITED.</p>
            
            <h2 className="text-2xl font-bold mt-10 mb-4">1. Acceptance of Terms</h2>
            <p>By accessing or using our services, you agree to be bound by these Terms and our Privacy Policy. If you do not agree to these Terms, please do not use our services.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">2. Description of Service</h2>
            <p>Trac Diary is an AI-powered business workspace designed to centralize and streamline your work. Our service includes a suite of tools for customer relationship management (CRM), project tracking, team collaboration, and more, accessible through a unified interface.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">3. User Accounts</h2>
            <p>To access most features of Trac Diary, you must register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">4. User Conduct</h2>
            <p>You agree not to use the service for any unlawful purpose or in any way that could harm the service or another user. This includes, but is not limited to, uploading malicious code, infringing on intellectual property rights, or engaging in harassment.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">5. Intellectual Property</h2>
            <p>All rights, title, and interest in and to the Trac Diary service, including all associated intellectual property rights, are and will remain the exclusive property of TRAC AI (PRIVATE) LIMITED. The TRAC AI and Trac Diary names and logos are trademarks of TRAC AI (PRIVATE) LIMITED.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">6. Applicable License Terms</h2>
            <p>Your use of the Trac Diary application is subject to the following license terms:</p>
            <blockquote className="border-l-4 border-gray-300 pl-4 italic my-6">
              Standard Application License Terms apply. Use of this software is subject to the Traconomics Terms of Service and Privacy Policy. By installing, you agree to the terms at <Link href="https://traconomics.com/terms" className="text-blue-600 hover:underline">https://traconomics.com/terms</Link>.
            </blockquote>
            <p>This license is granted to you for use on any Windows 10 or Windows 11 device that you own or control. This license does not allow you to distribute or make the application available over a network where it could be used by multiple devices at the same time.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">7. Termination</h2>
            <p>We may terminate or suspend your access to our service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">8. Disclaimers and Limitation of Liability</h2>
            <p>The service is provided on an "AS IS" and "AS AVAILABLE" basis. TRAC AI (PRIVATE) LIMITED makes no warranties, express or implied, regarding the service. In no event shall TRAC AI (PRIVATE) LIMITED be liable for any indirect, incidental, special, consequential or punitive damages.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">9. Governing Law</h2>
            <p>These Terms shall be governed by the laws of Pakistan, without regard to its conflict of law provisions.</p>
            
            <h2 className="text-2xl font-bold mt-10 mb-4">10. Changes to Terms</h2>
            <p>We reserve the right to modify these terms at any time. We will provide notice of changes by posting the new terms on our site. Your continued use of the service after any such changes constitutes your acceptance of the new Terms.</p>

            <h2 className="text-2xl font-bold mt-10 mb-4">Contact Us</h2>
            <p>If you have any questions about these Terms, please contact us at support@traconomics.com.</p>
          </div>
        </div>
      </main>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-12 border-t border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <p>© 2026 TRAC AI (PRIVATE) LIMITED. All rights reserved.</p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <Link href="/privacy-policy" className="hover:text-black transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-black transition-colors">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TermsPage;
