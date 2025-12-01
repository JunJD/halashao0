import Head from 'next/head';
import dynamic from 'next/dynamic';

// Halas uses browser APIs heavily; disable SSR for safety
const Halas = dynamic(() => import('@/halas'), { ssr: false });

export default function HomePage() {
  return (
    <>
      <Head>
        <title>halas, A creative editor based on fabricjs.</title>
      </Head>
      <Halas />
    </>
  );
}
