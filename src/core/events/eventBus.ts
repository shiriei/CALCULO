export type AppEventType = 
  | 'CALCULATION_CREATED'
  | 'GRAPH_REQUESTED'
  | 'DATASET_CREATED'
  | 'VECTOR_CREATED'
  | 'MATRIX_CREATED'
  | 'EQUATION_CREATED'
  | 'WORKSPACE_UPDATED';

export interface AppEvent<T = any> {
  type: AppEventType;
  payload: T;
  timestamp: number;
}

export type EventCallback<T = any> = (event: AppEvent<T>) => void;

export class EventBus {
  private listeners: Map<AppEventType, Set<EventCallback>> = new Map();

  subscribe<T = any>(type: AppEventType, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type)!.add(callback as EventCallback);

    return () => this.unsubscribe(type, callback);
  }

  unsubscribe<T = any>(type: AppEventType, callback: EventCallback<T>): void {
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.delete(callback as EventCallback);
    }
  }

  publish<T = any>(type: AppEventType, payload: T): void {
    const event: AppEvent<T> = { type, payload, timestamp: Date.now() };
    if (this.listeners.has(type)) {
      this.listeners.get(type)!.forEach(cb => {
        try {
          cb(event);
        } catch (e) {
          console.error(`Error in event listener for ${type}:`, e);
        }
      });
    }
  }
}

export const globalEventBus = new EventBus();
