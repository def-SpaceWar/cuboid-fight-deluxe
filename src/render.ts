import mainVert from "./shaders/main.vert?raw";
import mainFrag from "./shaders/main.frag?raw";
import lightingVert from "./shaders/lighting.vert?raw";
import lightingFrag from "./shaders/lighting.frag?raw";
import composeVert from "./shaders/compose.vert?raw";
import composeFrag from "./shaders/compose.frag?raw";
import { Vector2D } from "./math";
import { Hitbox } from "./physics";
import { CIRCLE_ACCURACY, PULSE_ANIM_STEPS } from "./flags";
import { clearTimer, repeatedTimeout, timeout } from "./loop";
import { Winner } from "./gamemode";

const app = document.getElementById("app")!;
export let canvas: HTMLCanvasElement;

let gl: WebGL2RenderingContext,
    positionBuffer: WebGLBuffer,
    colorBuffer: WebGLBuffer,
    texCoordBuffer: WebGLBuffer,
    main_texture: WebGLTexture,

    mainProgram: WebGLProgram,
    main_a_position: number,
    main_a_color: number,
    main_a_texCoord: number,
    main_u_resolution: WebGLUniformLocation,
    main_u_scale: WebGLUniformLocation,
    main_u_rotation: WebGLUniformLocation,
    main_u_translation: WebGLUniformLocation,
    main_u_color: WebGLUniformLocation,
    main_u_image: WebGLUniformLocation,
    main_u_noTex: WebGLUniformLocation,

    lightingProgram: WebGLProgram,
    lighting_a_position: number,
    lighting_a_color: number,
    lighting_u_resolution: WebGLUniformLocation,
    lighting_u_color: WebGLUniformLocation,

    composeProgram: WebGLProgram,
    compose_a_position: number,
    compose_a_color: number,
    compose_a_texCoord: number,
    compose_u_main: WebGLUniformLocation,
    compose_u_lighting: WebGLUniformLocation,
    compose_mainTexture: WebGLTexture,
    compose_mainFb: WebGLFramebuffer,
    compose_lightingTexture: WebGLTexture,
    compose_lightingFb: WebGLFramebuffer;

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
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    positionBuffer = gl.createBuffer()!;
    colorBuffer = gl.createBuffer()!;
    texCoordBuffer = gl.createBuffer()!;

    mainProgram = createProgram(
        createShader(mainVert, gl.VERTEX_SHADER),
        createShader(mainFrag, gl.FRAGMENT_SHADER),
    );
    gl.useProgram(mainProgram);

    main_a_position = gl.getAttribLocation(mainProgram, "a_position");
    main_a_color = gl.getAttribLocation(mainProgram, "a_color");
    main_a_texCoord = gl.getAttribLocation(mainProgram, "a_texCoord");
    main_u_resolution = gl.getUniformLocation(mainProgram, "u_resolution")!;
    main_u_scale = gl.getUniformLocation(mainProgram, "u_scale")!;
    main_u_rotation = gl.getUniformLocation(mainProgram, "u_rotation")!;
    main_u_translation = gl.getUniformLocation(mainProgram, "u_translation")!;
    main_u_color = gl.getUniformLocation(mainProgram, "u_color")!;
    main_u_image = gl.getUniformLocation(mainProgram, "u_image")!;
    main_u_noTex = gl.getUniformLocation(mainProgram, "u_noTex")!;

    main_texture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, main_texture)!;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    gl.uniform1i(main_u_image, 0);


    lightingProgram = createProgram(
        createShader(lightingVert, gl.VERTEX_SHADER),
        createShader(lightingFrag, gl.FRAGMENT_SHADER),
    );
    gl.useProgram(lightingProgram);

    lighting_a_position = gl.getAttribLocation(lightingProgram, "a_position");
    lighting_a_color = gl.getAttribLocation(lightingProgram, "a_color");
    lighting_u_resolution = gl.getUniformLocation(lightingProgram, "u_resolution")!;
    lighting_u_color = gl.getUniformLocation(lightingProgram, "u_color")!;

    composeProgram = createProgram(
        createShader(composeVert, gl.VERTEX_SHADER),
        createShader(composeFrag, gl.FRAGMENT_SHADER),
    );
    gl.useProgram(composeProgram);

    compose_a_position = gl.getAttribLocation(composeProgram, "a_position");
    compose_a_color = gl.getAttribLocation(composeProgram, "a_color");
    compose_a_texCoord = gl.getAttribLocation(composeProgram, "a_texCoord");
    compose_u_main = gl.getUniformLocation(composeProgram, "u_main")!;
    compose_u_lighting = gl.getUniformLocation(composeProgram, "u_lighting")!;

    compose_mainTexture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, compose_mainTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.drawingBufferWidth, gl.drawingBufferHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    compose_mainFb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_mainFb);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        compose_mainTexture,
        0,
    );

    compose_lightingTexture = gl.createTexture()!;
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, compose_lightingTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.drawingBufferWidth, gl.drawingBufferHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    compose_lightingFb = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_lightingFb);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        compose_lightingTexture,
        0,
    );

    gl.uniform1i(compose_u_main, 1);
    gl.uniform1i(compose_u_lighting, 2);
}

