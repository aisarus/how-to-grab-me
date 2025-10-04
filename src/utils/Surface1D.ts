// 1D Water surface physics simulation

export class Surface1D {
  n: number;
  w: number;
  base: number;
  y: Float32Array;
  v: Float32Array;
  a: Float32Array;
  k: number;
  damp: number;
  spread: number;

  constructor(cols: number, widthCm: number, headspaceCm: number) {
    this.n = cols;
    this.w = widthCm;
    this.base = headspaceCm;
    this.y = new Float32Array(cols).fill(0);
    this.v = new Float32Array(cols).fill(0);
    this.a = new Float32Array(cols).fill(0);
    this.k = 0.035;
    this.damp = 0.988;
    this.spread = 0.25;
  }

  disturb(i: number, power: number) {
    if (i >= 0 && i < this.n) this.v[i] += power;
  }

  step(dt: number) {
    // Apply spring force
    for (let i = 0; i < this.n; i++) {
      const f = -this.k * this.y[i];
      this.a[i] = f;
      this.v[i] += this.a[i] * dt;
      this.v[i] *= this.damp;
    }

    // Spread forces
    const L = new Float32Array(this.n);
    const R = new Float32Array(this.n);
    for (let j = 0; j < 6; j++) {
      for (let i = 0; i < this.n; i++) {
        if (i > 0) {
          const d = this.y[i] - this.y[i - 1];
          L[i - 1] += this.spread * d;
          this.v[i] -= this.spread * d;
        }
        if (i < this.n - 1) {
          const d = this.y[i] - this.y[i + 1];
          R[i + 1] += this.spread * d;
          this.v[i] -= this.spread * d;
        }
      }
      for (let i = 0; i < this.n; i++) {
        if (i > 0) this.y[i - 1] += L[i - 1];
        if (i < this.n - 1) this.y[i + 1] += R[i + 1];
        L[i] = R[i] = 0;
      }
    }

    // Update positions
    for (let i = 0; i < this.n; i++) {
      this.y[i] += this.v[i] * dt;
    }
  }
}
