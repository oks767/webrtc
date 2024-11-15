type EventMap = {
    [key: string]: (...args: never[]) => void; // Base type that allows for individual typing in subclasses
  };
  
  class Emitter<T extends EventMap> {
    private events: { [K in keyof T]?: T[K][] } = {};
  
    emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>): this {
      if (this.events[event]) {
        this.events[event]!.forEach((fn) => fn(...args));
      }
      return this;
    }
  
    on<K extends keyof T>(event: K, fn: T[K]): this {
      if (this.events[event]) {
        this.events[event]!.push(fn);
      } else {
        this.events[event] = [fn];
      }
      return this;
    }
  
    off<K extends keyof T>(event?: K, fn?: T[K]): this {
      if (event && fn) {
        const listeners = this.events[event];
        if (listeners) {
          const index = listeners.findIndex((_fn) => _fn === fn);
          if (index !== -1) {
            listeners.splice(index, 1);
          }
        }
      } else if (event) {
        this.events[event] = [];
      } else {
        this.events = {}; // Clears all events if no event name is provided
      }
      return this;
    }
  }
  
  export default Emitter;
  