#version 300 es
precision highp float;

in vec4 v_color;
in vec2 v_quad;

out vec4 fragColor;

void main() {
  // Create circular point with antialiasing
  float dist = length(v_quad);
  
  if (dist > 1.0) discard;
  
  // Smooth edge antialiasing
  float alpha = 1.0 - smoothstep(0.8, 1.0, dist);
  
  fragColor = vec4(v_color.rgb, v_color.a * alpha);
}

