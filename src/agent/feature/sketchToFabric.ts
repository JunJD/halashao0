import { FileFormat1 as FileFormat } from '@sketch-hq/sketch-file-format-ts';

// Helper to convert Sketch color object to CSS string
const colorToCss = (color: any): string => {
    if (!color) return 'transparent';
    const r = Math.round(color.red * 255);
    const g = Math.round(color.green * 255);
    const b = Math.round(color.blue * 255);
    return `rgba(${r}, ${g}, ${b}, ${color.alpha})`;
};

// Interface for inherited styles
interface StyleContext {
    // allow string color or Fabric gradient object
    fill?: any;
    stroke?: string;
    strokeWidth?: number;
    opacity?: number;
    shadow?: { color: string; blur: number; offsetX: number; offsetY: number } | null;
}

// Parse a Sketch point string like "{0.5, 1}" -> [0.5, 1]
const parseSketchPoint = (str: string): [number, number] => {
    if (!str) return [0, 0];
    const m = /\{\s*([\d.\-]+)\s*,\s*([\d.\-]+)\s*\}/.exec(str);
    if (!m) return [0, 0];
    return [parseFloat(m[1]), parseFloat(m[2])];
};

// Extract image width/height from a base64 data URL (PNG only best-effort)
const getPngSizeFromDataUrl = (dataUrl?: string): { width: number; height: number } | null => {
    if (!dataUrl || !dataUrl.startsWith('data:image/png;base64,')) return null;
    try {
        const base64 = dataUrl.split(',')[1];
        const buf = Buffer.from(base64, 'base64');
        // PNG signature length is 8 bytes; IHDR chunk starts at byte 8 + 4 (length) + 4 (type) = 16
        if (buf.length < 24) return null;
        // Verify PNG signature
        if (buf[0] !== 0x89 || buf[1] !== 0x50 || buf[2] !== 0x4e || buf[3] !== 0x47) return null;
        const width = buf.readUInt32BE(16);
        const height = buf.readUInt32BE(20);
        return { width, height };
    } catch (e) {
        return null;
    }
};

