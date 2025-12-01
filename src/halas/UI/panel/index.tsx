import { Layout, FloatButton } from 'antd';
import { useContext, useState } from 'react';
import { LayoutTemplate, Type, Image, Shapes, PenTool, AppWindow } from 'lucide-react';
import TextPanel from './TextPanel';
import ImagePanel from './ImagePanel';
import ShapePanel from './ShapePanel';
import PaintPanel from './PaintPanel';
import DesignPanel from './DesignPanel';
import { GlobalStateContext } from '@/context';
import AppPanel from './AppPanel';
import { PANEL_WIDTH } from '@/config';
import { Trans } from '@/i18n/utils';
import LocalesSwitch from '@/halas/components/LocalesSwitch';
import styles from './index.module.scss';

// styles moved to global import in _app.tsx

const { Sider } = Layout;

const iconSize = 24;

const OBJECT_TYPES = [
  {
    label: <Trans i18nKey="panel.design.title" />,
    value: 'design',
    icon: <LayoutTemplate size={iconSize} />
  },
  {
    label: <Trans i18nKey="panel.text.title" />,
    value: 'text',
    icon: <Type size={iconSize} />
  },
  {
    label: <Trans i18nKey="panel.image.title" />,
    value: 'image',
    icon: <Image size={iconSize} />
  },
  {
    label: <Trans i18nKey="panel.material.title" />,
    value: 'shape',
    icon: <Shapes size={iconSize} />
  },
  {
    label: <Trans i18nKey="panel.paint.title" />,
    value: 'paint',
    icon: <PenTool size={iconSize} />
  },
  {
    label: <Trans i18nKey="panel.app.title" />,
    value: 'app',
    icon: <AppWindow size={iconSize} />
  }
];

export default function Panel () {
  const { editor } = useContext(GlobalStateContext);
  const [activeTab, setActiveTab] = useState('design');

  const renderPanel = (value) => {
    if (value === 'design') {
      return <DesignPanel />;
    }
    if (value === 'text') {
      return <TextPanel />;
    }
    if (value === 'image') {
      return <ImagePanel />;
    }
    if (value === 'shape') {
      return <ShapePanel />;
    }
    if (value === 'paint') {
      return <PaintPanel />;
    }
    if (value === 'app') {
      return <AppPanel />;
    }
    return null;
  }

  const handleTabChange = (k) => {
    setActiveTab(k);
    if (editor?.canvas) {
      if (k === 'paint') {
        editor.canvas.isDrawingMode = true;
      } else {
        editor.canvas.isDrawingMode = false;
      }
    }
  }

  return (
    <Sider
      width={PANEL_WIDTH + 68} // Sidebar width + Content width
      theme="light"
      style={{ borderRight: '1px solid #f0f0f0', overflow: 'hidden' }}
      className="halas-sider"
    >
      <div className={styles.panelLayout}>
        <div className={styles.sidebar}>
          {
            OBJECT_TYPES.map(item => (
              <div 
                key={item.value}
                className={`${styles.sidebarItem} ${activeTab === item.value ? styles.active : ''}`}
                onClick={() => handleTabChange(item.value)}
              >
                <div className={styles.icon}>{item.icon}</div>
                <span className={styles.label}>{item.label}</span>
              </div>
            ))
          }
          
          <div className={styles.bottomActions}>
             <LocalesSwitch />
          </div>
        </div>
        <div className={styles.content}>
          {renderPanel(activeTab)}
        </div>
      </div>
    </Sider>
  )
}
