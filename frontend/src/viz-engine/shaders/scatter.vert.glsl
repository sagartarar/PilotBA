#version 300 es
precision highp float;

// Geometry (single point quad: -1,-1 to 1,1)
in vec2 a_quad;

// Instance data
in vec3 a_point;     // x, y, size (in pixels)
in vec4 a_color;     // r, g, b, a

uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec2 u_resolution;
uniform float u_pixelRatio;

out vec4 v_color;
out vec2 v_quad;

void main() {
  // Transform point to clip space
  vec4 clipPos = u_projection * u_view * vec4(a_point.xy, 0.0, 1.0);
  
  // Calculate point size in clip space
  vec2 pixelSize = (a_point.z * u_pixelRatio) / u_resolution;
  
  // Offset by quad position
  clipPos.xy += a_quad * pixelSize * clipPos.w;
  
  gl_Position = clipPos;
  
  v_color = a_color;
  v_quad = a_quad;
}


