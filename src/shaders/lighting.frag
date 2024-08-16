#version 300 es

precision highp float;

in vec4 v_color;

uniform vec4 u_color;

out vec4 v_pixel;

void main() {
    v_pixel = v_color * u_color;
}
