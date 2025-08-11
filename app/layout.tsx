// app/layout.tsx
import Script from "next/script";
import { Suspense } from "react";
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
        {/* GA init (disable auto page_view so we control SPA tracking) */}
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_ID}', { send_page_view: false });
          `}
        </Script>
      </head>
      <body style={{ overflowY: "scroll" }}>
        {/* Wrap hooks in Suspense to satisfy App Router prerendering */}
        <Suspense fallback={null}>
          <GATracker />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
