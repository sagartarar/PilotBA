#version 300 es
precision highp float;

in vec2 a_position;  // x, y
in vec4 a_color;     // r, g, b, a

uniform mat4 u_viewProjection;

out vec4 v_color;

void main() {
  gl_Position = u_viewProjection * vec4(a_position, 0.0, 1.0);
  v_color = a_color;
}

