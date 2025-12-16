#version 300 es
precision highp float;

// Inputs from vertex shader
in vec2 v_texCoord;

// Uniforms
uniform sampler2D u_dataTexture;     // Heatmap data (R32F)
uniform sampler2D u_colorMap;        // Color gradient (RGB)
uniform float u_minValue;            // Minimum data value
uniform float u_maxValue;            // Maximum data value

// Output
out vec4 fragColor;

void main() {
  // Sample data value from texture
  float value = texture(u_dataTexture, v_texCoord).r;
  
  // Normalize value to [0, 1]
  float normalized = (value - u_minValue) / (u_maxValue - u_minValue);
  normalized = clamp(normalized, 0.0, 1.0);
  
  // Lookup color from color map
  vec3 color = texture(u_colorMap, vec2(normalized, 0.5)).rgb;
  
  // Output final color
  fragColor = vec4(color, 1.0);
}

