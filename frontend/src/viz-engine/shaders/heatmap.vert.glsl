#version 300 es
precision highp float;

// Geometry attributes (unit quad)
in vec2 a_position;    // 0,0 to 1,1
in vec2 a_texCoord;    // 0,0 to 1,1

// Uniforms
uniform mat4 u_projection;
uniform mat4 u_view;
uniform vec2 u_gridPosition;  // Position of heatmap in world space
uniform vec2 u_gridSize;      // Size of heatmap in world space

// Outputs to fragment shader
out vec2 v_texCoord;

void main() {
  // Scale unit quad to grid size and position
  vec2 worldPos = u_gridPosition + a_position * u_gridSize;
  
  // Transform to clip space
  gl_Position = u_projection * u_view * vec4(worldPos, 0.0, 1.0);
  
  // Pass texture coordinates to fragment shader
  v_texCoord = a_texCoord;
}

