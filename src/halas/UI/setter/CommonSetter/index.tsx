import { useContext, useEffect, useState } from 'react';
import { GlobalStateContext } from '@/context';
import { Lock, Unlock, Copy, Trash2, FlipHorizontal, LocateFixed, AlignLeft, AlignCenterHorizontal, AlignRight, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd } from 'lucide-react';
import { SKETCH_ID } from '@/utils/constants';
import OpacitySetter from './OpacitySetter';
import ToolbarItem from '../../header/Toolbar/ToolbarItem';
import { CenterV } from '@/halas/components/Center';
import { copyObject, pasteObject, removeObject } from '@/utils/helper';
import FlipSetter from './FlipSetter';
import PositionSetter from './PositionSetter';
import { useTranslation, Trans } from '@/i18n/utils';

const ICON_SIZE = 20;

const ALIGH_TYPES = [
  {
    label: <Trans i18nKey="setter.common.center" />,
    icon: LocateFixed,
    key: 'center'
  },
  {
    label: <Trans i18nKey="setter.common.align_left" />,
    icon: AlignLeft,
    key: 'left'
  },
  {
    label: <Trans i18nKey="setter.common.center_h" />,
    icon: AlignCenterHorizontal,
    key: 'centerH'
  },
  {
    label: <Trans i18nKey="setter.common.align_right" />,
    icon: AlignRight,
    key: 'right'
  },
  {
    label: <Trans i18nKey="setter.common.align_top" />,
    icon: AlignVerticalJustifyStart,
    key: 'top'
  },
  {
    label: <Trans i18nKey="setter.common.center_v" />,
    icon: AlignVerticalJustifyCenter,
    key: 'centerV'
  },
  {
    label: <Trans i18nKey="setter.common.align_bottom" />,
    icon: AlignVerticalJustifyEnd,
    key: 'bottom'
  }
]

export default function CommonSetter () {
  const { object, editor } = useContext(GlobalStateContext);
  const { t } = useTranslation();
  const [lock, setLock] = useState(false);
  const [opacity, setOpacity] = useState(1);

  const handleLock = () => {
    object.set({
      lockMovementX: !lock,
      lockMovementY: !lock,
      hasControls: !!lock
    });
    editor.canvas.requestRenderAll();
    setLock(!lock);
    editor.fireCustomModifiedEvent();
  }

  const handleOpacity = (v) => {
    object.set('opacity', v);
    setOpacity(v);
    editor.canvas.requestRenderAll();
  }

  const handleFlip = (key) => {
    object.set(key, !object[key]);
    editor.canvas.requestRenderAll();
    editor.fireCustomModifiedEvent();
  }

  const alignObject = (alignType) => {
    switch (alignType) {
      case 'center':
        editor.canvas.viewportCenterObject(object);
        object.setCoords();
        break;
      case 'left':
        object.set('left', 0);
        break;
      case 'centerH':
        editor.canvas.viewportCenterObjectH(object);
        object.setCoords();
        break;
      case 'right':
        object.set('left', editor.sketch.width - object.width);
        break;
      case 'top':
        object.set('top', 0);
        break;
      case 'centerV':
        editor.canvas.viewportCenterObjectV(object);
        object.setCoords();
        break;
      case 'bottom':
        object.set('top', editor.sketch.height - object.height);
        break;
      default:
        break;
    }
    editor.canvas.requestRenderAll();
    editor.fireCustomModifiedEvent();
  }

  useEffect(() => {
    if (object) {
      setLock(object.lockMovementX);
      setOpacity(object.opacity);
    }
  }, [object]);

  if (!object || object.id === SKETCH_ID) return null;

  return (
    <>
      <CenterV height={30} gap={8} justify="space-between">
        <ToolbarItem
          tooltipProps={{ placement: 'top' }}
          onClick={handleLock} title={lock ? t('setter.common.unlock') : t('setter.common.lock')}
        >
          {
            lock ? 
            <Unlock size={ICON_SIZE} /> :
            <Lock size={ICON_SIZE} />
          }
        </ToolbarItem>
        <ToolbarItem tooltipProps={{ placement: 'top' }} title={t('setter.common.opacity')}>
          <OpacitySetter
            value={opacity}
            onChange={handleOpacity}
            onChangeComplete={() => { editor.fireCustomModifiedEvent(); }}
          />
        </ToolbarItem>
        <ToolbarItem
          tooltipProps={{ placement: 'top' }}
          title={t('setter.common.create_a_copy')}
          onClick={
            async () => {
              await copyObject(editor.canvas, object);
              await pasteObject(editor.canvas);
            }
          }
        >
          <Copy size={ICON_SIZE} />
        </ToolbarItem>
        <ToolbarItem
          tooltipProps={{ placement: 'top' }}
          title={t('setter.common.del')}
          onClick={() => { removeObject(null, editor.canvas); }}
        >
          <Trash2 size={ICON_SIZE} />
        </ToolbarItem>
        {
          object.type === 'f-image' ?
          <ToolbarItem
            tooltipProps={{ placement: 'top' }}
            title={t('setter.common.flip')}
          >
            <FlipSetter onChange={handleFlip} />
          </ToolbarItem> : null
        }
      </CenterV>
      
      <div style={{ height: 24 }} />
      
      <div style={{ marginBottom: 12, fontSize: 12, fontWeight: 600, color: '#666' }}>
        {t('setter.common.align')}
      </div>
      <CenterV height={30} gap={8} justify="space-between">
        {
          ALIGH_TYPES.map(item => (
            <ToolbarItem
              tooltipProps={{ placement: 'top' }}
              title={item.label}
              key={item.key}
              onClick={() => { alignObject(item.key); }}
            >
              <item.icon size={ICON_SIZE} />
            </ToolbarItem>
          ))
        }
      </CenterV>
      
      <div style={{ height: 24 }} />
      
      <PositionSetter />
    </>
  )
}