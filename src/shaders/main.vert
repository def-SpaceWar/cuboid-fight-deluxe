#version 300 es

in vec4 a_position;
in vec4 a_color;
in vec4 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

out vec4 v_color;
out vec2 v_texCoord;

vec2 rotate(vec2 v, vec2 r) {
    return vec2(v.x * r.x + v.y * r.y, v.y * r.x - v.x * r.y);
}

void main() {
    gl_Position = vec4(
            (rotate(a_position.xy * u_scale, u_rotation) + u_translation)
                * vec2(2, 2) / u_resolution,
            a_position.zw
        );
    v_color = a_color;
    v_texCoord = a_texCoord.xy;
}
