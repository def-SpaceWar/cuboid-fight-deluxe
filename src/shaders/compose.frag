#version 300 es

precision highp float;

in vec2 v_texCoord;
in vec4 v_color;

uniform sampler2D u_main;
uniform sampler2D u_lighting;

out vec4 v_pixel;

void main() {
    v_pixel = texture(u_main, v_texCoord)
            * texture(u_lighting, v_texCoord)
            * v_color;
}
