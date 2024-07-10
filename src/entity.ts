export class ComponentMap {
    map: Map<new (...args: unknown[]) => unknown, unknown>;

    constructor() {
        this.map = new Map<new (...args: unknown[]) => unknown, unknown>;
    }

    add(value: unknown) {
        // @ts-ignore
        this.map.set(value.constructor, value);
    }

    delete(type: new (...args: unknown[]) => unknown): boolean {
        return this.map.delete(type);
    }

    remove(value: unknown): boolean {
        // @ts-ignore
        return this.map.delete(value.constructor);
    }

    get<T>(key: new (...args: unknown[]) => T): T | undefined {
        return this.map.get(key) as T | undefined;
    }
}
