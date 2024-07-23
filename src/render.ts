import gameVert from "./shaders/game.vert?raw";
import gameFrag from "./shaders/game.frag?raw";

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

export function render(canvas: HTMLCanvasElement) {
    const gl = canvas.getContext("webgl2")!;
    if (!gl) throw new Error("WebGL2 failed to initialized!");

    const vertShader = createShader(gl, gameVert, gl.VERTEX_SHADER),
        fragShader = createShader(gl, gameFrag, gl.FRAGMENT_SHADER),
        program = createProgram(gl, vertShader, fragShader);

    const getAttrib = (a: string) => gl.getAttribLocation(program, a),
        getUniform = (u: string) => gl.getUniformLocation(program, u);

    const a_position = getAttrib("a_position");
    const u_resolution = getUniform("u_resolution"),
    	u_scale = getUniform("u_scale"),
    	u_rotation = getUniform("u_rotation"),
    	u_translation = getUniform("u_translation"),
        u_color = getUniform("u_color");

    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    const positions = [
        -10, -20,
        80, -20,
        -10, 30,
        -10, 30,
        80, -20,
        80, 30,
    ];
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array(positions),
        gl.STATIC_DRAW,
    );

    const vao = gl.createVertexArray();
    {
        gl.bindVertexArray(vao);

        gl.enableVertexAttribArray(a_position);
        const size = 2,			// 2 components per iteration
            type = gl.FLOAT,	// the data is 32bit floats
            normalize = false,	// don't normalize the data
            stride = 0,			// 0 = move forward size * sizeof(type) each iteration to get the next position
            offset = 0;			// start at the beginning of the buffer
        gl.vertexAttribPointer(
            a_position,
            size, type, normalize, stride, offset,
        );

        gl.bindVertexArray(null);
    }

    gl.useProgram(program);
    let r = 0;
    function renderLoop() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.bindVertexArray(vao);
        gl.uniform2f(u_resolution, canvas.width, canvas.height);
        gl.uniform2f(u_scale, r, r);
        gl.uniform2f(u_rotation, Math.cos(r), Math.sin(r));
        gl.uniform2f(u_translation, 0, 0);
        gl.uniform4f(u_color, r / Math.PI / 2, 0.5, 1 - r / Math.PI / 2, 1);
        gl.drawArrays(gl.TRIANGLES, 0, 6);

        r += Math.PI / 60;
        while (r > Math.PI * 2) r -= Math.PI * 2;

        requestAnimationFrame(renderLoop);
    };
    renderLoop();
}
