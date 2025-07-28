import type { AppProps } from 'next/app';
import Head from 'next/head';

import '../styles/globals.css'; // Optional: remove if you’re not using a global stylesheet

export default function App({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>MedMatch Global</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Find international equivalents of pharmaceutical drugs" />
      </Head>
      <Component {...pageProps} />
    </>
  );
}
