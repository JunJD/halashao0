import { AIMessage } from '@langchain/core/messages';
import { sketchToFabric } from './feature/sketchToFabric';
import type { ReactElement } from 'react';
import { parse } from '@babel/parser';
import tree from 'antd/es/tree';
import { type } from 'node:os';

type SketchFrame = { x: number; y: number; width: number; height: number };

function makeArtboard(frame: SketchFrame, background?: string) {
  const ab: any = {
    _class: 'artboard',
    frame,
    hasBackgroundColor: !!background,
    backgroundColor: background
      ? { _class: 'color', alpha: 1, red: 1, green: 1, blue: 1 }
      : undefined,
    layers: [],
  };
  if (background && background.startsWith('#')) {
    const hex = background.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    ab.backgroundColor = { _class: 'color', alpha: 1, red: r, green: g, blue: b };
  }
  return ab;
}

function textLayer({ x, y, width, height, text, fontSize = 20, color = '#000000', align = 'left' }: any) {
  return {
    _class: 'text',
    frame: { x, y, width, height },
    attributedString: {
      _class: 'attributedString',
      string: text,
      attributes: [
        {
          _class: 'stringAttribute',
          location: 0,
          length: text.length,
          attributes: {
            MSAttributedStringFontAttribute: { _class: 'fontDescriptor', attributes: { name: 'Arial', size: fontSize } },
            MSAttributedStringColorAttribute: { _class: 'color', alpha: 1, red: 0, green: 0, blue: 0 },
          },
        },
      ],
    },
    style: {
      textStyle: {
        _class: 'textStyle',
        encodedAttributes: {
          MSAttributedStringFontAttribute: { _class: 'fontDescriptor', attributes: { name: 'Arial', size: fontSize } },
          MSAttributedStringColorAttribute: { _class: 'color', alpha: 1, red: 0, green: 0, blue: 0 },
          paragraphStyle: { _class: 'paragraphStyle', alignment: align === 'center' ? 2 : align === 'right' ? 1 : 0 },
        },
      },
    },
  };
}

function rectLayer({ x, y, width, height, fill }: any) {
  const color = fill || '#cccccc';
  const layer: any = {
    _class: 'shapeGroup',
    frame: { x, y, width, height },
    hasClippingMask: false,
    layers: [
      {
        _class: 'rectangle',
        frame: { x: 0, y: 0, width, height },
        fixedRadius: 0,
      },
    ],
    style: {
      fills: [
        {
          _class: 'fill',
          isEnabled: true,
          fillType: 0,
          color: hexToSketchColor(color),
        },
      ],
    },
  };
  return layer;
}

function bitmapLayer({ x, y, width, height, src }: any) {
  return {
    _class: 'bitmap',
    frame: { x, y, width, height },
    image: src ? { _class: 'MSJSONFileReference', _ref_class: 'MSImageData', _ref: src } : undefined,
  };
}

