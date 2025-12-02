import { createContext } from 'react';
import { type fabric } from 'fabric';
import type Editor from '@/editor';
export interface IGlobalStateContext {
  object?: fabric.Object | null | undefined;
  setActiveObject?: (o: fabric.Object) => void;
  isReady?: boolean;
  setReady?: (o: boolean) => void;
  editor?: Editor;
  roughSvg?: any;
}

export const GlobalStateContext = createContext<IGlobalStateContext>(null);