import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { Providers } from './providers';
import pkg from '../../package.json';

import '@/global.css';
import '@/font.css';
import 'antd/dist/reset.css';
import 'cropperjs/dist/cropper.css';
import '@/halas/UI/header/Toolbar/index.scss';
import '@/halas/UI/panel/index.scss';
import '@/halas/UI/setter/ImageSetter/ImageFx/FilterGroup/index.scss';

export const metadata: Metadata = {
  title: 'halas, A creative editor based on fabricjs.',
  description: pkg.description,
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
