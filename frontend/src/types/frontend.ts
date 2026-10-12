import { AngleMode, CalculatorSettings, CalculationRecord, AppInfo } from '../../../src/shared/types';

export type WorkspaceId = 'ask' | 'algebra' | 'scientific' | 'graphing' | 'tools';

export interface WorkspaceConfig {
  id: WorkspaceId;
  label: string;
  icon: string;
}

export type { AngleMode, CalculatorSettings, CalculationRecord, AppInfo };
