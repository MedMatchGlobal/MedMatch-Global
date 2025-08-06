// app/layout.tsx
import '../styles/globals.css'; // correct path from app/layout.tsx

export const metadata = {
  title: 'MedMatch Global',
  description: 'Global drug matching for safe travel and relocation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ overflowY: 'scroll' }}>{children}</body>
    </html>
  );
}
