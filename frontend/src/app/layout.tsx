import './globals.css';
import { ThemeProvider } from '@/context/ThemeContext';
import { HandoverProvider } from '@/context/HandoverContext';
import { Header } from '@/components/Header';

export const metadata = {
  title: 'Trailmark | Knowledge Handover Platform',
  description: 'Evidence-backed, permission-aware project handover for software engineering teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-slate-50 dark:bg-navy-950 text-slate-900 dark:text-slate-100 antialiased selection:bg-brand-500 selection:text-white">
        <ThemeProvider>
          <HandoverProvider>
            <div className="flex flex-col min-h-screen">
              <Header />
              <main className="flex-1 pb-16">{children}</main>
            </div>
          </HandoverProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

