import { PlatformBridge, TextNode, TextStyle } from '../../../src/types';
import * as fs from 'node:fs';
import * as path from 'node:path';
import { createCanvas } from 'canvas';

const bridge: PlatformBridge = {
  createStringMeasurer: (textNodes: TextNode[], maxWidth: number) => {
    const style = ((textNodes[0]?.textStyles) || {});
    const fontSize = (style as any).fontSize || 16;
    const fontFamily = (style as any).fontFamily || 'Arial';
    const fontWeight = (style as any).fontWeight || 'normal';
    const fontStyle = (style as any).fontStyle || 'normal';
    const letterSpacing = (style as any).letterSpacing || 0;
    const lineHeight = (style as any).lineHeight === undefined ? fontSize : (style as any).lineHeight;

    // Setup Canvas context for measurement
    const canvas = createCanvas(1, 1);
    const ctx = canvas.getContext('2d');
    ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${fontFamily}`.trim();

    const text = textNodes.map((n) => n.content).join('');
    const paragraphs = text.split(/\n/);

    const measureToken = (s: string) => {
      // Base glyph width
      const base = ctx.measureText(s).width;
      // letter spacing applies between glyphs
      const ls = Math.max(0, s.length - 1) * letterSpacing;
      return base + ls;
    };

    const spaceWidth = measureToken(' ');
    // If maxWidth is 0/undefined (unconstrained), allow a very large line width to avoid unintended wrapping
    const available = maxWidth && maxWidth > 0 ? maxWidth : 100000;

    let lines = 0;
    let maxLineWidth = 0;

    for (const para of paragraphs) {
      if (para.length === 0) {
        // blank line
        lines += 1;
        continue;
      }

      const words = para.split(/(\s+)/).filter((t) => t.length > 0);
      let currentWidth = 0;
      let hasToken = false;

      const flushLine = () => {
        lines += 1;
        if (currentWidth > maxLineWidth) maxLineWidth = currentWidth;
        currentWidth = 0;
        hasToken = false;
      };

      for (const token of words) {
        const isSpace = /^\s+$/.test(token);
        const w = isSpace ? spaceWidth : measureToken(token);

        if (!hasToken) {
          // first token in line: accept even if exceeds
          currentWidth = Math.min(w, available);
          hasToken = true;
          continue;
        }

        if (currentWidth + w <= available) {
          currentWidth += w;
        } else {
          // wrap
          flushLine();
          // start new line with this token
          currentWidth = Math.min(w, available);
          hasToken = true;
        }
      }

      // flush last line for this paragraph
      if (hasToken) flushLine();
    }

    return {
      // Width: keep within constraint for Yoga
      width: Math.min(available, Math.max(1, Math.round(maxLineWidth))),
      height: Math.max(lineHeight, lines * lineHeight),
    };
  },
  findFontName: (style: TextStyle) => {
    return style.fontFamily || 'Arial';
  },
  makeImageDataFromUrl: (url?: string) => {
    if (!url) {
      return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    }
    // If it's already a data URI, return as-is
    if (url.startsWith('data:')) {
      return url;
    }
    // Try local filesystem path resolution for demo
    try {
      let abs: string | null = null;
      if (url.startsWith('/')) {
        // root of repo (../../.. from examples/fabric-demo/src)
        abs = path.resolve(__dirname, `..${path.sep}..${path.sep}..${url}`);
      } else {
        // relative to this example src directory
        abs = path.resolve(__dirname, url);
      }
      if (fs.existsSync(abs)) {
        const ext = path.extname(abs).toLowerCase();
        const mime = ext === '.png' ? 'image/png' : ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' : ext === '.gif' ? 'image/gif' : 'application/octet-stream';
        const buf = fs.readFileSync(abs);
        return `data:${mime};base64,${buf.toString('base64')}`;
      }
    } catch (e) {
      // Fall back to placeholder
    }
    // Fallback tiny transparent gif
    return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
  },
};

export default bridge;