// Recursive function to flatten layers into absolute positioned Fabric objects
const flattenLayer = (
    layer: any,
    offsetX: number,
    offsetY: number,
    inheritedStyle: StyleContext = {},
    parentWidth: number = 0, // New parameter: width of the immediate parent for text alignment checks
): any[] => {
    const currentX = offsetX + layer.frame.x;
    const currentY = offsetY + layer.frame.y;

    const common = {
        left: currentX,
        top: currentY,
        width: layer.frame.width,
        height: layer.frame.height,
        originX: 'left',
        originY: 'top',
        opacity: inheritedStyle.opacity !== undefined ? inheritedStyle.opacity : 1,
    };

    // --- 1. Handle ShapeGroup (Wrapper for styles) ---
    if (layer._class === 'shapeGroup') {
        let newStyle: StyleContext = { ...inheritedStyle };

        if (layer.style) {
            // Fill
            if (layer.style.fills && layer.style.fills.length > 0) {
                const activeFills = layer.style.fills.filter((f: any) => f.isEnabled);
                if (activeFills.length > 0) {
                    const lastFill = activeFills[activeFills.length - 1];
                    // Pattern fill with image
                    if (lastFill.fillType === FileFormat.FillType.Pattern && lastFill.image && lastFill.image.data && lastFill.image.data._data) {
                        const containerW = layer.frame.width;
                        const containerH = layer.frame.height;

                        // Try to get intrinsic image size from data URL
                        const dataUrl: string = lastFill.image.data._data;
                        const size = getPngSizeFromDataUrl(dataUrl);

                        if (size) {
                            const imgW = size.width;
                            const imgH = size.height;
                            // Map Sketch patternFillType to behaviour
                            const pft = lastFill.patternFillType;
                            const tile = pft === FileFormat.PatternFillType.Tile; // 0 repeat
                            const cover = pft === FileFormat.PatternFillType.Fill; // 1
                            const contain = pft === FileFormat.PatternFillType.Fit; // 3
                            const stretch = pft === FileFormat.PatternFillType.Stretch; // 2
                            let cropX = 0;
                            let cropY = 0;
                            let cropW = imgW;
                            let cropH = imgH;
                            let scaleX = 1;
                            let scaleY = 1;

                            if (tile) {
                                // Use Fabric pattern fill on a rect covering the container
                                // Scale pattern so tiles are a reasonable size (~100px wide)
                                const targetTileWidth = Math.min(128, Math.max(48, Math.round(containerW / 4)));
                                const scale = Math.max(0.01, targetTileWidth / imgW);
                                const rect: any = {
                                    type: 'rect',
                                    left: currentX,
                                    top: currentY,
                                    width: containerW,
                                    height: containerH,
                                    originX: 'left',
                                    originY: 'top',
                                    opacity: newStyle.opacity !== undefined ? newStyle.opacity : 1,
                                    fill: {
                                        type: 'pattern',
                                        source: dataUrl,
                                        repeat: 'repeat',
                                        patternTransform: [scale, 0, 0, scale, 0, 0],
                                    },
                                    stroke: newStyle.stroke,
                                    strokeWidth: newStyle.strokeWidth || 0,
                                };
                                return [rect];
                            } else if (cover) {
                                const scale = Math.max(containerW / imgW, containerH / imgH);
                                cropW = Math.round(containerW / scale);
                                cropH = Math.round(containerH / scale);
                                cropX = Math.max(0, Math.round((imgW - cropW) / 2));
                                cropY = Math.max(0, Math.round((imgH - cropH) / 2));
                                scaleX = containerW / cropW;
                                scaleY = containerH / cropH;
                            } else if (contain) {
                                const scale = Math.min(containerW / imgW, containerH / imgH);
                                cropW = imgW;
                                cropH = imgH;
                                scaleX = scale;
                                scaleY = scale;
                            } else if (stretch) {
                                cropW = imgW;
                                cropH = imgH;
                                scaleX = containerW / imgW;
                                scaleY = containerH / imgH;
                            }

                            return [{
                                type: 'image',
                                left: currentX,
                                top: currentY,
                                originX: 'left',
                                originY: 'top',
                                src: dataUrl,
                                width: cropW,
                                height: cropH,
                                cropX,
                                cropY,
                                scaleX,
                                scaleY,
                                opacity: newStyle.opacity !== undefined ? newStyle.opacity : 1,
                            }];
                        }
                    }
                    // Gradient fill
                    if (lastFill.fillType === FileFormat.FillType.Gradient && lastFill.gradient) {
                        const g = lastFill.gradient;
                        const [fx, fy] = parseSketchPoint(g.from);
                        const [tx, ty] = parseSketchPoint(g.to);
                        const grad = {
                            type: g.gradientType === FileFormat.GradientType.Radial ? 'radial' : 'linear',
                            gradientUnits: 'pixels',
                            coords:
                                g.gradientType === FileFormat.GradientType.Radial
                                    ? {
                                        x1: 0 + fx * layer.frame.width,
                                        y1: 0 + fy * layer.frame.height,
                                        r1: 0,
                                        x2: 0 + tx * layer.frame.width,
                                        y2: 0 + ty * layer.frame.height,
                                        r2: Math.max(layer.frame.width, layer.frame.height) / 2,
                                    }
                                    : {
                                        x1: 0 + fx * layer.frame.width,
                                        y1: 0 + fy * layer.frame.height,
                                        x2: 0 + tx * layer.frame.width,
                                        y2: 0 + ty * layer.frame.height,
                                    },
                            colorStops: (g.stops || []).map((s: any) => ({
                                offset: s.position,
                                color: colorToCss(s.color),
                                opacity: s.color ? s.color.alpha : 1,
                            })),
                        } as any;
                        newStyle.fill = grad;
                    }
                    // Otherwise, treat as solid color fill
                    else if (lastFill.color) {
                        newStyle.fill = colorToCss(lastFill.color);
                    }
                }
            }

            // Border
            if (layer.style.borders && layer.style.borders.length > 0) {
                const activeBorders = layer.style.borders.filter((b: any) => b.isEnabled);
                if (activeBorders.length > 0) {
                    newStyle.stroke = colorToCss(activeBorders[activeBorders.length - 1].color);
                    newStyle.strokeWidth = activeBorders[activeBorders.length - 1].thickness;
                }
            }

            // Opacity
            if (layer.style.contextSettings) {
                newStyle.opacity = (newStyle.opacity || 1) * layer.style.contextSettings.opacity;
            }

            // Shadow (drop shadow only)
            if (layer.style.shadows && layer.style.shadows.length > 0) {
                const activeShadows = layer.style.shadows.filter((s: any) => s.isEnabled);
                if (activeShadows.length > 0) {
                    const sh = activeShadows[activeShadows.length - 1];
                    newStyle.shadow = {
                        color: colorToCss(sh.color),
                        blur: sh.blurRadius || 0,
                        offsetX: (sh.offset?.x) || sh.offsetX || 0,
                        offsetY: (sh.offset?.y) || sh.offsetY || 0,
                    };
                }
            }
        }

        let childrenObjects = (layer.layers || []).flatMap((child: any) =>
            flattenLayer(child, currentX, currentY, newStyle, layer.frame.width), // Pass shapeGroup's width as parentWidth
        );

        // Apply clipPath if this shapeGroup is marked as clipping mask (e.g., overflow: hidden)
        if (layer.hasClippingMask) {
            let radius = 0;
            const rectChild = (layer.layers || []).find((l: any) => l._class === 'rectangle');
            if (rectChild) {
                if (typeof rectChild.fixedRadius === 'number') radius = rectChild.fixedRadius;
                else if (rectChild.points && rectChild.points.length > 0) {
                    const r = rectChild.points[0].cornerRadius;
                    if (typeof r === 'number') radius = r;
                }
            }
            const clipRect = {
                type: 'rect',
                left: currentX,
                top: currentY,
                width: layer.frame.width,
                height: layer.frame.height,
                rx: radius,
                ry: radius,
                absolutePositioned: true,
            } as any;
            childrenObjects.forEach((obj: any) => {
                obj.clipPath = clipRect;
            });
        }

        return childrenObjects;
    }

    // --- 2. Handle Group (Container) ---
    if (layer._class === 'group' || (layer._class === 'artboard')) {
        let newStyle: StyleContext = { ...inheritedStyle };
        if (layer.style?.contextSettings) {
            newStyle.opacity = (newStyle.opacity || 1) * layer.style.contextSettings.opacity;
        }

        const out: any[] = [];
        let activeClip: any = null;
        const children = layer.layers || [];
        for (const element of children) {
            const child = element;

            // If this child is a shapeGroup with hasClippingMask, compute a clipPath
            if (child?._class === 'shapeGroup' && child.hasClippingMask) {
                // Derive corner radius if possible from its rectangle child
                let radius = 0;
                const rectChild = (child.layers || []).find((l: any) => l._class === 'rectangle');
                if (rectChild) {
                    if (typeof rectChild.fixedRadius === 'number') radius = rectChild.fixedRadius;
                    else if (rectChild.points && rectChild.points.length > 0) {
                        const r = rectChild.points[0].cornerRadius;
                        if (typeof r === 'number') radius = r;
                    }
                }
                activeClip = {
                    type: 'rect',
                    left: currentX + child.frame.x,
                    top: currentY + child.frame.y,
                    width: child.frame.width,
                    height: child.frame.height,
                    rx: radius,
                    ry: radius,
                    absolutePositioned: true,
                } as any;

                // Still render the mask layer itself (visible background etc)
                const maskObjs = flattenLayer(child, currentX, currentY, newStyle, layer.frame.width);
                out.push(...maskObjs);
                continue;
            }

            const objs = flattenLayer(child, currentX, currentY, newStyle, layer.frame.width);
            if (activeClip) {
                objs.forEach((o: any) => (o.clipPath = activeClip));
            }
            out.push(...objs);
        }

        return out;
    }

    // --- 3. Handle Shapes (Rect, Oval) ---
    if (layer._class === 'rectangle' || layer._class === 'oval') {
        let { fill } = inheritedStyle;
        // Fallback to own style if not inherited
        if (!fill && layer.style && layer.style.fills) {
            const activeFills = layer.style.fills.filter((f: any) => f.isEnabled);
            if (activeFills.length > 0) {
                const lastFill = activeFills[activeFills.length - 1];
                if (lastFill.fillType === FileFormat.FillType.Gradient && lastFill.gradient) {
                    const g = lastFill.gradient;
                    const [fx, fy] = parseSketchPoint(g.from);
                    const [tx, ty] = parseSketchPoint(g.to);
                    fill = {
                        type: g.gradientType === FileFormat.GradientType.Radial ? 'radial' : 'linear',
                        gradientUnits: 'pixels',
                        coords:
                            g.gradientType === FileFormat.GradientType.Radial
                                ? {
                                    x1: 0 + fx * layer.frame.width,
                                    y1: 0 + fy * layer.frame.height,
                                    r1: 0,
                                    x2: 0 + tx * layer.frame.width,
                                    y2: 0 + ty * layer.frame.height,
                                    r2: Math.max(layer.frame.width, layer.frame.height) / 2,
                                }
                                : { x1: fx * layer.frame.width, y1: fy * layer.frame.height, x2: tx * layer.frame.width, y2: ty * layer.frame.height },
                        colorStops: (g.stops || []).map((s: any) => ({ offset: s.position, color: colorToCss(s.color), opacity: s.color ? s.color.alpha : 1 })),
                    } as any;
                } else if (lastFill.color) {
                    fill = colorToCss(lastFill.color);
                }
            }
        }
        if (!fill) fill = 'transparent'; // Default to transparent if no fill found

        let { stroke } = inheritedStyle;
        let strokeWidth = inheritedStyle.strokeWidth || 0;
        if (!stroke && layer.style && layer.style.borders) {
            const activeBorders = layer.style.borders.filter((b: any) => b.isEnabled);
            if (activeBorders.length > 0) {
                stroke = colorToCss(activeBorders[activeBorders.length - 1].color);
                strokeWidth = activeBorders[activeBorders.length - 1].thickness;
            }
        }

        const type = layer._class === 'oval' ? 'ellipse' : 'rect';

        const obj: any = {
            type,
            ...common,
            fill,
            stroke,
            strokeWidth,
        };

        if (type === 'ellipse') {
            obj.rx = layer.frame.width / 2;
            obj.ry = layer.frame.height / 2;
        } else if (type === 'rect') {
            // Handle Border Radius
            // 1. fixedRadius (uniform)
            if (layer.fixedRadius) {
                obj.rx = layer.fixedRadius;
                obj.ry = layer.fixedRadius;
            }
            // 2. points (individual) - simple approximation using the first point's radius
            else if (layer.points && layer.points.length > 0) {
                // Check if any point has a curve/radius
                const firstRadius = layer.points[0].cornerRadius;
                if (firstRadius > 0) {
                    obj.rx = firstRadius;
                    obj.ry = firstRadius;
                }
            }
        }

        if (inheritedStyle.shadow) {
            (obj as any).shadow = inheritedStyle.shadow;
        }
        return [obj];
    }

    // --- 4. Handle Text ---
    if (layer._class === 'text') {
        const str: string = layer.attributedString.string;
        const firstRun = layer.attributedString.attributes[0];
        const attrs = firstRun.attributes;
        const font = attrs.MSAttributedStringFontAttribute.attributes;
        const color = attrs.MSAttributedStringColorAttribute;
        const para = attrs.paragraphStyle || {};

        // Sketch Align Map: 0=left, 2=center, 1=right, 3=justify
        let textAlign = 'left';
        if (para.alignment === 2) textAlign = 'center';
        if (para.alignment === 1) textAlign = 'right';
        if (para.alignment === 3) textAlign = 'justify';

        // Disable heuristic centering as it causes issues with left-aligned text in full-width containers
        /*
        const textFrameLeft = layer.frame.x;
        const textFrameWidth = layer.frame.width;
        const parentCenter = parentWidth / 2;
        const textCenter = textFrameLeft + textFrameWidth / 2;
        const tolerance = 2;
  
        if (Math.abs(textCenter - parentCenter) < tolerance) {
            textAlign = 'center';
        }
        */

        // Font parsing for Bold/Italic
        let fontFamily = font.name || 'Arial';
        let fontWeight = 'normal';
        let fontStyle = 'normal';
        if (fontFamily.endsWith('-Bold')) {
            fontWeight = 'bold';
            fontFamily = fontFamily.replace('-Bold', '');
        }
        if (fontFamily.endsWith('-Italic')) {
            fontStyle = 'italic';
            fontFamily = fontFamily.replace('-Italic', '');
        }
        const textObj: any = {
            type: 'textbox',
            ...common,
            text: str,
            fill: color ? colorToCss(color) : '#000000',
            fontSize: font.size,
            fontFamily: fontFamily,
            fontWeight: fontWeight,
            fontStyle: fontStyle,
            textAlign,
            splitByGrapheme: false,
        };

        if (inheritedStyle.shadow) {
            textObj.shadow = inheritedStyle.shadow;
        }

        // Multi-run styling: map Sketch attributedString runs to Fabric Textbox styles
        try {
            const runs = layer.attributedString.attributes as Array<{
                location: number; length: number; attributes: any;
            }>;
            if (runs && runs.length > 1) {
                // Build line ranges based on explicit newlines only
                const lineStarts: number[] = [0];
                for (let i = 0; i < str.length; i++) {
                    if (str[i] === '\n') lineStarts.push(i + 1);
                }
                const lineEnds: number[] = [];
                for (let i = 0; i < lineStarts.length; i++) {
                    const start = lineStarts[i];
                    const end = i + 1 < lineStarts.length ? lineStarts[i + 1] - 1 : str.length;
                    lineEnds.push(end);
                }
                const findLineChar = (g: number) => {
                    // find last lineStart <= g
                    let line = 0;
                    for (let i = 0; i < lineStarts.length; i++) {
                        if (lineStarts[i] <= g) line = i; else break;
                    }
                    const char = g - lineStarts[line];
                    return { line, char };
                };

                const styles: any = {};
                for (const r of runs) {
                    const a = r.attributes;
                    const f = a.MSAttributedStringFontAttribute.attributes;
                    const c = a.MSAttributedStringColorAttribute;
                    let ff = f.name || fontFamily;
                    let fw = 'normal';
                    let fs = 'normal';
                    if (ff.endsWith('-Bold')) { fw = 'bold'; ff = ff.replace('-Bold', ''); }
                    if (ff.endsWith('-Italic')) { fs = 'italic'; ff = ff.replace('-Italic', ''); }
                    const styleChunk: any = {
                        fill: c ? colorToCss(c) : undefined,
                        fontSize: f.size,
                        fontFamily: ff,
                        fontWeight: fw,
                        fontStyle: fs,
                    };

                    const start = r.location;
                    const end = r.location + r.length; // exclusive
                    for (let g = start; g < end; g++) {
                        const { line, char } = findLineChar(g);
                        if (!styles[line]) styles[line] = {};
                        styles[line][char] = styleChunk;
                    }
                }

                // Only attach if we placed any styles and there are explicit newlines or single line
                if (Object.keys(styles).length > 0) {
                    textObj.styles = styles;
                }
            }
        } catch (e) {
            // ignore, fallback to single-style textbox
        }
        return [textObj];
    }

    // --- 5. Handle ShapePath (convert to polygon/polyline) ---
    if (layer._class === 'shapePath') {
        const isClosed = !!layer.isClosed;
        const pts = (layer.points || []).map((p: any) => parseSketchPoint(p.point));
        // Convert to absolute canvas points
        const abs = pts.map(([nx, ny]: [number, number]) => ({
            x: currentX + nx * layer.frame.width,
            y: currentY + ny * layer.frame.height,
        }));
        if (abs.length === 0) return [];
        const minX = Math.min(...abs.map((p: any) => p.x));
        const minY = Math.min(...abs.map((p: any) => p.y));
        const rel = abs.map((p: any) => ({ x: p.x - minX, y: p.y - minY }));

        const obj: any = {
            type: isClosed ? 'polygon' : 'polyline',
            left: minX,
            top: minY,
            originX: 'left',
            originY: 'top',
            points: rel,
            opacity: inheritedStyle.opacity !== undefined ? inheritedStyle.opacity : 1,
            fill: isClosed ? (inheritedStyle.fill || 'transparent') : 'transparent',
            stroke: inheritedStyle.stroke,
            strokeWidth: inheritedStyle.strokeWidth || 0,
        };
        if (inheritedStyle.shadow) obj.shadow = inheritedStyle.shadow;
        return [obj];
    }

    // --- 5. Handle Bitmap (Image) ---
    if (layer._class === 'bitmap') {
        // In this demo, we don't have real image data extraction (requires unzipping .sketch usually).
        // But we can render a placeholder rect with 'image' label.
        const imgRect: any = {
            type: 'rect',
            ...common,
            fill: '#eeeeee', // Placeholder gray
            stroke: '#999999',
            strokeWidth: 1,
        };
        if (inheritedStyle.shadow) imgRect.shadow = inheritedStyle.shadow;
        return [imgRect, {
            type: 'text',
            left: currentX + 5,
            top: currentY + 5,
            text: 'IMAGE',
            fontSize: 10,
            fill: '#666',
        }];
    }

    // Fallback: check children
    if (layer.layers) {
        return layer.layers.flatMap((child: any) =>
            flattenLayer(child, currentX, currentY, inheritedStyle, layer.frame.width), // Pass current layer's width as parentWidth
        );
    }

    return [];
};

