import { Flex } from 'antd';
import Title from '@/halas/components/Title';
import { Trans, useTranslation, translate } from '@/i18n/utils';

const PRESET_FONT_LIST = [
  {
    label: <div style={{ fontSize: 28, fontFamily: 'SmileySans', fontWeight: 'bold', color: '#333' }}><Trans i18nKey="panel.text.add_title" /></div>,
    key: 'title',
    config: {
      fontFamily: 'SmileySans',
      fontWeight: 'bold',
      fontSize: 120,
      text: () => translate('panel.text.add_title'),
      top: 100,
    },
  },
  {
    label: <div style={{ fontSize: 22, fontFamily: 'AlibabaPuHuiTi', color: '#444' }}><Trans i18nKey="panel.text.add_subtitle" /></div>,
    key: 'sub-title',
    config: {
      fontFamily: 'AlibabaPuHuiTi',
      fontWeight: 'bold',
      fontSize: 100,
      text: () => translate('panel.text.add_subtitle'),
      top: 400,
    },
  },
  {
    label: <div style={{ fontSize: 16, fontFamily: 'SourceHanSerif', color: '#666' }}><Trans i18nKey="panel.text.add_body_text" /></div>,
    key: 'content',
    config: {
      fontFamily: 'SourceHanSerif',
      fontSize: 80,
      text: () => translate('panel.text.add_body_text'),
    },
  },
  {
    label: <div style={{ fontSize: 26, fontFamily: '霞鹜文楷', color: '#ffffff', WebkitTextStroke: '1px rgb(255, 87, 87)' }}><Trans i18nKey="panel.text.add_text_border" /></div>,
    key: 'border-text',
    config: {
      fontFamily: '霞鹜文楷',
      fontSize: 100,
      text: () => translate('panel.text.add_text_border'),
      fill: '#ffffff',
      stroke: '#ff5757',
      strokeWidth: 12,
    },
  },
];

export default function PresetFontPanel(props) {
  const { addTextBox } = props;
  const { t } = useTranslation();

  const handleClick = (item) => {
    addTextBox?.(item.config);
  };

  return (
    <Flex vertical gap={12} style={{ marginTop: 24 }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#999', paddingLeft: 4 }}>
        {t('panel.text.presets')}
      </div>
      {
        PRESET_FONT_LIST.map(item => (
          <div
            key={item.key}
            onClick={() => { handleClick(item); }}
            style={{
              padding: '16px 24px',
              backgroundColor: '#f5f7fa',
              borderRadius: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 80,
              border: '1px solid transparent',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fff';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.05)';
              e.currentTarget.style.borderColor = 'rgba(0,0,0,0.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#f5f7fa';
              e.currentTarget.style.boxShadow = 'none';
              e.currentTarget.style.borderColor = 'transparent';
            }}
          >
            {item.label}
          </div>
        ))
      }
    </Flex>
  );
}