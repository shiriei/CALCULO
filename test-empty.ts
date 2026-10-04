import { MatrixEngine } from './src/renderer/engine/advanced/matrixEngine';
const m = new MatrixEngine();
console.log('det []', m.determinant([]));
console.log('inv []', m.inverse([]));
console.log('add []', m.add([], []));
