// Rotifer motility model based on temperature and salinity

const Q10 = 2.0;
const H_MAX = 0.06;
const Z_MAX = 0.04;
const KZ = 0.8;
export const SIGMA_Z = 0.008;

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export function gauss(): number {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export function motilityFor(T: number, S: number, isFresh: boolean) {
  let v = 0.02 * Math.pow(Q10, (T - 22.5) / 10);
  const g = Math.exp(-0.5 * Math.pow(((isFresh ? 0 : S) - 10) / 6, 2));
  v *= 0.55 + 0.45 * g;
  v = clamp(v, 0.006, H_MAX);
  const tau = 0.8 * (0.7 + 0.6 * g);
  const Dth = 1 / (tau + 1e-6);
  return { v, tau, Dth, g };
}

export function zEqFor(T: number, S: number, depthCm: number, isFresh: boolean): number {
  const bT = clamp((T - 22.5) / 5, -1, 1);
  const bS = clamp(((isFresh ? 0 : S) - 10) / 15, -1, 1);
  let z = depthCm * (0.5 + 0.25 * bT + 0.1 * bS);
  return clamp(z, 0.05 * depthCm, 0.95 * depthCm);
}

export { Z_MAX, KZ };
