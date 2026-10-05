export type ModuleCategory = 'Calculate' | 'Analyze' | 'Visualize' | 'Data';
export type ModuleStatus = 'available' | 'experimental' | 'coming-soon';

export interface ModuleDefinition {
  id: string;
  displayName: string;
  category: ModuleCategory;
  status: ModuleStatus;
  iconIdentifier?: string;
  description: string;
  routeIdentifier: string;
}


export class ModuleRegistry {
  private modules: Map<string, ModuleDefinition> = new Map();

  register(mod: ModuleDefinition): void {
    this.modules.set(mod.id, mod);
  }

  get(id: string): ModuleDefinition | undefined {
    return this.modules.get(id);
  }

  getAll(): ModuleDefinition[] {
    return Array.from(this.modules.values());
  }
}

export const moduleRegistry = new ModuleRegistry();
