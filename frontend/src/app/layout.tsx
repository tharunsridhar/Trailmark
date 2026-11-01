import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { HandoverProvider } from '@/context/HandoverContext';
import { Sidebar } from '@/components/Sidebar';
import { TopNav } from '@/components/TopNav';

export const metadata = {
  title: 'Trailmark | Modern Handover Dashboard',
  description: 'Evidence-backed, permission-aware project handover platform for engineering teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#F6F8FA] dark:bg-navy-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <ThemeProvider>
          <HandoverProvider>
            <div className="flex min-h-screen">
              {/* Modern Left Sidebar */}
              <Sidebar />

              {/* Main Content Workspace with TopNav */}
              <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <TopNav />
                <main className="flex-1 pb-16">{children}</main>
              </div>
            </div>
          </HandoverProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
