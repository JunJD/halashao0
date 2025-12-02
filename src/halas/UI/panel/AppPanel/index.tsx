import { Flex, Card } from 'antd';
import { QrCode, Smile } from 'lucide-react';
import { useState } from 'react';
import QRCodePanel from './QRCode';
import EmojiPanel from './Emoji';
import { Trans } from '@/i18n/utils';

const APP_LIST = [
  {
    title: <Trans i18nKey="panel.app.qrcode" />,
    key: 'qrcode',
    icon: <QrCode size={30} />,
  },
  {
    title: <Trans i18nKey="panel.app.emoji" />,
    key: 'emoji',
    icon: <Smile size={30} />,
  },
];

export default function AppPanel() {
  const [app, setApp] = useState('');

  const handleAppClick = (item) => {
    setApp(item.key);
  };

  const back2List = () => { setApp(''); };

  const renderAppList = () => {
    return (
      <Flex
        wrap="wrap"
        gap={12}
        justify="space-around"
        style={{ padding: '16px 16px 16px 0', marginLeft: -8 }}
      >
        {
          APP_LIST.map(item => (
            <Card
              hoverable
              style={{ width: 120, paddingTop: 12 }}
              key={item.key}
              cover={<div style={{ display: 'flex', justifyContent: 'center' }}>{item.icon}</div>}
              bodyStyle={{ padding: 12 }}
              onClick={() => { handleAppClick(item); }}
            >
              <Card.Meta description={item.title} style={{ textAlign: 'center' }} />
            </Card>
          ))
        }
      </Flex>
    );
  };

  const renderApp = () => {
    if (app === 'qrcode') {
      return <QRCodePanel back={back2List} />;
    }
    if (app === 'emoji') {
      return <EmojiPanel back={back2List} />;
    }
    return null;
  };

  return (
    <div>
      {
        app ? renderApp() : renderAppList()
      }
    </div>
  );
}