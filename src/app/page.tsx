'use client';

import dynamic from 'next/dynamic';

const Halas = dynamic(() => import('@/halas'), { ssr: false });

export default function Page() {
  return <Halas />;
}