export type GLColor = [r: GLclampf, g: GLclampf, b: GLclampf, a: GLclampf];

export function glColorToCSS(c: GLColor) {
    const r = c[0] * 255,
        g = c[1] * 255,
        b = c[2] * 255;
    return `rgba(${r | 0},${g | 0},${b | 0},${c[3]})`;
}

export type GLRectangle = [x1: number, y1: number, x2: number, y2: number];

export function clearScreen(color: GLColor = [0, 0, 0, 0]) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.bindTexture(gl.TEXTURE_2D, compose_mainTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.drawingBufferWidth, gl.drawingBufferHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );

    gl.bindTexture(gl.TEXTURE_2D, compose_lightingTexture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.drawingBufferWidth, gl.drawingBufferHeight,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null,
    );

    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_mainFb);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_lightingFb);
    gl.clearColor(...color);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);

    gl.useProgram(mainProgram);
    gl.uniform2f(main_u_resolution, canvas.width, canvas.height);

    gl.useProgram(lightingProgram);
    gl.uniform2f(lighting_u_resolution, canvas.width, canvas.height);
}

export function circleToLines({ x, y }: Vector2D, r: number): Float32Array {
    const arr: number[] = [];
    for (let i = 0; i < CIRCLE_ACCURACY; i++) {
        const angle1 = i * Math.PI / CIRCLE_ACCURACY * 2,
            angle2 = (i + 1) * Math.PI / CIRCLE_ACCURACY * 2;
        arr.push(
            x + r * Math.cos(angle1), y + r * Math.sin(angle1), 0, 1,
            x + r * Math.cos(angle2), y + r * Math.sin(angle2), 0, 1,
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
            x + r * Math.cos(angle1), y + r * Math.sin(angle1), 0, 1,
            x, y, 0, 1,
            x + r * Math.cos(angle2), y + r * Math.sin(angle2), 0, 1,
        );
    }
    return new Float32Array(arr);
}

export function rectToLines(r: GLRectangle): Float32Array {
    return new Float32Array([
        r[0], r[1], 0, 1,
        r[0], r[3], 0, 1,
        r[0], r[3], 0, 1,
        r[2], r[3], 0, 1,
        r[2], r[3], 0, 1,
        r[2], r[1], 0, 1,
        r[2], r[1], 0, 1,
        r[0], r[1], 0, 1,
    ]);
}

export function rectToGeometry(r: GLRectangle): Float32Array {
    return new Float32Array([
        r[0], r[1], 0, 1,
        r[2], r[1], 0, 1,
        r[0], r[3], 0, 1,
        r[0], r[3], 0, 1,
        r[2], r[1], 0, 1,
        r[2], r[3], 0, 1,
    ]);
}

export const
    defaultCircleLinesColor = new Float32Array(8 * CIRCLE_ACCURACY).fill(1),
    defaultCircleColor = new Float32Array(12 * CIRCLE_ACCURACY).fill(1),
    defaultRectLinesColor = new Float32Array(32).fill(1),
    //defaultRectColor = new Float32Array([
    //    1, 1, 1, 1, // top left
    //    1.3, 1.2, 1.1, 1, // top right
    //    .7, .8, .9, 1., // bottom left
    //    .7, .8, .9, 1., // bottom left
    //    1.3, 1.2, 1.1, 1, // top right
    //    1, 1, 1, 1, // bottom right
    //]);
    defaultRectColor = new Float32Array(24).fill(1);

