import { useContext } from 'react';
import { GlobalStateContext } from '@/context';
import { SKETCH_ID } from '@/utils/constants';
import SketchSetter from './SketchSetter';
import TextSetter from './TextSetter';
import ImageSetter from './ImageSetter';
import { LineSetter, ShapeSetter } from './ShapeSetter';
import CommonSetter from './CommonSetter';
import GroupSetter from './GroupSetter';
import PathSetter from './PathSetter';
import RoughSetter from './RoughSetter';

export default function Setter() {
  const { object, isReady } = useContext(GlobalStateContext);

  const objectType = object?.get?.('type') || '';

  const getRenderSetter = () => {
    if (!isReady) return null;
    if (!object || (object as any).id === SKETCH_ID) return <SketchSetter />;
    switch (objectType) {
      case 'textbox':
      case 'f-text':
        return <TextSetter />;
      case 'rect':
      case 'circle':
      case 'triangle':
      case 'polygon':
      case 'ellipse':
        return <ShapeSetter />;
      case 'f-line':
      case 'f-arrow':
      case 'f-tri-arrow':
        return <LineSetter />;
      case 'f-image':
        return <ImageSetter />;
      case 'path':
        if ((object as any)?.sub_type === 'rough') {
          return <RoughSetter />;
        }
        return <PathSetter />;
      case 'group':
        if ((object as any)?.sub_type === 'rough') {
          return <RoughSetter />;
        }
        return <GroupSetter />;
      case 'activeSelection':
        return <GroupSetter />;
      default:
        return null;
    }
  };

  const renderSetter = () => {
    const Setter = getRenderSetter();
    if (Setter) {
      return (
        <>
          {Setter}
          <div style={{ height: 24 }} />
        </>
      );
    }
    return null;
  };

  return (
    <div
      style={{
        padding: '20px 16px',
        height: '100%',
        overflowY: 'auto',
        scrollbarWidth: 'thin',
      }}
    >
      {renderSetter()}
      <CommonSetter />
    </div>
  );
}