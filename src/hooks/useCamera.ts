import { useState, useCallback, useRef, useEffect } from 'react';
import { Camera } from '@/types/rotifer';

const BASE_PX = 10;
const MAX_ZOOM = 36;

interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  w: number;
  h: number;
}

export function useCamera(worldBounds: WorldBounds, canvasRef: React.RefObject<HTMLCanvasElement>) {
  const [camera, setCamera] = useState<Camera>({
    x: worldBounds.minX + worldBounds.w / 2,
    y: worldBounds.minY + worldBounds.h / 2,
    zoom: 0.4,
    scrCx: 0,
    scrCy: 0,
  });

  const panRef = useRef({ active: false });
  const mouseRef = useRef({ x: 0, y: 0 });

  const safeRectPixels = useCallback(() => {
    if (!canvasRef.current) return { left: 12, right: 800, top: 12, bottom: 600, w: 788, h: 588 };
    const w = canvasRef.current.width / (window.devicePixelRatio || 1);
    const h = canvasRef.current.height / (window.devicePixelRatio || 1);
    const left = 300;
    const right = w - 400;
    const top = 12;
    const bottom = h - 12;
    return { left, right, top, bottom, w: Math.max(10, right - left), h: Math.max(10, bottom - top) };
  }, [canvasRef]);

  const updateScreenCenter = useCallback(() => {
    const s = safeRectPixels();
    setCamera(prev => ({ ...prev, scrCx: s.left + s.w / 2, scrCy: s.top + s.h / 2 }));
  }, [safeRectPixels]);

  const fitAll = useCallback(() => {
    const pad = 20;
    const totalW = worldBounds.w + pad * 2;
    const totalH = worldBounds.h + pad * 2;
    const s = safeRectPixels();
    const scaleX = s.w / (totalW * BASE_PX);
    const scaleY = s.h / (totalH * BASE_PX);
    const zoom = Math.max(0.05, Math.min(MAX_ZOOM, Math.min(scaleX, scaleY)));
    setCamera({
      x: worldBounds.minX + worldBounds.w / 2,
      y: worldBounds.minY + worldBounds.h / 2,
      zoom,
      scrCx: s.left + s.w / 2,
      scrCy: s.top + s.h / 2,
    });
  }, [worldBounds, safeRectPixels]);

  const worldToScreen = useCallback((wx: number, wy: number) => {
    const sx = (wx - camera.x) * camera.zoom * BASE_PX + camera.scrCx;
    const sy = (wy - camera.y) * camera.zoom * BASE_PX + camera.scrCy;
    return { x: sx, y: sy };
  }, [camera]);

  const screenToWorld = useCallback((sx: number, sy: number) => {
    const wx = (sx - camera.scrCx) / (camera.zoom * BASE_PX) + camera.x;
    const wy = (sy - camera.scrCy) / (camera.zoom * BASE_PX) + camera.y;
    return { x: wx, y: wy };
  }, [camera]);

  const zoomAt = useCallback((factor: number, mx: number, my: number) => {
    const before = screenToWorld(mx, my);
    const newZoom = Math.max(0.05, Math.min(MAX_ZOOM, camera.zoom * factor));
    const after = {
      x: (mx - camera.scrCx) / (newZoom * BASE_PX) + camera.x,
      y: (my - camera.scrCy) / (newZoom * BASE_PX) + camera.y,
    };
    setCamera(prev => ({
      ...prev,
      zoom: newZoom,
      x: prev.x + before.x - after.x,
      y: prev.y + before.y - after.y,
    }));
  }, [camera, screenToWorld]);

  const focusTank = useCallback((tankX: number, tankY: number, tankW: number, tankH: number) => {
    const pad = 6;
    const s = safeRectPixels();
    const sx = s.w / ((tankW + pad * 2) * BASE_PX);
    const sy = s.h / ((tankH + pad * 2) * BASE_PX);
    setCamera(prev => ({
      ...prev,
      x: tankX + tankW / 2,
      y: tankY + tankH / 2,
      zoom: Math.min(sx, sy),
    }));
  }, [safeRectPixels]);

  useEffect(() => {
    updateScreenCenter();
  }, [updateScreenCenter]);

  return {
    camera,
    setCamera,
    worldToScreen,
    screenToWorld,
    zoomAt,
    fitAll,
    focusTank,
    panRef,
    mouseRef,
    updateScreenCenter,
  };
}
