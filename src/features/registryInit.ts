import { moduleRegistry } from '../core/registry/moduleRegistry';

export function initializeModules() {
  // --- Calculate ---
  moduleRegistry.register({
    id: 'scientific',
    displayName: 'Scientific',
    description: 'Basic scientific calculator',
    category: 'Calculate',
    status: 'available',
    routeIdentifier: 'scientific'
  });
  moduleRegistry.register({
    id: 'matrix',
    displayName: 'Matrix',
    description: 'Matrix operations and math',
    category: 'Calculate',
    status: 'available',
    routeIdentifier: 'matrix'
  });
  moduleRegistry.register({
    id: 'vector',
    displayName: 'Vector',
    description: 'Vector operations and dot/cross products',
    category: 'Calculate',
    status: 'available',
    routeIdentifier: 'vector'
  });
  moduleRegistry.register({
    id: 'complex',
    displayName: 'Complex',
    description: 'Complex number calculations',
    category: 'Calculate',
    status: 'available',
    routeIdentifier: 'complex'
  });

  // --- Analyze ---
  moduleRegistry.register({
    id: 'solver',
    displayName: 'Equation Solver',
    description: 'Solve linear systems and quadratics',
    category: 'Analyze',
    status: 'available',
    routeIdentifier: 'solver'
  });
  moduleRegistry.register({
    id: 'cas',
    displayName: 'CAS',
    description: 'Computer Algebra System',
    category: 'Analyze',
    status: 'coming-soon',
    routeIdentifier: 'cas'
  });
  moduleRegistry.register({
    id: 'calculus',
    displayName: 'Calculus',
    description: 'Derivatives and Integrals',
    category: 'Analyze',
    status: 'coming-soon',
    routeIdentifier: 'calculus'
  });

  // --- Visualize ---
  moduleRegistry.register({
    id: 'graphing',
    displayName: 'Graphing',
    description: '2D Graphing workspace',
    category: 'Visualize',
    status: 'available',
    routeIdentifier: 'graphing'
  });
  moduleRegistry.register({
    id: 'graphing3d',
    displayName: '3D Graphing',
    description: '3D mathematical visualization',
    category: 'Visualize',
    status: 'coming-soon',
    routeIdentifier: 'graphing3d'
  });
  moduleRegistry.register({
    id: 'geometry',
    displayName: 'Geometry',
    description: 'Dynamic Geometry constructions',
    category: 'Visualize',
    status: 'coming-soon',
    routeIdentifier: 'geometry'
  });

  // --- Data ---
  moduleRegistry.register({
    id: 'table',
    displayName: 'Table',
    description: 'Data tables and series',
    category: 'Data',
    status: 'coming-soon',
    routeIdentifier: 'table'
  });
  moduleRegistry.register({
    id: 'statistics',
    displayName: 'Statistics',
    description: 'Statistical analysis',
    category: 'Data',
    status: 'coming-soon',
    routeIdentifier: 'statistics'
  });
  moduleRegistry.register({
    id: 'probability',
    displayName: 'Probability',
    description: 'Probability distributions',
    category: 'Data',
    status: 'coming-soon',
    routeIdentifier: 'probability'
  });
  moduleRegistry.register({
    id: 'spreadsheet',
    displayName: 'Spreadsheet',
    description: 'Mathematical spreadsheet',
    category: 'Data',
    status: 'coming-soon',
    routeIdentifier: 'spreadsheet'
  });
}
