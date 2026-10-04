export type GraphDisplayMode = 'deg' | 'rad' | 'pi';

export function getTickValues(min: number, max: number, mode: GraphDisplayMode): number[] {
  if (mode === 'pi') {
    // For pi multiples, we want steps of pi/2, pi, or 2pi depending on the range
    const range = max - min;
    const rangeInPi = range / Math.PI;
    
    let stepPi = 1;
    if (rangeInPi <= 4) stepPi = 0.5; // pi/2 steps
    else if (rangeInPi > 20) stepPi = 2; // 2pi steps
    else if (rangeInPi > 100) stepPi = 10;
    
    const step = stepPi * Math.PI;
    const ticks = [];
    let start = Math.ceil(min / step) * step;
    
    // Add a tiny epsilon to handle floating point issues with loop termination
    for (let i = start; i <= max + 1e-9; i += step) {
      ticks.push(i);
    }
    return ticks;
  } else {
    // Standard decimal ticks
    const range = max - min;
    const step = Math.pow(10, Math.floor(Math.log10(range)) - 1) * 2;
    const ticks = [];
    let start = Math.ceil(min / step) * step;
    for (let i = start; i <= max + 1e-9; i += step) {
      ticks.push(i);
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
