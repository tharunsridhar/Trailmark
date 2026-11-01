import './globals.css';
import { HandoverProvider } from '@/context/HandoverContext';
import { AppShell } from '@/components/AppShell';

export const metadata = {
  title: 'Trailmark | Handover OS',
  description: 'Evidence-backed project knowledge handover platform for engineering teams.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <HandoverProvider>
          <AppShell>{children}</AppShell>
        </HandoverProvider>
      </body>
    </html>
  );
}
