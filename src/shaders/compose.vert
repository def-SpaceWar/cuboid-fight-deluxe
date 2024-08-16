#version 300 es

in vec4 a_position;
in vec4 a_color;
in vec4 a_texCoord;

out vec4 v_color;
out vec2 v_texCoord;

void main() {
    gl_Position = a_position * vec4(1, -1, 0, 1);
    v_color = a_color;
    v_texCoord = a_texCoord.xy;
}
