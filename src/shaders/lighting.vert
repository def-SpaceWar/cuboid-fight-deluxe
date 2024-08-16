#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform vec2 u_resolution;

out vec4 v_color;

void main() {
    gl_Position = vec4(
            a_position.xy / u_resolution * vec2(2, 2),
            a_position.zw
        );
    v_color = a_color;
}
