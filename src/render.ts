import mainVert from "./shaders/main.vert?raw";
import mainFrag from "./shaders/main.frag?raw";
import { Vector2D } from "./math";

const app = document.getElementById("app")!;
const FPS_SAMPLE_AMOUNT = 100;

export function renderLoop(c: () => unknown): () => void;
export function renderLoop(c: (dt: number) => unknown): () => void;
export function renderLoop(c: Function) {
    const fpsList = new Float32Array(FPS_SAMPLE_AMOUNT),
        avgFps = () => {
            let sum = 0;
            for (let i = 0; i < FPS_SAMPLE_AMOUNT; i++) sum += fpsList[i];
            return sum / FPS_SAMPLE_AMOUNT;
        },
        fpsText = app.appendChild(document.createElement("p"));
    fpsText.id = "fps";

    let before = performance.now(),
        fpsIdx = 0,
        handle = requestAnimationFrame(loop);
    function loop(now: DOMHighResTimeStamp) {
        const dt = (now - before) / 1_000;
        before = now;

        fpsList[fpsIdx] = 1 / dt;
        fpsIdx < FPS_SAMPLE_AMOUNT ? fpsIdx++ : fpsIdx = 0;
        fpsText.innerText = "FPS: " + avgFps().toPrecision(3);

        handle = requestAnimationFrame(loop);
        c(Math.min(dt, 0.05));
    }
    return () => cancelAnimationFrame(handle);
}

let gl: WebGL2RenderingContext,
    a_position: number,
    a_positionBuffer: WebGLBuffer,
    a_texCoord: number,
    a_texCoordBuffer: WebGLBuffer,
    u_resolution: WebGLUniformLocation,
    u_scale: WebGLUniformLocation,
    u_rotation: WebGLUniformLocation,
    u_translation: WebGLUniformLocation,
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
    gl = app.appendChild(document.createElement("canvas"))
        .getContext("webgl2")!;
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
    u_color = getUniform("u_color")!;
    u_image = getUniform("u_image")!;
    u_noTex = getUniform("u_noTex")!;

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(u_image, 0);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
}

export type Color = [r: GLclampf, g: GLclampf, b: GLclampf, a: GLclampf];
export type Rectangle = [x1: number, y1: number, x2: number, y2: number];

export function clearScreen(color: Color = [0, 0, 0, 0]) {
    gl.canvas.width = (gl.canvas as HTMLCanvasElement).clientWidth;
    gl.canvas.height = (gl.canvas as HTMLCanvasElement).clientHeight;

    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.uniform2f(u_resolution, gl.canvas.width, gl.canvas.height);
}

export function rectToGL(r: Rectangle): Float32Array {
    return new Float32Array([
        r[0], r[1],
        r[2], r[1],
        r[0], r[3],
        r[0], r[3],
        r[2], r[1],
        r[2], r[3],
    ]);
}

const _tint: Color = [1, 1, 1, 1],
    _scale = Vector2D.xy(1, 1),
    _translation = Vector2D.zero();
export function drawRect(
    image: TexImageSource,
    texCoord: Float32Array,
    triangles: Float32Array,
    { scale, rotation, translation, tint }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        tint?: Color,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
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
    gl.uniform4fv(u_color, tint);
    gl.uniform1ui(u_noTex, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
};

export function fillRect(
    triangles: Float32Array,
    { scale, rotation, translation, tint }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        tint?: Color,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
    tint ??= _tint;

    gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(a_position);
    gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(u_scale, scale.arr);
    gl.uniform2f(u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(u_translation, translation.arr);
    gl.uniform4fv(u_color, tint);
    gl.uniform1ui(u_noTex, 1);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
};
