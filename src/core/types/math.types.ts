export interface Expression {
  id: string;
  source: string;
  latex?: string;
  variables: string[];
}

export interface CalculationResult {
  value: string;
  fractionValue?: string;
  success: boolean;
  error?: string;
}

export interface GraphFunction {
  id: string;
  expression: string;
  color: string;
  visible: boolean;
}

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export interface Vector {
  id: string;
  components: number[];
}

export interface Matrix {
  id: string;
  rows: number;
  cols: number;
  data: number[][];
}

export interface Dataset {
  id: string;
  name: string;
  columns: string[];
  data: number[][];
}

export interface Equation {
  id: string;
  leftHandSide: string;
  rightHandSide: string;
}

export interface EquationSolution {
  equationId: string;
  roots: string[];
  success: boolean;
}
