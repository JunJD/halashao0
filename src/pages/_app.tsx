import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';
import * as dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';

import '@/global.css';
import '@/font.css';
import 'antd/dist/reset.css';
import 'cropperjs/dist/cropper.css';
import '@/fabritor/UI/header/Toolbar/index.scss';
import '@/fabritor/UI/panel/index.scss';
import '@/fabritor/UI/setter/ImageSetter/ImageFx/FilterGroup/index.scss';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const lngParam = (router.query?.lng as string) || 'en-US';
  const [antDLocale, setAntDLocale] = useState<Locale>(enUS);

  useEffect(() => {
    // init i18n on client only
    import('@/i18n').catch(() => {});

    // Dynamically set AntD/dayjs/i18n language
    if (lngParam === 'en-US') {
      setAntDLocale(enUS);
      dayjs.locale('en');
      import('@/i18n').then((m) => m.default?.changeLanguage?.('en-US')).catch(() => {});
    } else {
      setAntDLocale(zhCN);
      dayjs.locale('zh-cn');
      import('@/i18n').then((m) => m.default?.changeLanguage?.('zh-CN')).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lngParam]);

  return (
    <ConfigProvider locale={antDLocale}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
