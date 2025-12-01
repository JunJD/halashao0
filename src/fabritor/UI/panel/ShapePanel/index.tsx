import { Flex, Tag } from 'antd';
import LineTypeList from './line-type-list';
import ShapeTypeList from './shape-type-list';
import RoughTypeList from './rough-type-list';
import { drawArrowLine, drawLine, drawTriArrowLine } from '@/editor/objects/line';
import createRect from '@/editor/objects/rect';
import createShape from '@/editor/objects/shape';
import { useContext } from 'react';
import { GlobalStateContext } from '@/context';
import { createPathFromSvg } from '@/editor/objects/path';
import Center from '@/fabritor/components/Center';
import { useTranslation } from '@/i18n/utils';

const SectionTitle = ({ children }) => (
  <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 12, marginTop: 8 }}>
    {children}
  </div>
);

const ShapeItem = ({ onClick, children }) => (
  <div
    onClick={onClick}
    style={{
      background: '#f5f7fa',
      borderRadius: 8,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      aspectRatio: '1',
      transition: 'all 0.2s ease',
      border: '1px solid transparent'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.background = '#fff';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
      e.currentTarget.style.transform = 'scale(1.05)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.background = '#f5f7fa';
      e.currentTarget.style.boxShadow = 'none';
      e.currentTarget.style.transform = 'scale(1)';
    }}
  >
    {children}
  </div>
);

export default function ShapePanel () {
  const { editor, roughSvg } = useContext(GlobalStateContext);
  const { t } = useTranslation();

  const addLine = (item) => {
    const { type, options = {} } = item;
    const canvas = editor.canvas;
    switch (type) {
      case 'f-line':
        drawLine({ ...options, canvas });
        break;
      case 'f-arrow':
        drawArrowLine({ ...options, canvas });
        break;
      case 'f-tri-arrow':
        drawTriArrowLine({ ...options, canvas });
        break;
      default:
        break;
    }
  }

  const addShape = (item) => {
    const { key, elem, options } = item;
    const canvas = editor.canvas;
    switch(key) {
      case 'rect':
      case 'rect-r':
        createRect({ ...options, canvas });
        break;
      case 'star':
      case 'heart':
        createPathFromSvg({ svgString: elem, canvas, sub_type: key, strokeWidth: 20 });
        break;
      default:
        createShape(item.shape, { ...options, canvas });
        break;
    }
  }

  const addRough = (item) => {
    const { key, options } = item;
    const canvas = editor.canvas;
    let svg;
    switch (key) {
      case 'rough-line':
        svg = roughSvg.line(0, 0, 300, 0, options);
        break;
      case 'rough-rect':
        svg = roughSvg.rectangle(0, 0, 400, 400, options);
        break;
      case 'rough-circle':
        svg = roughSvg.circle(0, 0, 300, options);
        break;
      case 'rough-ellipse':
        svg = roughSvg.ellipse(0, 0, 300, 150, options);
        break;
      case 'rough-right-angle':
        svg = roughSvg.polygon([[0, 0], [0, 300], [300, 300]], options);
        break;
      case 'rough-diamond':
        svg = roughSvg.polygon([[0, 150], [150, 300], [300, 150], [150, 0]], options);
      default:
        break;
    }

    console.log(svg)
    const svgString = `<svg fill="none" xmlns="http://www.w3.org/2000/svg">${svg.innerHTML}</svg>`
    createPathFromSvg({ svgString, canvas, sub_type: 'rough' });
  }

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <SectionTitle>{t('panel.material.line')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {
          LineTypeList.map(item => (
            <ShapeItem key={item.key} onClick={() => { addLine(item) }}>
              <img src={`data:image/svg+xml,${encodeURIComponent(item.svg)}`} alt="" style={{ width: 32, height: 32 }} />
            </ShapeItem>
          ))
        }
      </div>

      <SectionTitle>{t('panel.material.shape')}</SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {
          ShapeTypeList.map(item => (
            <ShapeItem key={item.key} onClick={() => { addShape(item) }}>
              <img src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(item.elem)}`} style={{ width: 36, height: 36 }} />
            </ShapeItem>
          ))
        }
      </div>

      <SectionTitle>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span>{t('panel.material.hand_drawn')}</span>
          <Tag color="orange" style={{ borderRadius: 4, fontSize: 10, lineHeight: '16px', height: 18, border: 'none' }}>BETA</Tag>
        </div>
      </SectionTitle>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
        {
          RoughTypeList.map(item => (
            <ShapeItem key={item.key} onClick={() => { addRough(item) }}>
              <img src={item.elem} style={{ width: 40 }} />
            </ShapeItem>
          ))
        }
      </div>
    </div>
  )
}