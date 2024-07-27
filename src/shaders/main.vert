#version 300 es

in vec2 a_position;
in vec2 a_texCoord;

uniform vec2 u_resolution;
uniform vec2 u_translation;
uniform vec2 u_rotation;
uniform vec2 u_scale;
uniform bool u_topLeft;

out vec2 v_texCoord;

vec2 rotate(vec2 v, vec2 r) {
    return vec2(
        v.x * r.x + v.y * r.y,
        v.y * r.x - v.x * r.y
    );
}

void main() {
    vec2 position = rotate(a_position * u_scale, u_rotation) + u_translation;
    vec2 clipspacePosition = position / u_resolution * vec2(2, -2);
    if (u_topLeft) {
        gl_Position = vec4(clipspacePosition - vec2(1, -1), 0, 1);
    } else {
        gl_Position = vec4(clipspacePosition, 0, 1);
    }

    v_texCoord = a_texCoord;
}
