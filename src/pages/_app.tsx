import type { AppProps } from 'next/app';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';
import * as dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { CopilotKit } from '@copilotkit/react-core';
import '@copilotkit/react-ui/styles.css';

import '@/global.css';
import '@/font.css';
import 'antd/dist/reset.css';
import 'cropperjs/dist/cropper.css';
import '@/halas/UI/header/Toolbar/index.scss';
import '@/halas/UI/panel/index.scss';
import '@/halas/UI/setter/ImageSetter/ImageFx/FilterGroup/index.scss';

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
    <CopilotKit publicApiKey="ck_pub_e013a509e2f8641795ee0f15af8e2622">
      <ConfigProvider
        locale={antDLocale}
        theme={{
          token: {
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
            colorPrimary: '#000000',
            borderRadius: 8,
          },
          components: {
            Button: {
              controlHeight: 36,
              borderRadius: 8,
              primaryShadow: '0 2px 0 rgba(0, 0, 0, 0.04)',
              defaultShadow: '0 2px 0 rgba(0, 0, 0, 0.02)',
            },
            Input: {
              controlHeight: 36,
              borderRadius: 8,
            },
            Select: {
              controlHeight: 36,
              borderRadius: 8,
            },
            Popover: {
              borderRadius: 10,
            },
            Segmented: {
              borderRadius: 8,
              trackBg: '#f5f5f5',
              itemSelectedBg: '#ffffff',
              itemSelectedColor: '#000',
              itemColor: '#666',
            },
            Layout: {
              headerBg: '#ffffff',
              siderBg: '#ffffff',
            },
          },
        }}
      >
        <Component {...pageProps} />
      </ConfigProvider>
    </CopilotKit>
  );
}
