export type GraphDisplayMode = 'deg' | 'rad' | 'pi';

export interface ViewportBounds {
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
}

export function getNiceStep(range: number, targetTicks: number = 8): number {
  if (range <= 0 || !Number.isFinite(range)) return 1;
  const roughStep = range / targetTicks;
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalized = roughStep / magnitude; // in [1, 10)
  
  let niceFactor = 1;
  if (normalized < 1.5) niceFactor = 1;
  else if (normalized < 3.5) niceFactor = 2;
  else if (normalized < 7.5) niceFactor = 5;
  else niceFactor = 10;
  
  return niceFactor * magnitude;
}

export function getNiceDegreeStep(range: number, targetTicks: number = 8): number {
  if (range <= 0 || !Number.isFinite(range)) return 45;
  const roughStep = range / targetTicks;
  const degreeSteps = [1, 2, 5, 10, 15, 30, 45, 90, 180, 360, 720];
  let best = degreeSteps[0];
  let minDiff = Math.abs(roughStep - best);
  for (const step of degreeSteps) {
    const diff = Math.abs(roughStep - step);
    if (diff < minDiff) {
      minDiff = diff;
      best = step;
    }
  }
  return best;
}

export function getTickValues(min: number, max: number, mode: GraphDisplayMode): number[] {
  const range = max - min;
  if (range <= 0 || !Number.isFinite(range)) return [];

  if (mode === 'pi') {
    const rangeInPi = range / Math.PI;
    let stepPi = 1;
    if (rangeInPi <= 2) stepPi = 0.25;
    else if (rangeInPi <= 4) stepPi = 0.5;
    else if (rangeInPi <= 10) stepPi = 1;
    else if (rangeInPi <= 25) stepPi = 2;
    else stepPi = 5;
    
    const step = stepPi * Math.PI;
    const ticks: number[] = [];
    let start = Math.ceil(min / step) * step;
    for (let i = start; i <= max + 1e-9; i += step) {
      ticks.push(i);
    }
    return ticks;
  } else if (mode === 'deg') {
    const step = getNiceDegreeStep(range, 8);
    const ticks: number[] = [];
    let start = Math.ceil(min / step) * step;
    for (let i = start; i <= max + 1e-9; i += step) {
      ticks.push(i);
    }
    return ticks;
  } else {
    // Standard decimal ticks using robust nice step
    const step = getNiceStep(range, 8);
    const ticks: number[] = [];
    let start = Math.ceil(min / step) * step;
    for (let i = start; i <= max + 1e-9; i += step) {
      // Fix floating point precision artifacts on ticks (e.g. 0.30000000000000004)
      const rounded = parseFloat(i.toFixed(10));
      ticks.push(rounded);
    }
    return ticks;
  }
}

export function formatPiLabel(val: number): string {
  if (Math.abs(val) < 1e-9) return '0';
  const piMultiples = val / Math.PI;
  
  // Is it roughly an integer?
  if (Math.abs(Math.round(piMultiples) - piMultiples) < 1e-9) {
    const intVal = Math.round(piMultiples);
    if (intVal === 1) return 'π';
    if (intVal === -1) return '-π';
    return `${intVal}π`;
  }
  
  // Is it roughly a half integer?
  const doublePi = piMultiples * 2;
  if (Math.abs(Math.round(doublePi) - doublePi) < 1e-9) {
    const intVal = Math.round(doublePi);
    if (intVal === 1) return 'π/2';
    if (intVal === -1) return '-π/2';
    return `${intVal}π/2`;
  }

  // Fallback
  return parseFloat(val.toFixed(2)).toString();
}

export function getDefaultRange(mode: GraphDisplayMode): { min: number, max: number } {
  if (mode === 'deg') return { min: -360, max: 360 };
  if (mode === 'pi') return { min: -2 * Math.PI, max: 2 * Math.PI };
  return { min: -10, max: 10 };
}

export function convertPixelDeltaToDataDelta(
  dxPx: number, dyPx: number, 
  rectWidth: number, rectHeight: number, 
  xRange: number, yRange: number
): { dXData: number, dYData: number } {
  const dXData = (dxPx / rectWidth) * xRange;
  const dYData = (dyPx / rectHeight) * yRange;
  return { dXData, dYData };
}

export function mathToScreen(
  x: number, y: number,
  bounds: ViewportBounds,
  width: number, height: number
): { xPx: number, yPx: number } {
  const xSpan = bounds.xMax - bounds.xMin;
  const ySpan = bounds.yMax - bounds.yMin;
  const xPx = xSpan === 0 ? 0 : ((x - bounds.xMin) / xSpan) * width;
  const yPx = ySpan === 0 ? 0 : height - ((y - bounds.yMin) / ySpan) * height;
  return { xPx, yPx };
}

export function screenToMath(
  xPx: number, yPx: number,
  bounds: ViewportBounds,
  width: number, height: number
): { x: number, y: number } {
  const xSpan = bounds.xMax - bounds.xMin;
  const ySpan = bounds.yMax - bounds.yMin;
  const x = width === 0 ? bounds.xMin : bounds.xMin + (xPx / width) * xSpan;
  const y = height === 0 ? bounds.yMin : bounds.yMin + ((height - yPx) / height) * ySpan;
  return { x, y };
}

