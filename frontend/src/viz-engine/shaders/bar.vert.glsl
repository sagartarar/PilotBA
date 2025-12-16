#version 300 es
precision highp float;

// Geometry (unit quad: 0,0 -> 1,1)
in vec2 a_position;

// Instance data
in vec4 a_barRect;    // x, y, width, height in world coordinates
in vec4 a_barColor;   // r, g, b, a

// Uniforms
uniform mat4 u_viewProjection;

out vec4 v_color;

void main() {
  // Scale and position the quad
  vec2 position = a_position * a_barRect.zw + a_barRect.xy;
  
  gl_Position = u_viewProjection * vec4(position, 0.0, 1.0);
  v_color = a_barColor;
}

