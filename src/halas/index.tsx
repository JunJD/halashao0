import { fabric } from 'fabric';
import { useEffect, useRef, useState, useMemo } from 'react';
import { Layout, Spin } from 'antd';
import Header from './UI/header';
import Panel from './UI/panel';
import ChatPanel from './UI/chat';
import Editor from '@/editor';
import { GlobalStateContext } from '@/context';
import ContextMenu from './components/ContextMenu';
import { SKETCH_ID } from '@/utils/constants';
import ObjectRotateAngleTip from './components/ObjectRotateAngleTip';
import rough from 'roughjs';


const { Content } = Layout;

const workspaceStyle: React.CSSProperties = {
  background: '#ddd',
  width: '100%',
  height: '100%',
  overflow: 'hidden',
  flex: 1,
};

const contentStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '100%',
};

export default function Halas() {
  const canvasEl = useRef<HTMLCanvasElement>(null);
  const workspaceEl = useRef<HTMLDivElement>(null);
  const roughSvgEl = useRef(null);
  const [editor, setEditor] = useState<Editor | null>(null);
  const [roughSvg, setRoughSvg] = useState<any>();
  const [activeObject, setActiveObject] = useState<fabric.Object | null | undefined>(null);
  const [isReady, setReady] = useState(false);
  const contextMenuRef = useRef<any>(null);

  const clickHandler = (opt) => {
    const { target } = opt;
    if (editor.getIfPanEnable()) return;

    if (!target) {
      contextMenuRef.current?.hide();
      return;
    }

    if (opt.button === 3) { // 右键
      if (target.id !== SKETCH_ID) {
        editor.canvas.setActiveObject(target);
      }
      setTimeout(() => {
        contextMenuRef.current?.show();
      }, 50);
    } else {
      contextMenuRef.current?.hide();
    }
  };

  const selectionHandler = (opt) => {
    const { selected, sketch } = opt;
    if (selected && selected.length) {
      const selection = editor.canvas.getActiveObject();
      setActiveObject(selection);
    } else {
      // @ts-ignore
      setActiveObject(sketch);
    }
  };

  const groupHandler = () => {
    const selection = editor.canvas.getActiveObject();
    setActiveObject(selection);
  };

  const loadJsonHandler = (opt) => {
    const { lastActiveObject } = opt;
    if (lastActiveObject) {
      editor.canvas.setActiveObject(lastActiveObject);
      setActiveObject(lastActiveObject);
    }
  };

  const initEvent = () => {
    editor.canvas.on('selection:created', selectionHandler);
    editor.canvas.on('selection:updated', selectionHandler);
    editor.canvas.on('selection:cleared', selectionHandler);

    editor.canvas.on('mouse:down', clickHandler);

    editor.canvas.on('halas:group', groupHandler);
    editor.canvas.on('halas:ungroup', groupHandler);

    editor.canvas.on('halas:load:json', loadJsonHandler);
  };

  const initEditor = async () => {
    const _editor = new Editor({
      canvasEl: canvasEl.current,
      workspaceEl: workspaceEl.current,
      sketchEventHandler: {
        groupHandler: () => { setActiveObject(_editor.canvas.getActiveObject()); },
      },
    });

    editorInstance = _editor;

    if (isCancelled) {
      _editor.destroy();
      return;
    }

    await _editor.init();

    if (isCancelled) {
      _editor.destroy();
      return;
    }

    setEditor(_editor);
    setReady(true);
    setActiveObject(_editor.sketch);
  };

  const initRoughSvg = () => {
    // @ts-ignore rough svg
    setRoughSvg(rough.svg(roughSvgEl.current));
  };

  const renderWorkspace = useMemo(() => {
    return (
      <div style={workspaceStyle} ref={workspaceEl} className="halas-workspace">
        <canvas ref={canvasEl} />
      </div>
    );
  }, []);

  useEffect(() => {
    if (editor) {
      initEvent();
      initRoughSvg();
    }
  }, [editor]);

  useEffect(() => {
    let isCancelled = false;
    let editorInstance: Editor | null = null;

    const init = async () => {
      const _editor = new Editor({
        canvasEl: canvasEl.current,
        workspaceEl: workspaceEl.current,
        sketchEventHandler: {
          groupHandler: () => { setActiveObject(_editor.canvas.getActiveObject()); },
        },
      });

      editorInstance = _editor;

      if (isCancelled) {
        _editor.destroy();
        return;
      }

      await _editor.init();

      if (isCancelled) {
        _editor.destroy();
        return;
      }

      setEditor(_editor);
      setReady(true);
      setActiveObject(_editor.sketch);
    };

    init();

    return () => {
      isCancelled = true;
      if (editorInstance) {
        editorInstance.destroy();
      }
    };
  }, []);

  return (
    <GlobalStateContext.Provider
      value={{
        object: activeObject,
        setActiveObject,
        isReady,
        setReady,
        editor,
        roughSvg,
      }}
    >
      <Layout style={{ height: '100%' }} className="halas-layout">
        <Spin spinning={!isReady} fullscreen />
        <ObjectRotateAngleTip />
        <Header />
        {/* Ensure the main area fills remaining height so side panels stretch full-height */}
        <Layout style={{ flex: 1, minHeight: 0 }}>
          <Panel />
          <Content style={contentStyle}>
            <ContextMenu ref={contextMenuRef} object={activeObject}>
              {renderWorkspace}
            </ContextMenu>
          </Content>
          <ChatPanel />
        </Layout>

        <svg id="halas-rough-svg" ref={roughSvgEl} />
      </Layout>
    </GlobalStateContext.Provider>
  );
}
