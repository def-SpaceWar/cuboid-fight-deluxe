#version 300 es

in vec2 a_position;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;

vec2 rotate(vec2 v, vec2 r) {
    return vec2(
        v.x * r.y + v.y * r.x,
        v.y * r.y - v.x * r.x
    );
}

void main() {
    vec2 position = rotate(a_position * u_scale, u_rotation) + u_translation;
    vec2 clipspacePosition = position / u_resolution * 2.0;
    gl_Position = vec4(clipspacePosition, 0, 1);
}
