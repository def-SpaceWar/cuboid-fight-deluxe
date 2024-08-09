#version 300 es

in vec4 a_position;
in vec4 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;
uniform bool u_topLeft;

out vec2 v_texCoord;

vec2 rotate(vec2 v, vec2 r) {
    return vec2(v.x * r.x + v.y * r.y, v.y * r.x - v.x * r.y);
}

void main() {
    vec2 position = rotate(a_position.xy * u_scale, u_rotation)
            + u_translation;
    vec4 clipspacePosition = vec4(position, a_position.zw)
            / vec4(u_resolution, 1, 1) * vec4(2, -2, 1, 1);

    if (u_topLeft) {
        gl_Position = clipspacePosition - vec4(1, -1, 0, 0);
    } else {
        gl_Position = clipspacePosition;
    }

    v_texCoord = a_texCoord.xy;
}
