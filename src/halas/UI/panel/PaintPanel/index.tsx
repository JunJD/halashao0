import { Tooltip, Flex, Button } from 'antd';
import { useContext, useEffect, useState } from 'react';
import { fabric } from 'fabric';
import { MousePointer2, PenTool } from 'lucide-react';
import BrushList from './brush-list';
import { GlobalStateContext } from '@/context';
import PathSetterForm from '../../setter/PathSetter/PathSetterForm';
import { useTranslation } from '@/i18n/utils';

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12, marginTop: 24 }}>
    {children}
  </div>
);

export default function PaintPanel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isDrawingMode, setIsDrawingMode] = useState(true);
  const { editor } = useContext(GlobalStateContext);
  const [penFormValues, setPenFormValues] = useState({});
  const { t } = useTranslation();

  const handleBrushChange = (options) => {
    if (options.color) {
      editor.canvas.freeDrawingBrush.color = options.color;
    }
    if (options.width) {
      editor.canvas.freeDrawingBrush.width = options.width;
    }
    if (options.strokeLineCap) {
      editor.canvas.freeDrawingBrush.strokeLineCap = options.strokeLineCap;
    }
    if (options.shadow) {
      const { shadow } = editor.canvas.freeDrawingBrush;
      const originalShadowObject = shadow ? (shadow as any).toObject() : {};
      const newShadowObject = {
        blur: options.shadow.width || originalShadowObject.blur,
        offsetX: options.shadow.offset || originalShadowObject.offsetX,
        offsetY: options.shadow.offset || originalShadowObject.offsetY,
        affectStroke: true,
        color: options.shadow.color || originalShadowObject.color,
      };
      editor.canvas.freeDrawingBrush.shadow = new fabric.Shadow(newShadowObject);
    }
  };

  const toggleDrawingMode = () => {
    const newMode = !editor.canvas.isDrawingMode;
    editor.canvas.isDrawingMode = newMode;
    setIsDrawingMode(newMode);
  };

  const initBrush = () => {
    if (editor) {
      // 默认开启绘画模式
      editor.canvas.isDrawingMode = true;
      // 简单的十字光标，或者可以自定义
      editor.canvas.freeDrawingCursor = 'crosshair';

      const freeDrawingBrush = new fabric.PencilBrush(editor.canvas);
      editor.canvas.freeDrawingBrush = freeDrawingBrush;
      const { color, width } = BrushList[0].options;
      freeDrawingBrush.color = color;
      freeDrawingBrush.width = width;
      freeDrawingBrush.shadow = new fabric.Shadow({
        blur: 0,
        offsetX: 0,
        offsetY: 0,
        affectStroke: true,
        color: '#000000',
      });

      setPenFormValues({
        color,
        width,
        shadow: {
          color: '#000000',
          width: 0,
          offset: 0,
        },
      });
    }

    return () => {
      if (editor?.canvas) {
        editor.canvas.isDrawingMode = false;
      }
    };
  };

  useEffect(() => {
    return initBrush();
  }, []);

  return (
    <div style={{ padding: '20px 16px', height: '100%', overflowY: 'auto' }}>
      <Button
        block
        size="large"
        onClick={toggleDrawingMode}
        type={isDrawingMode ? 'primary' : 'default'}
        icon={isDrawingMode ? <PenTool size={18} /> : <MousePointer2 size={18} />}
        style={{
          height: 48,
          borderRadius: 12,
          marginBottom: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {isDrawingMode ? t('panel.paint.stop') : t('panel.paint.start')}
      </Button>

      <div style={{ opacity: isDrawingMode ? 1 : 0.5, pointerEvents: isDrawingMode ? 'auto' : 'none', transition: 'opacity 0.2s' }}>
        <SectionTitle>{t('panel.paint.title')}</SectionTitle>
        <Flex wrap="wrap" gap={12}>
          {
            BrushList.map((item, index) => (
              <Tooltip trigger="hover" title={item.title} key={item.key}>
                <div
                  onClick={() => {
                    handleBrushChange(item.options);
                    setActiveIndex(index);
                    setPenFormValues({
                      ...penFormValues,
                      ...item.options,
                    });
                  }}
                  style={{
                    padding: 8,
                    backgroundColor: activeIndex === index ? '#e6f4ff' : '#f5f7fa',
                    border: activeIndex === index ? '1px solid #1677ff' : '1px solid transparent',
                    borderRadius: 12,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  <img src={`data:image/svg+xml,${encodeURIComponent(item.svg)}`} alt="" style={{ width: 40, height: 40, display: 'block' }} />
                </div>
              </Tooltip>
            ))
          }
        </Flex>

        <SectionTitle>{t('setter.sketch.title')}</SectionTitle>
        <PathSetterForm
          onChange={handleBrushChange}
          value={penFormValues}
          showPenTip
        />
      </div>
    </div>
  );
}