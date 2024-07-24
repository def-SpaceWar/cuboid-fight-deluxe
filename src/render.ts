import gameVert from "./shaders/game.vert?raw";
import gameFrag from "./shaders/game.frag?raw";
import defaultImg from "./assets/classes/default.png";

function createShader(
    gl: WebGL2RenderingContext,
    source: string,
    type: WebGL2RenderingContext["FRAGMENT_SHADER" | "VERTEX_SHADER"],
): WebGLShader {
    const shader = gl.createShader(type);
    if (!shader) throw new Error("Shader failed to initialize!");

    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) return shader;

    gl.deleteShader(shader);
    throw new Error("Could not compile shader: " + gl.getShaderInfoLog(shader));
}

function createProgram(
    gl: WebGL2RenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader,
): WebGLProgram {
    const program = gl.createProgram();
    if (!program) throw new Error("Program failed to initialize!");

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

    gl.deleteProgram(program);
    throw new Error("Could not link program: " + gl.getProgramInfoLog(program));
}

export const loadImage = (imageUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.src = imageUrl;
        img.onload = () => resolve(img);
        img.onerror = e => reject(e);
    });

export async function render(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2")!;
    if (!gl) throw new Error("WebGL2 failed to initialized!");

    const
        vertShader = createShader(gl, gameVert, gl.VERTEX_SHADER),
        fragShader = createShader(gl, gameFrag, gl.FRAGMENT_SHADER),
        program = createProgram(gl, vertShader, fragShader),

        getAttrib = (a: string) => gl.getAttribLocation(program, a),
        a_position = getAttrib("a_position"),
        a_texCoord = getAttrib("a_texCoord"),

        getUniform = (u: string) => gl.getUniformLocation(program, u),
        u_resolution = getUniform("u_resolution"),
        u_scale = getUniform("u_scale"),
        u_rotation = getUniform("u_rotation"),
        u_translation = getUniform("u_translation"),
        u_color = getUniform("u_color"),
        u_image = getUniform("u_image"),
        u_imageTranslation = getUniform("u_imageTranslation"),

        vao = gl.createVertexArray(),
        a_positionBuffer = gl.createBuffer(),
        a_texCoordBuffer = gl.createBuffer(),

        texture = gl.createTexture();

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    function setTexture(img: TexImageSource) {
        gl.texImage2D(
            gl.TEXTURE_2D,
            0,
            gl.RGBA,
            gl.RGBA,
            gl.UNSIGNED_BYTE,
            img
        );
    }
    const defaultTex = await loadImage(defaultImg);

    gl.useProgram(program);
    gl.bindVertexArray(vao);
    gl.uniform1i(u_image, 0);
    function renderLoop() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.uniform2f(u_resolution, canvas.width, canvas.height);

        gl.bindBuffer(gl.ARRAY_BUFFER, a_texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0, 0,
                32, 0,
                0, 32,
                0, 32,
                32, 0,
                32, 32,
            ]),
            gl.STATIC_DRAW,
        );
        gl.uniform2f(u_imageTranslation, -16, -16);

        gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -16, -16,
                16, -16,
                -16, 16,
                -16, 16,
                16, -16,
                16, 16,
            ]),
            gl.STATIC_DRAW,
        );

        gl.uniform2f(u_scale, 5, 5);
        gl.uniform2f(u_rotation, 1, 0);
        gl.uniform2f(u_translation, 0, 0);
        gl.uniform4f(u_color, 1, .3, .4, 1);

        setTexture(defaultTex)
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindBuffer(gl.ARRAY_BUFFER, a_texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0, 0,
                32, 0,
                0, 32,
                0, 32,
                32, 0,
                32, 32,
            ]),
            gl.STATIC_DRAW,
        );
        gl.uniform2f(u_imageTranslation, -16, -16);

        gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -16, -16,
                16, -16,
                -16, 16,
                -16, 16,
                16, -16,
                16, 16,
            ]),
            gl.STATIC_DRAW,
        );

        gl.uniform2f(u_scale, 5, 5);
        gl.uniform2f(u_rotation, 1, 0);
        gl.uniform2f(u_translation, -200, 0);
        gl.uniform4f(u_color, .25, .45, 1, 1);

        setTexture(defaultTex)
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        gl.bindBuffer(gl.ARRAY_BUFFER, a_texCoordBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                0, 0,
                32, 0,
                0, 32,
                0, 32,
                32, 0,
                32, 32,
            ]),
            gl.STATIC_DRAW,
        );
        gl.uniform2f(u_imageTranslation, -16, -16);

        gl.bindBuffer(gl.ARRAY_BUFFER, a_positionBuffer);
        gl.bufferData(
            gl.ARRAY_BUFFER,
            new Float32Array([
                -16, -16,
                16, -16,
                -16, 16,
                -16, 16,
                16, -16,
                16, 16,
            ]),
            gl.STATIC_DRAW,
        );

        gl.uniform2f(u_scale, 5, 5);
        gl.uniform2f(u_rotation, 1, 0);
        gl.uniform2f(u_translation, 200, 0);
        gl.uniform4f(u_color, .2, 1, .5, 1);

        setTexture(defaultTex)
        gl.enableVertexAttribArray(a_position);
        gl.vertexAttribPointer(a_position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(a_texCoord);
        gl.vertexAttribPointer(a_texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        requestAnimationFrame(renderLoop);
    };
    renderLoop();
}
