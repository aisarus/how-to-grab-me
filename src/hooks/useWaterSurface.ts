import { useRef, useEffect } from 'react';
import { Surface1D } from '@/utils/Surface1D';
import { Tank } from '@/types/rotifer';

const COLS = 240;

export function useWaterSurface(tanks: Tank[]) {
  const surfacesRef = useRef<Map<number, Surface1D>>(new Map());

  useEffect(() => {
    const surfaces = new Map<number, Surface1D>();
    for (const t of tanks) {
      surfaces.set(t.id, new Surface1D(COLS, t.w, t.water));
    }
    surfacesRef.current = surfaces;
  }, [tanks]);

  const stepSurfaces = (dt: number) => {
    for (const surface of surfacesRef.current.values()) {
      surface.step(dt);
    }
  };

  const disturbSurface = (tankId: number, index: number, power: number) => {
    const surface = surfacesRef.current.get(tankId);
    if (surface) {
      surface.disturb(index, power);
    }
  };

  return {
    surfaces: surfacesRef.current,
    stepSurfaces,
    disturbSurface,
  };
}
