// Texture coordinates run from the upper left, like the photograph and pointer.
const vertex = `
attribute vec2 position;
varying vec2 uv;
void main() {
  uv = vec2(position.x * .5 + .5, .5 - position.y * .5);
  gl_Position = vec4(position, 0., 1.);
}
`;

const fragment = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
varying vec2 uv;
uniform sampler2D photo;
uniform sampler2D reflections;
uniform float time;
uniform vec4 waves[3];

void main() {
  vec2 at = uv;
  float light = 0.;
  vec2 p = vec2(uv.x * 1.77778, uv.y);
  float a = p.x * 28. + p.y * 24. - time * 2.2;
  float b = p.x * 13. - p.y * 41. + time * 1.2;
  at += vec2(sin(a) * .0027 + sin(b) * .0012, cos(b) * .0036 + cos(a) * .0016);
  light += sin(a + sin(b) * 1.2) * .009;
  for (int i = 0; i < 3; i++) {
    vec4 wave = waves[i];
    vec2 d = (uv - wave.xy) * vec2(1.77778, 1.);
    float age = time - wave.z;
    float radius = length(d);
    float pulse = smoothstep(0., .09, age) * (1. - smoothstep(.8, 2.5, age));
    float front = radius - age * .29 + sin(a * .51 - b * .25) * .004 * min(age, 1.);
    float ring = sin(front * 103.) * exp(-abs(front) * 29.) * pulse * wave.w;
    at += d / max(radius, .008) * ring * vec2(.007, .010);
    light += ring * .094;
  }
  vec3 color = texture2D(photo, clamp(at, .001, .999)).rgb;
  vec2 reflectionUV = uv + vec2(sin(b) * .008, sin(a) * .010);
  vec3 reflected = texture2D(reflections, clamp(reflectionUV, .001, .999)).rgb;
  float silver = smoothstep(.28, .67, dot(reflected, vec3(.22, .64, .14)));
  color = mix(color, reflected, .13 * silver);
  gl_FragColor = vec4(color * (1. + light) + max(light, 0.) * .21, 1.);
}
`;

export function createArtworkSurface(canvas: HTMLCanvasElement, source: HTMLCanvasElement, reflectionImage: HTMLImageElement) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  if (!context) return null;
  const gl = context;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const texture = gl.createTexture();
  const reflectionTexture = gl.createTexture();

  function dispose() {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(texture);
    gl.deleteTexture(reflectionTexture);
  }

  function attach(type: number, source: string) {
    const shader = gl.createShader(type);
    if (!program || !shader) return false;
    shaders.push(shader);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return false;
    gl.attachShader(program, shader);
    return true;
  }

  if (!program || !buffer || !texture || !reflectionTexture || !attach(gl.VERTEX_SHADER, vertex) || !attach(gl.FRAGMENT_SHADER, fragment)) {
    dispose();
    return null;
  }

  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    dispose();
    return null;
  }

  gl.useProgram(program);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, "position");
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  function bindImage(unit: number, target: WebGLTexture, image: TexImageSource) {
    gl.activeTexture(unit);
    gl.bindTexture(gl.TEXTURE_2D, target);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  }

  bindImage(gl.TEXTURE1, reflectionTexture, reflectionImage);
  bindImage(gl.TEXTURE0, texture, source);
  gl.uniform1i(gl.getUniformLocation(program, "reflections"), 1);
  gl.uniform1i(gl.getUniformLocation(program, "photo"), 0);
  const clock = gl.getUniformLocation(program, "time");
  const impulses = gl.getUniformLocation(program, "waves[0]");

  return {
    draw(time: number, waves: Float32Array) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
      gl.uniform1f(clock, time);
      gl.uniform4fv(impulses, waves);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose,
  };
}