const _tint: GLColor = [1, 1, 1, 1],
    _scale = Vector2D.xy(1, 1),
    _translation = Vector2D.zero();

export function fillLines(
    lines: Float32Array,
    colors: Float32Array,
    { scale, rotation, translation, tint }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        tint?: GLColor,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
    tint ??= _tint;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_mainFb);
    gl.useProgram(mainProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, lines, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_position);
    gl.vertexAttribPointer(main_a_position, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_color);
    gl.vertexAttribPointer(main_a_color, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(main_a_texCoord);
    gl.vertexAttribPointer(main_a_texCoord, 4, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(main_u_scale, scale.arr);
    gl.uniform2f(main_u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(main_u_translation, translation.arr);
    // @ts-ignore
    gl.uniform4fv(main_u_color, tint);
    gl.uniform1ui(main_u_noTex, 1);

    gl.drawArrays(gl.LINES, 0, lines.length / 4);
}

export function fillGeometry(
    triangles: Float32Array,
    colors: Float32Array,
    { scale, rotation, translation, tint }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
        tint?: GLColor,
    } = {},
) {
    scale ??= _scale;
    rotation ??= 0;
    translation ??= _translation;
    tint ??= _tint;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_mainFb);
    gl.useProgram(mainProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_position);
    gl.vertexAttribPointer(main_a_position, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_color);
    gl.vertexAttribPointer(main_a_color, 4, gl.FLOAT, false, 0, 0);

    gl.enableVertexAttribArray(main_a_texCoord);
    gl.vertexAttribPointer(main_a_texCoord, 4, gl.FLOAT, false, 0, 0);

    gl.uniform2fv(main_u_scale, scale.arr);
    gl.uniform2f(main_u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(main_u_translation, translation.arr);
    // @ts-ignore
    gl.uniform4fv(main_u_color, tint);
    gl.uniform1ui(main_u_noTex, 1);

    gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 4);
}

