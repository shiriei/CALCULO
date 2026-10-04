import { AppStore } from './src/main/store';
const store = new AppStore();
console.log("Initial history:", store.getHistory());
store.addHistory({ expression: '1+1', result: '2', angleMode: 'deg' });
console.log("After add:", store.getHistory());
