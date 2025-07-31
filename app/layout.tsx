// app/layout.tsx
import './globals.css'; // optional if you're using global styles

export const metadata = {
  title: 'MedMatch Global',
  description: 'Global drug matching for safe travel and relocation.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
