import { Flex, List, Empty, Button } from 'antd';
import { useEffect, useContext, useState } from 'react';
import { GlobalStateContext } from '@/context';
import { SKETCH_ID } from '@/utils/constants';
import { GroupOutlined, HeartTwoTone } from '@ant-design/icons';
import { Layers, Type, Image as ImageIcon, Box } from 'lucide-react';
import ContextMenu from '@/halas/components/ContextMenu';
import DEMOJSON from '@/assets/demo.json';
import { useTranslation } from '@/i18n/utils';

const LayerIcon = ({ type, group }) => {
  if (group) return <GroupOutlined style={{ fontSize: 16, color: '#666' }} />;
  if (type === 'f-text' || type === 'textbox') return <Type size={16} color="#666" />;
  if (type === 'f-image' || type === 'image') return <ImageIcon size={16} color="#666" />;
  return <Box size={16} color="#666" />;
};

export default function Layer() {
  const { isReady, setReady, object: activeObject, setActiveObject, editor } = useContext(GlobalStateContext);
  const [layers, setLayers] = useState([]);
  const { t } = useTranslation();

  const getCanvasLayers = (objects) => {
    const _layers: any = [];
    const { length } = objects;
    if (!length) {
      setLayers([]);
      return;
    }
    const activeObject = editor?.canvas.getActiveObject();
    for (let i = length - 1; i >= 0; i--) {
      let object = objects[i];
      if (object && object.id !== SKETCH_ID) {
        if (activeObject === object) {
          object.__cover = object.toDataURL();
        } else {
          if (!object.__cover) {
            object.__cover = object.toDataURL();
          }
        }

        _layers.push({
          cover: object.__cover,
          group: object.type === 'group',
          object,
          type: object.type,
        });
      }
    }
    setLayers(_layers);
  };

  const loadDemo = async () => {
    setReady(false);
    await editor.loadFromJSON(DEMOJSON, true);
    editor.fhistory.reset();
    setReady(true);
    setActiveObject(null);
    editor.fireCustomModifiedEvent();
  };

  const handleItemClick = (item) => {
    editor.canvas.discardActiveObject();
    editor.canvas.setActiveObject(item.object);
    editor.canvas.requestRenderAll();
  };

  useEffect(() => {
    let canvas;
    const initCanvasLayers = () => { getCanvasLayers(canvas.getObjects()); };

    if (isReady) {
      setLayers([]);
      canvas = editor?.canvas;
      initCanvasLayers();

      canvas.on({
        'object:added': initCanvasLayers,
        'object:removed': initCanvasLayers,
        'object:modified': initCanvasLayers,
        'object:skewing': initCanvasLayers,
        'halas:object:modified': initCanvasLayers,
      });
    }

    return () => {
      if (canvas) {
        canvas.off({
          'object:added': initCanvasLayers,
          'object:removed': initCanvasLayers,
          'object:modified': initCanvasLayers,
          'object:skewing': initCanvasLayers,
          'halas:object:modified': initCanvasLayers,
        });
      }
    };
  }, [isReady]);

  return (
    <div style={{ padding: '16px', height: '100%', overflowY: 'auto' }}>
      <div style={{ fontSize: 14, fontWeight: 600, color: '#333', marginBottom: 16 }}>
        {t('panel.design.title')}
      </div>
      {
        layers.length
        ? <List
            dataSource={layers}
            split={false}
            renderItem={(item: any) => (
              <ContextMenu object={item.object} noCareOpen>
                <div
                  onClick={() => { handleItemClick(item); }}
                  style={{
                  padding: '8px 12px',
                  marginBottom: 8,
                  borderRadius: 8,
                  cursor: 'pointer',
                  backgroundColor: activeObject === item.object ? '#e6f4ff' : '#f9f9f9',
                  border: activeObject === item.object ? '1px solid #1677ff' : '1px solid transparent',
                  transition: 'all 0.2s',
                }}
                >
                  <Flex justify="space-between" align="center" style={{ width: '100%' }}>
                    <div style={{
                    width: 40,
                    height: 40,
                    background: '#fff',
                    borderRadius: 4,
                    border: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                  }}
                    >
                      <img src={item.cover} style={{ maxWidth: '100%', maxHeight: '100%' }} />
                    </div>
                    <div style={{ flex: 1, marginLeft: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <LayerIcon type={item.type} group={item.group} />
                      <span style={{ fontSize: 12, color: '#333' }}>
                        {item.type === 'f-text' ? (item.object.text?.slice(0, 10) || 'Text') : item.type}
                      </span>
                    </div>
                  </Flex>
                </div>
              </ContextMenu>
          )}
        />
        : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Empty
            image={null}
            description={
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
                <Layers size={48} color="#ddd" />
                <p style={{ color: '#999', fontSize: 14, margin: 0 }}>{t('panel.design.start')}</p>
                <Button type="primary" shape="round" size="large" onClick={loadDemo}>
                  {t('panel.design.start_demo')}
                </Button>
              </div>
            }
          />
        </div>
      }
    </div>
  );
}