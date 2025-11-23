import localFont from 'next/font/local';
import ClientLayout from '@/components/client-layout';
import './globals.css';

const commitMono = localFont({
  src: [
    {
      path: './fonts/CommitMono-400-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: './fonts/CommitMono-700-Regular.otf',
      weight: '700',
      style: 'normal',
    },
    {
      path: './fonts/CommitMono-400-Italic.otf',
      weight: '400',
      style: 'italic',
    },
    {
      path: './fonts/CommitMono-700-Italic.otf',
      weight: '700',
      style: 'italic',
    },
  ],
  variable: '--font-commit-mono',
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const pageTitle = 'BookWise - Intelligent Sales Assistant';
  const pageDescription = 'AI-powered book consultation and ordering assistant';

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDescription} />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body
        className={`${commitMono.variable} overflow-x-hidden antialiased`}
        suppressHydrationWarning
      >
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
