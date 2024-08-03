import mainVert from "./shaders/main.vert?raw";
import mainFrag from "./shaders/main.frag?raw";
import { Vector2D } from "./math";
import { CIRCLE_ACCURACY, PULSE_ANIM_STEPS } from "./flags";
import { clearTimer, repeatedTimeout, timeout } from "./loop";
import { Winner } from "./gamemode";

const app = document.getElementById("app")!;
export let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext,
    a_position: number,
    a_positionBuffer: WebGLBuffer,
    a_texCoord: number,
    a_texCoordBuffer: WebGLBuffer,
    u_resolution: WebGLUniformLocation,
    u_scale: WebGLUniformLocation,
    u_rotation: WebGLUniformLocation,
    u_translation: WebGLUniformLocation,
    u_topLeft: WebGLUniformLocation,
    u_color: WebGLUniformLocation,
    u_image: WebGLUniformLocation,
    u_noTex: WebGLUniformLocation;

function createShader(
    source: string,
    type: WebGL2RenderingContext["FRAGMENT_SHADER" | "VERTEX_SHADER"],
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw "Shader failed to initialize!";

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;

    gl.deleteShader(shader);
    throw ("Could not compile shader: " + gl.getShaderInfoLog(shader));
}

function createProgram(
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
): WebGLProgram {
    const program = gl.createProgram();
    if (!program) throw "Program failed to initialize!";

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

    gl.deleteProgram(program);
    throw ("Could not link program: " + gl.getProgramInfoLog(program));
}

export const loadImage = (imageUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        img.onload = () => resolve(img);
        img.onerror = e => reject(e);
    });

export async function setupRender() {
    gl = app.appendChild(canvas = document.createElement("canvas"))
        .getContext("webgl2", {
            antialias: false,
            powerPreference: 'high-performance',
        })!;
    if (!gl) throw new Error("WebGL2 failed to initialized!");

    const
        vertShader = createShader(mainVert, gl.VERTEX_SHADER),
        fragShader = createShader(mainFrag, gl.FRAGMENT_SHADER),
        program = createProgram(vertShader, fragShader),
        vao = gl.createVertexArray(),
        texture = gl.createTexture(),

        getAttrib = (a: string) => gl.getAttribLocation(program, a),
        getUniform = (u: string) => gl.getUniformLocation(program, u);

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    a_position = getAttrib("a_position")!;
    a_positionBuffer = gl.createBuffer()!;
    a_texCoord = getAttrib("a_texCoord")!;
    a_texCoordBuffer = gl.createBuffer()!;
    u_resolution = getUniform("u_resolution")!;
    u_scale = getUniform("u_scale")!;
    u_rotation = getUniform("u_rotation")!;
    u_translation = getUniform("u_translation")!;
    u_topLeft = getUniform("u_topLeft")!;
    u_color = getUniform("u_color")!;
    u_image = getUniform("u_image")!;
    u_noTex = getUniform("u_noTex")!;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u_image, 0);

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

export type GLColor = [r: GLclampf, g: GLclampf, b: GLclampf, a: GLclampf];
export type GLRectangle = [x1: number, y1: number, x2: number, y2: number];

export function clearScreen(color: GLColor = [0, 0, 0, 0]) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(u_resolution, canvas.width, canvas.height);
}

export function circleToLines({ x, y }: Vector2D, r: number): Float32Array {
    const arr: number[] = [];
    for (let i = 0; i < CIRCLE_ACCURACY; i++) {
        const angle1 = i * Math.PI / CIRCLE_ACCURACY * 2,
            angle2 = (i + 1) * Math.PI / CIRCLE_ACCURACY * 2;
        arr.push(
            x + r * Math.cos(angle1), y + r * Math.sin(angle1),
            x + r * Math.cos(angle2), y + r * Math.sin(angle2),
        );
    }
    return new Float32Array(arr);
}