export const sketchToFabric = (sketchJson: any) => {
    let width = 800;
    let height = 600;
    let backgroundColor = '#ffffff';
    let objects: any[] = [];

    if (sketchJson._class === 'artboard') {
        width = sketchJson.frame.width;
        height = sketchJson.frame.height;
        if (sketchJson.backgroundColor && sketchJson.hasBackgroundColor) {
            backgroundColor = colorToCss(sketchJson.backgroundColor);
        }
        objects = (sketchJson.layers || []).flatMap((child: any) => flattenLayer(child, 0, 0, {}, width)); // Pass artboard width
    } else {
        objects = flattenLayer(sketchJson, 0, 0, {}, width); // Assume default width if not artboard
    }

    // Auto-calc height based on content bottom
    const calcBottom = (obj: any): number => {
        const top = typeof obj.top === 'number' ? obj.top : 0;
        if (typeof obj.height === 'number') return top + obj.height;
        if (obj.points && Array.isArray(obj.points) && obj.points.length > 0) {
            const maxY = Math.max(...obj.points.map((p: any) => (typeof p.y === 'number' ? p.y : 0)));
            return top + maxY;
        }
        return top;
    };
    const contentBottom = Math.max(0, ...objects.map(calcBottom));
    // add small padding to avoid clipping
    const autoHeight = Math.ceil(contentBottom + 24);

    return {
        version: '4.0.0',
        canvasWidth: width,
        canvasHeight: autoHeight,
        backgroundColor,
        objects,
    };
};
