export class Vector2D {
    static zero(): Vector2D {
        return new this();
    }

    static x(x: number): Vector2D {
        const v = new this();
        v.x = x;
        return v;
    }

    static y(y: number): Vector2D {
        const v = new this();
        v.y = y;
        return v;
    }

    static xy(x: number, y: number): Vector2D {
        const v = new this();
        v.x = x;
        v.y = y;
        return v;
    }

    static polar(r: number, theta: number): Vector2D {
        r;
        theta;
        throw new Error("to be implemented...");
    }

    static add(u: Vector2D, v: Vector2D): Vector2D {
        return this.xy(u.x + v.x, u.y + v.y);
    }

    static subtract(u: Vector2D, v: Vector2D): Vector2D {
        return this.xy(u.x - v.x, u.y - v.y);
    }

    static squaredDistance(u: Vector2D, v: Vector2D): number {
        return (u.x - v.x) ** 2 + (u.y - v.y) ** 2;
    }

    static distance(u: Vector2D, v: Vector2D): number {
        return Math.sqrt(this.squaredDistance(u, v));
    }

    static squaredMagnitude(v: Vector2D) {
        return v.x * v.x + v.y * v.y;
    }

    static magnitude(v: Vector2D) {
        return Math.sqrt(this.squaredMagnitude(v));
    }

    arr: Float32Array;
    private constructor() { this.arr = new Float32Array(2); }
    get x(): number { return this.arr[0]; }
    set x(x: number) { this.arr[0] = x; }
    get y(): number { return this.arr[1]; }
    set y(y: number) { this.arr[1] = y; }

    clone(): Vector2D {
        return Vector2D.xy(this.x, this.y);
    }

    Sx(x: number) {
        this.x *= x;
        return this;
    }

    Sy(y: number) {
        this.y *= y;
        return this;
    }

    Sxy(x: number, y: number) {
        this.x *= x;
        this.y *= y;
        return this;
    }

    Sn(n: number) {
        this.x *= n;
        this.y *= n;
        return this;
    }

    sx(x: number): this {
        this.x = x;
        return this;
    }

    sy(y: number): this {
        this.y = y;
        return this;
    }

    sxy(x: number, y: number): this {
        this.x = x;
        this.y = y;
        return this;
    }

    ax(x: number): this {
        this.x += x;
        return this;
    }

    ay(y: number): this {
        this.y += y;
        return this;
    }

    axy(x: number, y: number): this {
        this.x += x;
        this.y += y;
        return this;
    }

    av(v: Vector2D): this {
        this.x += v.x;
        this.y += v.y;
        return this;
    }
}
