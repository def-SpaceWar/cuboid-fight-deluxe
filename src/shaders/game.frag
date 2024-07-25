#version 300 es

precision highp float;

in vec2 v_texCoord;

uniform vec4 u_color;
uniform sampler2D u_image;

out vec4 v_color;

void main() {
    v_color =
        texture(
            u_image,
            v_texCoord / vec2(textureSize(u_image, 0))
        ) * u_color;
}
