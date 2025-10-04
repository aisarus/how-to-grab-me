import { useRef, useCallback } from 'react';
import { Rotifer, Tank, Camera } from '@/types/rotifer';
import { Surface1D } from '@/utils/Surface1D';
import { motilityFor, zEqFor, gauss, clamp, SIGMA_Z, Z_MAX, KZ } from '@/utils/motilityModel';

const SIM_BUDGET_MAX = 2400;
const BUMP_RATE = 60;

export function useRotifers(
  tanks: Tank[],
  surfaces: Map<number, Surface1D>,
  camera: Camera,
  threshold: number,
  density: number,
  dofMM: number,
  isFresh: boolean,
  BASE_PX: number
) {
  const poolsRef = useRef<Map<number, Rotifer[]>>(new Map());
  const lastRetargetRef = useRef(0);
  const bumpCarryRef = useRef(0);

  // Initialize pools
  if (poolsRef.current.size === 0) {
    for (const t of tanks) {
      poolsRef.current.set(t.id, []);
    }
  }

  const clearRotifers = useCallback(() => {
    for (const arr of poolsRef.current.values()) {
      arr.length = 0;
    }
  }, []);

  const microscopeCircle = useCallback((canvasWidth: number, canvasHeight: number, DPR: number) => {
    const cx = camera.scrCx;
    const cy = camera.scrCy;
    const rCss = (Math.min(canvasWidth, canvasHeight) * 0.28) / DPR;
    const wc = { x: camera.x, y: camera.y };
    const rWorld = rCss / (camera.zoom * BASE_PX);
    return { cx, cy, rCss, wc, rWorld };
  }, [camera, BASE_PX]);

  const microscopeActive = useCallback(() => camera.zoom >= threshold, [camera.zoom, threshold]);

  const estimateOverlapFraction = useCallback((t: Tank, circ: ReturnType<typeof microscopeCircle>) => {
    const S = 220;
    let hit = 0;
    const srf = surfaces.get(t.id);
    if (!srf) return 0;

    for (let i = 0; i < S; i++) {
      const ang = Math.random() * Math.PI * 2;
      const rad = Math.sqrt(Math.random()) * circ.rWorld;
      const wx = circ.wc.x + rad * Math.cos(ang);
      const wy = circ.wc.y + rad * Math.sin(ang);
      if (wx < t.x || wx > t.x + t.w || wy < t.y || wy > t.y + t.h) continue;
      const idx = Math.max(0, Math.min(srf.n - 1, Math.round(((wx - t.x) / t.w) * (srf.n - 1))));
      const surfYcm = t.y + Math.max(0.5, Math.min(t.h - 1, srf.base + srf.y[idx]));
      if (wy >= surfYcm) hit++;
    }
    return hit / S;
  }, [surfaces]);

  const spawnRotifers = useCallback((tankId: number, count: number, circ: ReturnType<typeof microscopeCircle>) => {
    const t = tanks.find(x => x.id === tankId);
    const srf = surfaces.get(tankId);
    if (!t || !srf) return;

    const arr = poolsRef.current.get(tankId);
    if (!arr) return;

    for (let k = 0; k < count; k++) {
      let tries = 0;
      let wx = 0, wy = 0;
      while (tries++ < 40) {
        const ang = Math.random() * Math.PI * 2;
        const rad = Math.sqrt(Math.random()) * circ.rWorld;
        wx = circ.wc.x + rad * Math.cos(ang);
        wy = circ.wc.y + rad * Math.sin(ang);
        if (wx < t.x || wx > t.x + t.w || wy < t.y || wy > t.y + t.h) continue;
        const idx = Math.max(0, Math.min(srf.n - 1, Math.round(((wx - t.x) / t.w) * (srf.n - 1))));
        const surfYcm = t.y + Math.max(0.5, Math.min(t.h - 1, srf.base + srf.y[idx]));
        if (wy >= surfYcm) break;
      }
      const wz = Math.random() * t.d;
      arr.push({
        x: wx,
        y: wy,
        z: wz,
        vx: gauss() * 0.005,
        vy: gauss() * 0.005,
        vz: gauss() * 0.005,
        theta: Math.random() * Math.PI * 2,
      });
    }
  }, [tanks, surfaces]);

  const retargetPools = useCallback((canvasWidth: number, canvasHeight: number, DPR: number) => {
    if (!microscopeActive()) {
      clearRotifers();
      return;
    }
    const circ = microscopeCircle(canvasWidth, canvasHeight, DPR);
    const areaCircleCm2 = Math.PI * circ.rWorld * circ.rWorld;
    const desired: { id: number; target: number }[] = [];
    let sum = 0;
    for (const t of tanks) {
      const f = estimateOverlapFraction(t, circ);
      const N = density * dofMM * areaCircleCm2 * f / 10;
      const n = Math.max(0, N | 0);
      desired.push({ id: t.id, target: n });
      sum += n;
    }
    const scale = sum > SIM_BUDGET_MAX ? SIM_BUDGET_MAX / sum : 1;
    for (const { id, target } of desired) {
      const arr = poolsRef.current.get(id);
      if (!arr) continue;
      const goal = Math.floor(target * scale);
      if (arr.length < goal) spawnRotifers(id, goal - arr.length, circ);
      else if (arr.length > goal) arr.length = goal;
    }
  }, [tanks, microscopeActive, microscopeCircle, estimateOverlapFraction, density, dofMM, clearRotifers, spawnRotifers]);

  const stepRotifers = useCallback((dt: number, canvasWidth: number, canvasHeight: number, DPR: number, project: (wx: number, wy: number, wz: number) => { x: number; y: number }) => {
    if (!microscopeActive()) {
      clearRotifers();
      return;
    }
    if (performance.now() - lastRetargetRef.current > 350) {
      retargetPools(canvasWidth, canvasHeight, DPR);
      lastRetargetRef.current = performance.now();
    }
    bumpCarryRef.current += BUMP_RATE * dt;

    for (const t of tanks) {
      const arr = poolsRef.current.get(t.id);
      const srf = surfaces.get(t.id);
      if (!arr || !srf) continue;

      const T = t.tmpSensor;
      const S = t.salSensor;
      const { v: Vpref, Dth } = motilityFor(T, S, isFresh);
      const zStar = zEqFor(T, S, t.d, isFresh);

      for (let i = 0; i < arr.length; i++) {
        const r = arr[i];
        r.theta += gauss() * Math.sqrt(2 * Dth * dt);
        r.vx = Vpref * Math.cos(r.theta);
        r.vy = Vpref * Math.sin(r.theta);
        r.x += r.vx * dt;
        r.y += r.vy * dt;
        r.vz = (r.vz || 0) + (zStar - (r.z || t.d * 0.5)) * KZ * dt + SIGMA_Z * Math.sqrt(dt) * gauss();
        r.vz = clamp(r.vz, -Z_MAX, Z_MAX);
        r.z = (r.z || t.d * 0.5) + r.vz * dt;

        if (r.x < t.x + 0.2) {
          r.x = t.x + 0.2;
          r.theta = Math.acos(Math.cos(r.theta)) * (Math.random() < 0.5 ? 1 : -1);
        }
        if (r.x > t.x + t.w - 0.2) {
          r.x = t.x + t.w - 0.2;
          r.theta = Math.PI - r.theta;
        }

        const idx = Math.max(0, Math.min(srf.n - 1, Math.round(((r.x - t.x) / t.w) * (srf.n - 1))));
        const surfYcm = t.y + Math.max(0.5, Math.min(t.h - 1, srf.base + srf.y[idx]));
        const bottom = t.y + t.h - 0.5;
        if (r.y < surfYcm + 0.1) {
          r.y = surfYcm + 0.1;
          r.theta = -r.theta;
        }
        if (r.y > bottom - 0.1) {
          r.y = bottom - 0.1;
          r.theta = -r.theta;
        }
        if (r.z < 0.0) {
          r.z = 0.0;
          r.vz = Math.abs(r.vz) * 0.6;
        }
        if (r.z > t.d) {
          r.z = t.d;
          r.vz = -Math.abs(r.vz) * 0.6;
        }

        // Cull outside microscope
        const s = project(r.x, r.y, r.z || 0);
        const cx = camera.scrCx;
        const cy = camera.scrCy;
        const rCss = (Math.min(canvasWidth, canvasHeight) * 0.28) / DPR;
        const dx = s.x - cx;
        const dy = s.y - cy;
        if (dx * dx + dy * dy > rCss * rCss) {
          arr.splice(i, 1);
          i--;
          continue;
        }

        if (bumpCarryRef.current >= 1) {
          const kicks = Math.floor(bumpCarryRef.current);
          bumpCarryRef.current -= kicks;
          const j = Math.max(0, Math.min(srf.n - 1, idx + (Math.random() < 0.5 ? -1 : 1)));
          srf.disturb(j, (Math.random() - 0.5) * 0.08);
        }
      }
    }
  }, [tanks, surfaces, camera, microscopeActive, clearRotifers, retargetPools, isFresh]);

  return {
    pools: poolsRef.current,
    stepRotifers,
    clearRotifers,
    microscopeActive,
  };
}
