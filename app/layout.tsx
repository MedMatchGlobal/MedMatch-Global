export const metadata = {
  title: 'MedMatch Global',
  description: 'Homepage for MedMatch Global',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
