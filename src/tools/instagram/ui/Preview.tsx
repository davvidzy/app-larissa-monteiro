import { useEffect, useRef } from "react";
import type { LoadedImage } from "../images";
import type { Layout } from "../layout";
import { drawLayout } from "../render";
import type { ProjectImage, ThemeId } from "../types";

/** Canvas com a arte. `scale` reduz o desenho (miniaturas); a exportação usa escala 1. */
export function Preview({ layout, theme, photo, crop, scale = 0.5, showOverflow = true, className = "", label }: {
  layout: Layout;
  theme: ThemeId;
  photo?: LoadedImage | null;
  crop?: ProjectImage | null;
  scale?: number;
  showOverflow?: boolean;
  className?: string;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    drawLayout(ref.current, layout, theme, {
      scale,
      showOverflow,
      photo: photo && crop ? { source: photo.source, width: photo.width, height: photo.height, crop } : null,
    });
  }, [layout, theme, photo, crop, scale, showOverflow]);
  return <canvas ref={ref} role="img" aria-label={label} className={`block h-auto w-full ${className}`} />;
}
