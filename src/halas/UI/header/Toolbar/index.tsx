import { useContext, useEffect, useState } from 'react';
import { Modal } from 'antd';
import { GlobalStateContext } from '@/context';
import { ExclamationCircleFilled } from '@ant-design/icons';
import { Undo2, Redo2, Hand, MousePointer2, Trash2 } from 'lucide-react';
import { CenterV } from '@/halas/components/Center';
import ToolbarItem from './ToolbarItem';
import ToolbarDivider from '@/halas/components/ToolbarDivider';
import { Trans } from '@/i18n/utils';

// styles moved to global import in _app.tsx

const i18nKeySuffix = 'header.toolbar';
const ICON_SIZE = 20;

export default function Toolbar () {
  const { setActiveObject, editor } = useContext(GlobalStateContext);
  const [panEnable, setPanEnable] = useState(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const clearCanvas = () => {
    Modal.confirm({
      title: <Trans i18nKey={`${i18nKeySuffix}.clear_confirm`} />,
      icon: <ExclamationCircleFilled />,
      async onOk () {
        await editor.clearCanvas();
        setActiveObject(editor.sketch);
        editor.fireCustomModifiedEvent();
      }
    });
  }

  const enablePan = () => {
    const enable = editor.switchEnablePan();
    setPanEnable(enable);
  }

  useEffect(() => {
    if (editor) {
      setCanUndo(editor.fhistory.canUndo());
      setCanRedo(editor.fhistory.canRedo());
    }
  });

  return (
    <CenterV gap={4} style={{ borderRight: '1px solid #e8e8e8', paddingRight: 12 }}>
      <ToolbarItem
        disabled={!canUndo} 
        title={<Trans i18nKey={`${i18nKeySuffix}.undo`} />} 
        onClick={() => { editor.fhistory.undo() }}
      >
        <Undo2 size={ICON_SIZE} />
      </ToolbarItem>
      <ToolbarItem
        disabled={!canRedo}
        title={<Trans i18nKey={`${i18nKeySuffix}.redo`} />} 
        onClick={() => { editor.fhistory.redo() }}
      >
        <Redo2 size={ICON_SIZE} />
      </ToolbarItem>
      <ToolbarDivider />
      <ToolbarItem
        onClick={enablePan}
        title={panEnable ? <Trans i18nKey={`${i18nKeySuffix}.select`} /> : <Trans i18nKey={`${i18nKeySuffix}.pan`} />}
        style={panEnable ? { backgroundColor: 'rgba(0,0,0,0.06)' } : {}}
      >
        {
          panEnable ? 
          <MousePointer2 size={ICON_SIZE} /> :
          <Hand size={ICON_SIZE} />
        }
      </ToolbarItem>
      <ToolbarItem onClick={clearCanvas} title={<Trans i18nKey={`${i18nKeySuffix}.clear`} />}>
        <Trash2 size={ICON_SIZE} />
      </ToolbarItem>
    </CenterV>
  )
}