export function drawGeometry(
    image: TexImageSource,
    texCoord: Float32Array,
    triangles: Float32Array,
    colors: Float32Array,
    {
        scale,
        rotation,
        translation,
        tint,
        repeatX,
        repeatY,
        mirroredX,
        mirroredY,
    }: {
        scale?: Vector2D,
        rotation?: number,
        translation?: Vector2D,
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
    tint ??= _tint;

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_mainFb);
    gl.useProgram(mainProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, triangles, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_position);
    gl.vertexAttribPointer(main_a_position, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_color);
    gl.vertexAttribPointer(main_a_color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, texCoord, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(main_a_texCoord);
    gl.vertexAttribPointer(main_a_texCoord, 4, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, main_texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image,
    );

    gl.uniform2fv(main_u_scale, scale.arr);
    gl.uniform2f(main_u_rotation, Math.cos(rotation), Math.sin(rotation));
    gl.uniform2fv(main_u_translation, translation.arr);
    // @ts-ignore
    gl.uniform4fv(main_u_color, tint);
    gl.uniform1ui(main_u_noTex, 0);

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

    gl.drawArrays(gl.TRIANGLES, 0, triangles.length / 4);
}

export class Light { }

export function renderLighting(
    ambientLight: GLColor,
    lights: Light[],
    offsetHitboxes: [Vector2D, Hitbox][],
) {
    const
        geometry = [
            1, 0, 0, 0,
            0, 0, 0, 1,
            0, 1, 0, 0,
            -1, 0, 0, 0,
            0, 0, 0, 1,
            0, -1, 0, 0,
            1, 0, 0, 0,
            0, 0, 0, 1,
            0, -1, 0, 0,
            -1, 0, 0, 0,
            0, 0, 0, 1,
            0, 1, 0, 0,
        ],
        color = [
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
            ...ambientLight,
        ];

    const points: [Vector2D, Hitbox, number][] = [];
    for (let i = 0; i < offsetHitboxes.length; i++) {
        const [pos, hitbox] = offsetHitboxes[i];
        switch (hitbox.type) {
            case "rect":
                points.push(
                    [Vector2D.add(
                        Vector2D.add(pos, hitbox.offset),
                        Vector2D.xy(-hitbox.w / 2, -hitbox.h / 2),
                    ), hitbox, 0],
                    [Vector2D.add(
                        Vector2D.add(pos, hitbox.offset),
                        Vector2D.xy(-hitbox.w / 2, +hitbox.h / 2),
                    ), hitbox, 1],
                    [Vector2D.add(
                        Vector2D.add(pos, hitbox.offset),
                        Vector2D.xy(+hitbox.w / 2, -hitbox.h / 2),
                    ), hitbox, 2],
                    [Vector2D.add(
                        Vector2D.add(pos, hitbox.offset),
                        Vector2D.xy(+hitbox.w / 2, +hitbox.h / 2),
                    ), hitbox, 3],
                );
                break;
            case "circle":
                throw "Not implemented!";
        }
    }

    // sort points by distance to light
    lights;

    // render light triangles
    geometry.push(
        -100, -100, 0, 1,
        -500, 100, 0, 1,
        500, 500, 0, 0,
    );
    color.push(
        0, 1, 0, 1,
        0, 0, 1, 1,
        0, 1, 0, 1,
    );
    geometry.push(
        -100, -100, 0, 1,
        -200, 400, 0, 1,
        600, -500, 0, 0,
    );
    color.push(
        0, 0, 1, 1,
        0, 1, 0, 1,
        0, 0, 1, 1,
    );

    // get light at each point

    // render the hitboxes with light

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, compose_lightingFb);
    gl.useProgram(lightingProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(geometry), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(lighting_a_position);
    gl.vertexAttribPointer(lighting_a_position, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(lighting_a_color);
    gl.vertexAttribPointer(lighting_a_color, 4, gl.FLOAT, false, 0, 0);

    gl.uniform4fv(lighting_u_color, [1, 1, 1, 1]);

    gl.drawArrays(gl.TRIANGLES, 0, geometry.length / 4);
}

const
    _geometry = new Float32Array([
        -1, -1, -1, 1.,
        1., -1, -1, 1.,
        -1, 1., -1, 1.,
        -1, 1., -1, 1.,
        1., -1, -1, 1.,
        1., 1., -1, 1.,
    ]),
    _color = new Float32Array([
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
        1, 1, 1, 1,
    ]),
    _texCoord = new Float32Array([
        0, 0, 0, 1,
        1, 0, 0, 1,
        0, 1, 0, 1,
        0, 1, 0, 1,
        1, 0, 0, 1,
        1, 1, 0, 1,
    ]);
export function composeDisplay() {
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.useProgram(composeProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, _geometry, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(compose_a_position);
    gl.vertexAttribPointer(compose_a_position, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, _color, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(compose_a_color);
    gl.vertexAttribPointer(compose_a_color, 4, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, _texCoord, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(compose_a_texCoord);
    gl.vertexAttribPointer(compose_a_texCoord, 4, gl.FLOAT, false, 0, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
}

export class RGBAColor {
    glColor: GLColor;
    get r() { return this.glColor[0]; }
    set r(r: number) { this.glColor[0] = r; }
    get g() { return this.glColor[1]; }
    set g(g: number) { this.glColor[1] = g; }
    get b() { return this.glColor[2]; }
    set b(b: number) { this.glColor[2] = b; }
    get a() { return this.glColor[3]; }
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

export function createHTMLTemporary(
    innerText: string,
    className: string,
    fontSize: number,
    pos: Vector2D,
    lifespan: number,
) {
    const elem = app.appendChild(document.createElement("div"));
    elem.innerText = innerText;
    elem.className = className;
    elem.style.fontSize = `${fontSize | 0}px`;
    elem.style.left = `calc(50vw + ${pos.x | 0}px)`;
    elem.style.top = `calc(50vh + ${pos.y | 0}px)`;
    elem.style.animationDuration = `${lifespan}s`;
    elem.style.opacity = "0";
    timeout(() => elem.remove(), lifespan);
}

export function createHTMLRender(
    innerText: string,
    className: string,
    fontSize: number,
    pos: Vector2D,
    isTopLeft: boolean = false,
) {
    const elem = app.appendChild(document.createElement("div"));
    elem.innerText = innerText;
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
    leaderboardTable: HTMLTableElement,
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

    endScreen.appendChild(leaderboardTable);

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