export function circleToGeometry({ x, y }: Vector2D, r: number): Float32Array {
    const arr: number[] = [];
    for (let i = 0; i < CIRCLE_ACCURACY; i++) {
        const angle1 = i * Math.PI / CIRCLE_ACCURACY * 2,
            angle2 = (i + 1) * Math.PI / CIRCLE_ACCURACY * 2;
        arr.push(
            x + r * Math.cos(angle1), y + r * Math.sin(angle1),
            x, y,
            x + r * Math.cos(angle2), y + r * Math.sin(angle2),
        );
    }
    return new Float32Array(arr);
}

export function rectToLines(r: GLRectangle): Float32Array {
    return new Float32Array([
        r[0], r[1],
        r[0], r[3],
        r[0], r[3],
        r[2], r[3],
        r[2], r[3],
        r[2], r[1],
        r[2], r[1],
        r[0], r[1],
    ]);
}

export function rectToGeometry(r: GLRectangle): Float32Array {
    return new Float32Array([
        r[0], r[1],
        r[2], r[1],
        r[0], r[3],
        r[0], r[3],
        r[2], r[1],
        r[2], r[3],
    ]);
}

const _tint: GLColor = [1, 1, 1, 1],
    _scale = Vector2D.xy(1, 1),
    _translation = Vector2D.zero();

export function fillLines(
    lines: Float32Array,
    { scale, rotation, translation, isTopLeft, tint }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        isTopLeft?: boolean,
        tint?: GLColor,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
    isTopLeft ??= false;
    tint ??= _tint;

    gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(u_scale, scale.arr);
    gl.uniform2f(u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(u_translation, translation.arr);
    // @ts-ignore
    gl.uniform1ui(u_topLeft, isTopLeft + 0);
    gl.uniform4fv(u_color, tint);
    gl.uniform1ui(u_noTex, 1);

    gl.drawArrays(gl.LINES, 0, lines.length / 2);
}

export function fillGeometry(
    triangles: Float32Array,
    { scale, rotation, translation, isTopLeft, tint }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        isTopLeft?: boolean,
        tint?: GLColor,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
    isTopLeft ??= false;
    tint ??= _tint;

    gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(u_scale, scale.arr);
    gl.uniform2f(u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(u_translation, translation.arr);
    // @ts-ignore
    gl.uniform1ui(u_topLeft, isTopLeft + 0);
    gl.uniform4fv(u_color, tint);
    gl.uniform1ui(u_noTex, 1);

    gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 2);
}

export function drawGeometry(
    image: TexImageSource,
    texCoord: Float32Array,
    triangles: Float32Array,
    {
        scale,
        rotation,
        translation,
        isTopLeft,
        tint,
        repeatX,
        repeatY,
        mirroredX,
        mirroredY,
    }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        isTopLeft?: boolean,
        tint?: GLColor,
        repeatX?: boolean,
        repeatY?: boolean,
        mirroredX?: boolean,
        mirroredY?: boolean,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
    isTopLeft ??= false;
    tint ??= _tint;

    gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, a_texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoord, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_texCoord);
    gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
    );

    gl.uniform2fv(u_scale, scale.arr);
    gl.uniform2f(u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(u_translation, translation.arr);
    // @ts-ignore
    gl.uniform1ui(u_topLeft, isTopLeft + 0);
    gl.uniform4fv(u_color, tint);
    gl.uniform1ui(u_noTex, 0);

    if (repeatX)
        if (mirroredX)
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_S,
                gl.MIRRORED_REPEAT,
            );
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    if (repeatY)
        if (mirroredY)
            gl.texParameteri(
                gl.TEXTURE_2D,
                gl.TEXTURE_WRAP_T,
                gl.MIRRORED_REPEAT,
            );
        else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
    else gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 2);
}

export class RGBAColor {
    glColor: GLColor;
    get r() { return this.glColor[0] }
    set r(r: number) { this.glColor[0] = r; }
    get g() { return this.glColor[1] }
    set g(g: number) { this.glColor[1] = g; }
    get b() { return this.glColor[2] }
    set b(b: number) { this.glColor[2] = b; }
    get a() { return this.glColor[3] }
    set a(a: number) { this.glColor[3] = a; }

