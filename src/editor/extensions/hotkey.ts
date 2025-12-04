import hotkeys from 'hotkeys-js';
import { copyObject, pasteObject, removeObject } from '@/utils/helper';

export default function initHotKey(canvas, fhistory) {
  hotkeys.filter = () => true;

  const isFormattedNode = (target) => {
    const { tagName, isContentEditable } = target;
    if (isContentEditable) return true;
    if (['INPUT', 'SELECT', 'TEXTAREA'].includes(tagName)) {
      // ignore fabric hidden textarea
      if (target.parentElement?.classList.contains('canvas-container')) return false;
      return true;
    }
    return false;
  };

  // @ts-ignore hotkeys
  hotkeys('ctrl+c,command+c', async (event) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.isEditing) return;
    if (isFormattedNode(event.target)) return;
    event.preventDefault();
    await copyObject(canvas, null);
  });

  hotkeys('ctrl+v,command+v', (event) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.isEditing) return;
    if (isFormattedNode(event.target)) return;
    event.preventDefault();
    pasteObject(canvas);
  });

  hotkeys('delete,del,backspace', (event) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.isEditing) return;
    if (isFormattedNode(event.target)) return;
    event.preventDefault();
    removeObject(null, canvas);
  });

  hotkeys('ctrl+z,command+z', (event) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.isEditing) return;
    if (isFormattedNode(event.target)) return;
    event.preventDefault();
    fhistory.undo();
  });

  hotkeys('ctrl+shift+z,command+shift+z,ctrl+y,command+y', (event) => {
    const activeObject = canvas.getActiveObject();
    if (activeObject && activeObject.isEditing) return;
    if (isFormattedNode(event.target)) return;
    event.preventDefault();
    fhistory.redo();
  });

  hotkeys('up, right, down, left', (event, handler) => {
    const activeObject = canvas.getActiveObject();
    if (!activeObject) return;
    if (activeObject.isEditing) return;
    if (isFormattedNode(event.target)) return;
    event.preventDefault();
    switch (handler.key) {
      case 'up':
        activeObject.set('top', activeObject.top - 1);
        break;
      case 'right':
        activeObject.set('left', activeObject.left + 1);
        break;
      case 'down':
        activeObject.set('top', activeObject.top + 1);
        break;
      case 'left':
        activeObject.set('left', activeObject.left - 1);
        break;
      default:
        break;
    }
    if (activeObject.group) {
      activeObject.addWithUpdate();
    }
    canvas.requestRenderAll();
  });
}