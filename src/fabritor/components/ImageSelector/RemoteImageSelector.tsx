import { useState } from 'react';
import { Button, Input, Popover, Space } from 'antd';
import { useTranslation } from '@/i18n/utils';
import { Link } from 'lucide-react';

export default function RemoteImageSelector (props) {
  const { onChange, ...rest } = props;
  const [url, setUrl] = useState('');
  const { t } = useTranslation();

  const handleClick = () => {
    if (url) {
      onChange?.(url);
    }
  }

  return (
    <Popover
      content={
        <Space.Compact style={{ width: 300 }}>
          <Input 
            value={url} 
            onChange={(e) => { setUrl(e.target.value) }} 
            placeholder="https://"
          />
          <Button type="primary" onClick={handleClick}>{t('common.ok')}</Button>
        </Space.Compact>
      }
      title={t('panel.image.remote_placeholder')}
      trigger="click"
      placement="bottom"
    >
      <Button 
        size="large" 
        block
        icon={<Link size={18} />}
        style={{ height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
        {...rest}
      >
        {t('panel.image.remote')}
      </Button>
    </Popover>
  );
}