    constructor(r: number, g: number, b: number, a: number = 1) {
        this.glColor = new Float32Array([r, g, b, a]) as unknown as GLColor;
    }

    toCSS(): string {
        const r = (this.r * 255) | 0,
            g = (this.g * 255) | 0,
            b = (this.b * 255) | 0,
            a = (this.a * 255) | 0;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
    }

    toHSVA(): HSVAColor {
        const max = Math.max(this.r, this.g, this.b),
            min = Math.min(this.r, this.g, this.b),
            d = max - min,
            s = (max === 0 ? 0 : d / max),
            v = max;
        let h: number;
        switch (max) {
            case min: h = 0; break;
            case this.r:
                h = (this.g - this.b);
                if (this.g < this.b) h += d * 6;
                h /= 6 * d;
                break;
            case this.g: h = (this.b - this.r) + d * 2; h /= 6 * d; break;
            case this.b: h = (this.r - this.g) + d * 4; h /= 6 * d; break;
        }
        // @ts-ignore
        return new HSVAColor(h, s, v, this.a);
    }

    darken(amount: number) {
        return new RGBAColor(
            this.r / amount,
            this.g / amount,
            this.b / amount,
            this.a,
        );
    }

    pulse(from: RGBAColor, time: number) {
        const differenceR = this.r - from.r,
            differenceG = this.g - from.g,
            differenceB = this.b - from.b,
            differenceA = this.a - from.a;

        this.r = from.r;
        this.g = from.g;
        this.b = from.b;
        this.a = from.a;

        let step = 0;
        const timer = repeatedTimeout(() => {
            if (step == PULSE_ANIM_STEPS) {
                clearTimer(timer);
                return;
            }

            this.r += differenceR / PULSE_ANIM_STEPS;
            this.g += differenceG / PULSE_ANIM_STEPS;
            this.b += differenceB / PULSE_ANIM_STEPS;
            this.a += differenceA / PULSE_ANIM_STEPS;
            step++;
        }, time / PULSE_ANIM_STEPS);
    }

    pulseFromGL(from: GLColor, time: number) {
        const differenceR = this.r - from[0],
            differenceG = this.g - from[1],
            differenceB = this.b - from[2],
            differenceA = this.a - from[3];

        this.r = from[0];
        this.g = from[1];
        this.b = from[2];
        this.a = from[3];

        let step = 0;
        const timer = repeatedTimeout(() => {
            if (step == PULSE_ANIM_STEPS) {
                clearTimer(timer);
                return;
            }

            this.r += differenceR / PULSE_ANIM_STEPS;
            this.g += differenceG / PULSE_ANIM_STEPS;
            this.b += differenceB / PULSE_ANIM_STEPS;
            this.a += differenceA / PULSE_ANIM_STEPS;
            step++;
        }, time / PULSE_ANIM_STEPS);
    }
}

export class HSVAColor {
    constructor(
        public h: number,
        public s: number,
        public v: number,
        public a: number,
    ) { }

    toRGBA(): RGBAColor {
        const i = (this.h * 6) | 0,
            f = this.h * 6 - i,
            p = this.v * (1 - this.s),
            q = this.v * (1 - f * this.s),
            t = this.v * (1 - (1 - f) * this.s);
        let r: number, g: number, b: number;
        switch (i % 6) {
            case 0: r = this.v, g = t, b = p; break;
            case 1: r = q, g = this.v, b = p; break;
            case 2: r = p, g = this.v, b = t; break;
            case 3: r = p, g = q, b = this.v; break;
            case 4: r = t, g = p, b = this.v; break;
            case 5: r = this.v, g = p, b = q; break;
        }
        // @ts-ignore
        return new RGBAColor(r, g, b, this.a);
    }
}

