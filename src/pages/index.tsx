import Head from 'next/head';
import dynamic from 'next/dynamic';

// Fabritor uses browser APIs heavily; disable SSR for safety
const Fabritor = dynamic(() => import('@/fabritor'), { ssr: false });

export default function HomePage() {
  return (
    <>
      <Head>
        <title>fabritor, A creative editor based on fabricjs.</title>
      </Head>
      <Fabritor />
    </>
  );
}
