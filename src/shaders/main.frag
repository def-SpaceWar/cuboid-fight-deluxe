#version 300 es

precision highp float;

in vec4 v_color;
in vec2 v_texCoord;

uniform vec4 u_color;
uniform sampler2D u_image;
uniform bool u_noTex;

out vec4 v_pixel;

void main() {
    if (u_noTex) v_pixel = v_color * u_color;
    else v_pixel = texture(
                u_image,
                v_texCoord / vec2(textureSize(u_image, 0))
            ) * v_color * u_color;
}