export function createTextTemporary(
    text: string,
    className: string,
    fontSize: number,
    pos: Vector2D,
    lifespan: number,
    isTopLeft: boolean = false,
) {
    const elem = app.appendChild(document.createElement("p"));
    elem.innerText = text;
    elem.className = className;
    elem.style.fontSize = `${fontSize | 0}px`;
    if (isTopLeft) {
        elem.style.left = `${pos.x | 0}px`;
        elem.style.top = `${pos.y | 0}px`;
    } else {
        elem.style.left = `calc(50vw + ${pos.x | 0}px)`;
        elem.style.top = `calc(50vh + ${pos.y | 0}px)`;
    }
    elem.style.animationDuration = `${lifespan}s`;
    elem.style.opacity = "0";
    timeout(() => elem.remove(), lifespan);
}

export function createTextRender(
    text: string,
    className: string,
    fontSize: number,
    pos: Vector2D,
    isTopLeft: boolean = false,
) {
    const elem = app.appendChild(document.createElement("p"));
    elem.innerText = text;
    elem.className = className;
    elem.style.fontSize = `${fontSize}px`;
    if (isTopLeft) {
        elem.style.left = `${pos.x | 0}px`;
        elem.style.top = `${pos.y | 0}px`;
    } else {
        elem.style.left = `calc(50vw + ${pos.x | 0}px)`;
        elem.style.top = `calc(50vh + ${pos.y | 0}px)`;
    }
    return {
        elem,
        remove: () => elem.remove(),
    };
}

export function createEndScreen(
    numPlayers: number,
    winnerData: Winner,
    restart: () => void,
    next: () => void,
) {
    const endScreenContainer = app.appendChild(document.createElement("div"));
    endScreenContainer.className = "end-screen-container";

    const endScreen = endScreenContainer.appendChild(
        document.createElement("center")
    );
    endScreen.className = "end-screen";

    const header = endScreen.appendChild(document.createElement("h1"));
    switch (winnerData.type) {
        case "none":
            header.innerText = "Undecided";
            break;
        case "player":
            const span = header.appendChild(document.createElement("span"));
            span.innerText = `[P${winnerData.player.number}] `
                + winnerData.player.name;
            span.style.color = winnerData.player.color.toCSS();
            header.appendChild(document.createTextNode(" Won!"));
            break;
        case "players":
            if (winnerData.players.length >= numPlayers)
                header.innerText = "Everyone won!?";
            else switch (winnerData.players.length) {
                case 2:
                    {
                        const span =
                            header.appendChild(document.createElement("span"));
                        span.innerText = `[P${winnerData.players[0].number}] `
                            + winnerData.players[0].name;
                        span.style.color = winnerData.players[0].color.toCSS();
                    }
                    header.appendChild(document.createTextNode(" and "));
                    {
                        const span =
                            header.appendChild(document.createElement("span"));
                        span.innerText = `[P${winnerData.players[1].number}] `
                            + winnerData.players[1].name;
                        span.style.color = winnerData.players[1].color.toCSS();
                    }
                    header.appendChild(document.createTextNode(" Won!"));
                    break;
                case 3:
                    {
                        const span =
                            header.appendChild(document.createElement("span"));
                        span.innerText = `[P${winnerData.players[0].number}] `
                            + winnerData.players[0].name;
                        span.style.color = winnerData.players[0].color.toCSS();
                    }
                    header.appendChild(document.createTextNode(", "));
                    {
                        const span =
                            header.appendChild(document.createElement("span"));
                        span.innerText = `[P${winnerData.players[1].number}] `
                            + winnerData.players[1].name;
                        span.style.color = winnerData.players[1].color.toCSS();
                    }
                    header.appendChild(document.createTextNode(", and "));
                    {
                        const span =
                            header.appendChild(document.createElement("span"));
                        span.innerText = `[P${winnerData.players[2].number}] `
                            + winnerData.players[2].name;
                        span.style.color = winnerData.players[2].color.toCSS();
                    }
                    header.appendChild(document.createTextNode(" Won!"));
            }
    }

    {
        const button = endScreen.appendChild(document.createElement("button"));
        button.innerText = "Restart";
        button.onclick = restart;
    }

    {
        const button = endScreen.appendChild(document.createElement("button"));
        button.innerText = "Continue";
        button.onclick = next;
    }

    return () => endScreenContainer.remove();
}
