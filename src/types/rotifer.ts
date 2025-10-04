// Core types for the Rotifer Lab simulation

export interface Tank {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  d: number;
  water: number;
  salTarget: number;
  salSensor: number;
  tmpTarget: number;
  tmpSensor: number;
}

export interface Rotifer {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  theta: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  scrCx: number;
  scrCy: number;
}

export interface Species {
  name: string;
  color: [number, number, number];
  freshwater: boolean;
}

export interface Injection {
  tankId: number;
  t0: number;
  x: number;
  yStart: number;
}

export interface SimulationConfig {
  density: number;
  dofMM: number;
  threshold: number;
  microscopeHUD: boolean;
  speciesIdx: number;
}

export interface RandomizerConfig {
  enabled: boolean;
  every: number;
  dS: number;
  dT: number;
}
