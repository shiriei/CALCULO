import { GraphingEngine } from './src/renderer/engine/graphingEngine';

const engine = new GraphingEngine();
const func = { id: '1', expression: 'sin(x)', color: 'red' };

console.log("RAD MODE, -10 to 10:");
let resRad = engine.sampleFunction(func, -10, 10, 10, 'rad');
console.log(resRad.segments[0].map(p => p.y.toFixed(3)).join(', '));

console.log("DEG MODE, -10 to 10:");
let resDeg = engine.sampleFunction(func, -10, 10, 10, 'deg');
console.log(resDeg.segments[0].map(p => p.y.toFixed(3)).join(', '));

console.log("DEG MODE, -360 to 360:");
let resDegWide = engine.sampleFunction(func, -360, 360, 10, 'deg');
console.log(resDegWide.segments[0].map(p => p.y.toFixed(3)).join(', '));
