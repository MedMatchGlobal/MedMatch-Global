// app/layout.tsx
import Script from "next/script";
import "../styles/globals.css";
import GATracker from "./ga-tracker";

export const metadata = {
  title: "medicéa",
  description: "Global drug matching for safe travel and relocation.",
};

const GA_ID = "G-CSY32ESDM8";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* GA loader */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        {/* GA init */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            // Init GA
            gtag('js', new Date());
            // Disable auto page_view so we control SPA tracking
            gtag('config', '${GA_ID}', { send_page_view: false });
          `}
        </Script>
      </head>
      <body style={{ overflowY: 'scroll' }}>
        {/* Tracks initial load + route changes */}
        <GATracker />
        {children}
      </body>
    </html>
  );
}
