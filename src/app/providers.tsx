'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfigProvider } from 'antd';
import enUS from 'antd/locale/en_US';
import zhCN from 'antd/locale/zh_CN';
import type { Locale } from 'antd/es/locale';
import * as dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
// REMOVED: import { CopilotKit } from '@copilotkit/react-core';
// REMOVED: import '@copilotkit/react-ui/styles.css';

export function Providers({ children }: Readonly<{ children: React.ReactNode }>) {
  const searchParams = useSearchParams();
  const lngParam = searchParams?.get('lng') || 'en-US';
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
  }, [lngParam]);

  return (
    // REMOVED: <CopilotKit publicApiKey="ck_pub_e013a509e2f8641795ee0f15af8e2622">
      <ConfigProvider
        locale={antDLocale}
        theme={{
          token: {
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
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
        {children}
      </ConfigProvider>
    // REMOVED: </CopilotKit>
  );
}