function hexToSketchColor(hex: string) {
  if (!hex?.startsWith('#') || (hex.length !== 7 && hex.length !== 4)) {
    return { _class: 'color', alpha: 1, red: 0, green: 0, blue: 0 };
  }
  const norm = hex.length === 4 ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}` : hex;
  const r = parseInt(norm.slice(1, 3), 16) / 255;
  const g = parseInt(norm.slice(3, 5), 16) / 255;
  const b = parseInt(norm.slice(5, 7), 16) / 255;
  return { _class: 'color', alpha: 1, red: r, green: g, blue: b };
}

// Very lightweight JSX-to-tree converter for a constrained RN-like subset.
// Supports tags: View, Text, Image (others are ignored but traversed).
// Reads absolute positioning and size from style={{ left, top, width, height, backgroundColor, fontSize, color, textAlign }}
// Reads image uri from source={{ uri: '...' }} or src="..."
function parseJsxToTree(jsx: string): any {
  // Wrap to ensure parsable program
  const src = jsx.trim();
  const wrapped = src.startsWith('<') ? src : `(${src})`;
  const ast = parse(wrapped, { sourceType: 'module', plugins: ['jsx', 'typescript'] });

  // Find first JSXElement in AST
  let rootEl: any | null = null;
  const walk = (node: any) => {
    if (!node || rootEl) return;
    if (node.type === 'JSXElement') {
      rootEl = node;
      return;
    }
    for (const key in node) {
      const v = (node as any)[key];
      if (v && typeof v === 'object') {
        if (Array.isArray(v)) {
          for (const it of v) walk(it);
        } else {
          walk(v);
        }
      }
    }
  };
  walk(ast);
  if (!rootEl) return null;

  const readLiteral = (n: any) => {
    if (!n) return undefined;
    switch (n.type) {
      case 'StringLiteral':
        return n.value;
      case 'NumericLiteral':
        return n.value;
      case 'BooleanLiteral':
        return n.value;
      default:
        return undefined;
    }
  };

  const readObject = (obj: any) => {
    const out: any = {};
    if (obj?.type === 'ObjectExpression') {
      for (const p of obj.properties || []) {
        if (p.type === 'ObjectProperty' && p.key.type === 'Identifier') {
          const key = p.key.name;
          if (p.value.type === 'StringLiteral' || p.value.type === 'NumericLiteral' || p.value.type === 'BooleanLiteral') {
            out[key] = readLiteral(p.value);
          }
        }
      }
    }
    return out;
  };

  const elToNode = (el: any): any => {
    const opening = el.openingElement;
    const tag = opening.name?.name || null;
    const props: any = {};
    for (const a of opening.attributes || []) {
      if (a.type !== 'JSXAttribute' || a.name?.name == null) continue;
      const name = a.name.name as string;
      if (name === 'style' && a.value?.type === 'JSXExpressionContainer') {
        props.style = readObject(a.value.expression);
      } else if (name === 'src' && a.value?.type === 'StringLiteral') {
        props.src = a.value.value;
      } else if (name === 'source' && a.value?.type === 'JSXExpressionContainer') {
        const obj = readObject(a.value.expression);
        if (obj?.uri) props.src = obj.uri;
      }
    }

    const children: any[] = [];
    for (const c of el.children || []) {
      if (c.type === 'JSXElement') {
        children.push(elToNode(c));
      } else if (c.type === 'JSXText') {
        const t = c.value.trim();
        if (t) children.push(t);
      } else if (c.type === 'JSXExpressionContainer') {
        if (c.expression.type === 'StringLiteral') {
          const t = c.expression.value.trim();
          if (t) children.push(t);
        }
      }
    }
    return { type: tag, props, children };
  };

  const first = elToNode(rootEl);
  if (!first) return null;
  if (first.type === 'View') {
    return {
      type: 'Canvas',
      props: {
        width: Number(first.props?.style?.width ?? 800),
        height: Number(first.props?.style?.height ?? 800),
        backgroundColor: first.props?.style?.backgroundColor ?? '#ffffff',
      },
      children: first.children,
    };
  }
  return first;
}

/**
 * Convert a view tree to Sketch JSON.
 *
 * Accepts either our previous JSON shape { type, props, children }
 * or a real React element produced by genjsx. For React elements,
 * node.props.children is used and node.type can be 'View' | 'Text' | 'Image' | 'Svg'.
 *
 * We expect react-native style props (style.left/top/width/height/backgroundColor)
 * or the simplified props (x/y/width/height/backgroundColor) used in our JSON shape.
 */
function treeToSketch(node: any): any {
  // Helper to normalize a node (JSON or ReactElement) to { typeName, props, children[] }
  const normalize = (n: any): { typeName: string | null; props: any; children: any[] } => {
    if (!n || typeof n !== 'object') return { typeName: null, props: {}, children: [] };
    // React element: { type, props }
    const typeVal = (n as ReactElement)?.type ?? (n as any)?.type;
    let typeName: string | null = null;
    if (typeof typeVal === 'string') {
      typeName = typeVal;
    } else if (typeVal && typeof typeVal === 'function' && (typeVal as any).name) {
      typeName = (typeVal as any).name;
    } else if (typeof (n as any)?.type === 'string') {
      typeName = (n as any).type;
    }
    const props = (n as any)?.props ?? (n as any)?.props ?? {};
    // Children: React => props.children; JSON => children
    let rawChildren: any = (n as any)?.props?.children ?? (n as any)?.children;
    const children = Array.isArray(rawChildren) ? rawChildren : rawChildren ? [rawChildren] : [];
    return { typeName, props, children };
  };

  const asRoot = normalize(node);
  // Determine canvas size/background
  const style = asRoot.props?.style ?? {};
  const width = Number(asRoot.props?.width ?? style?.width ?? 800);
  const height = Number(asRoot.props?.height ?? style?.height ?? 800);
  const backgroundColor = (asRoot.props?.backgroundColor ?? style?.backgroundColor) as string | undefined;
  const ab = makeArtboard({ x: 0, y: 0, width, height }, backgroundColor);

  const queue: any[] = asRoot.children;
  for (const raw of queue) {
    if (!raw || typeof raw !== 'object') continue;
    const { typeName, props, children } = normalize(raw);
    if (!typeName) continue;

    const style = props?.style ?? {};
    const x = Number(props?.x ?? style?.left ?? 0);
    const y = Number(props?.y ?? style?.top ?? 0);
    const w = Number(props?.width ?? style?.width ?? 100);
    const h = Number(props?.height ?? style?.height ?? 100);

    if (typeName === 'View' || typeName === 'Canvas') {
      const fill = (props?.backgroundColor ?? style?.backgroundColor) as string | undefined;
      ab.layers.push(rectLayer({ x, y, width: w, height: h, fill }));
      // push nested children too (one level flatten)
      if (children?.length) {
        for (const c of children) queue.push(c);
      }
    } else if (typeName === 'Text') {
      const fontSize = Number(props?.fontSize ?? style?.fontSize ?? 20);
      const color = (props?.color ?? style?.color ?? '#000000') as string;
      const textAlign = (props?.textAlign ?? style?.textAlign ?? 'left') as 'left' | 'center' | 'right';
      // Text content for React: in props.children; for JSON: child.children
      let textContent = '';
      if (children?.length) {
        textContent = children.map((c: any) => (typeof c === 'string' ? c : '')).join('');
      }
      ab.layers.push(
        textLayer({
          x,
          y,
          width: Math.max(100, String(textContent).length * (fontSize * 0.6)),
          height: fontSize * 1.4,
          text: String(textContent ?? ''),
          fontSize,
          color,
          align: textAlign,
        }),
      );
    } else if (typeName === 'Image') {
      // RN style uses source={{ uri }}; also accept props.src
      const src = props?.src ?? props?.source?.uri;
      ab.layers.push(bitmapLayer({ x, y, width: w, height: h, src }));
    } else {
      // Unknown node; flatten children to continue traversal
      if (children?.length) {
        for (const c of children) queue.push(c);
      }
    }
  }
  return ab;
}

export async function layoutNode(state: any) {
  let tree;
  for (let i = state.messages.length - 1; i >= 0; i--) {
    const m = state.messages[i];
    const content = typeof m?.content === 'string' ? m.content : Array.isArray(m?.content) ? m.content.map((c: any) => c?.text || '').join('\n') : '';
    // JSON block
    const m1 = content.match(/```json\s*([\s\S]*?)```/i);
    if (m1) {
      try { tree = JSON.parse(m1[1].trim()); break; } catch { }
    }
    // JSX (React Native) block
    const m2 = content.match(/```jsx\s*([\s\S]*?)```/i);
    if (!tree && m2) {
      const jsx = m2[1].trim();
      try {
        tree = parseJsxToTree(jsx);
        if (tree) break;
      } catch { }
    }
  }


  const sketchJson = treeToSketch(tree);
  const fabric = sketchToFabric(sketchJson);

  const fabricJson = JSON.stringify(fabric);
  return {
    final_design: fabric,
    messages: [new AIMessage({ content: `Here is your design:\n\`\`\`json\n${fabricJson}\n\`\`\`` })],
  };
}
