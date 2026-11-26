import type { createPondSwim } from "./artwork-pond";

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
uniform sampler2D floorPhoto;
uniform sampler2D koiLayer;
uniform sampler2D surfacePhoto;
uniform float time;
uniform vec4 waves[3];
uniform vec4 noses[4];
uniform vec4 wakes[8];
uniform float wakeAges[8];

void main() {
  // Work in aspect-correct pond coordinates so ripples stay circular.
  vec2 p = uv * vec2(1.77778, 1.);
  float primary = p.x * 28. + p.y * 13. + sin(p.y * 9. + time * .58) - time * 1.55;
  float crossWave = p.x * 14. - p.y * 33. + sin(p.x * 7. - time * .44) * 1.8 + time * 1.07;
  float swell = p.x * 9. + p.y * 5.4 - time * .83 + sin(p.y * 7.8 + time * .46) * .84;
  vec2 slope = vec2(sin(primary) * .0042 + sin(crossWave) * .0023 + cos(swell) * .0046,
    cos(primary) * .0031 - cos(crossWave) * .0032 + sin(swell) * .0065);
  vec2 at = uv + slope;
  float rippleLight = 0.;
  for (int i = 0; i < 3; ++i) {
    vec4 impulse = waves[i];
    float age = time - impulse.z;
    vec2 offset = (uv - impulse.xy) * vec2(1.77778, 1.);
    float radius = length(offset);
    float pulse = smoothstep(0., .12, age) * (1. - smoothstep(.82, 2.85, age));
    float front = radius - age * .265 + sin(primary * .7 - crossWave * .19) * .006 * min(age, 1.);
    float ring = sin(front * 112.) * exp(-abs(front) * 46.) * pulse * impulse.w;
    at += offset / max(radius, .009) * ring * vec2(.012, .019);
    rippleLight += max(ring, 0.) * .106 + min(ring, 0.) * .028;
  }
  for (int i = 0; i < 4; ++i) {
    vec4 nose = noses[i];
    vec2 offset = p - nose.xy;
    if (max(abs(offset.x), abs(offset.y)) > .105) continue;
    vec2 along = vec2(cos(nose.z), sin(nose.z));
    float ahead = dot(offset, along);
    float side = dot(offset, vec2(-along.y, along.x));
    // A short bow wave falls away on either side as the fish displaces water.
    float front = ahead - .020 + side * side * 9.;
    float arc = exp(-abs(front) * 204. - (side * side) * 450.);
    float sway = arc * nose.w * smoothstep(-.047, -.012, ahead);
    at -= along * sway * vec2(.005, .008);
    rippleLight += sway * .063;
  }
  for (int i = 0; i < 8; ++i) {
    vec4 wake = wakes[i];
    float age = wakeAges[i];
    if (age > 1.28 || abs(wake.w) < .025) continue;
    vec2 along = vec2(cos(wake.z), sin(wake.z));
    vec2 across = vec2(-along.y, along.x);
    vec2 center = wake.xy - along * age * .027
      + across * sign(wake.w) * (.011 + age * .025);
    vec2 offset = p - center;
    float spread = .024 + age * .043;
    if (max(abs(offset.x), abs(offset.y)) > spread * 2.2) continue;
    vec2 field = vec2(dot(offset, along) * .76, dot(offset, across));
    float radius = length(field) / spread;
    float fade = smoothstep(0., .11, age) * (1. - smoothstep(.26, 1.28, age));
    float curl = fade * wake.w * exp(-radius * radius * 1.25);
    at += vec2(-offset.y, offset.x) / spread * curl * vec2(.018, .024);
    float arc = exp(-abs(radius - .76) * 3.7);
    float lee = clamp(.57 + dot(offset, -along) / spread, 0., 1.);
    rippleLight += fade * abs(wake.w) * arc * lee * .102;
  }
  float folded = sin(primary + sin(crossWave * .72) * 1.42) + sin(crossWave);
  float caustic = pow(max(0., 1. - abs(folded) * 1.13), 5.);
  float patch = smoothstep(-.55, .72, sin(p.x * 5.6 + p.y * 4.4 - time * .28)
    + cos(p.y * 6.8 - p.x * 2.4 + time * .34) * .58);
  vec2 transmission = at - uv;
  // Light bends farther on its way to the stone bed than to the shallower koi.
  vec2 floorUV = clamp(uv + transmission * 1.68, .001, .999);
  vec2 fishUV = clamp(uv + transmission * .80, .001, .999);
  vec3 bed = texture2D(floorPhoto, floorUV).rgb;
  vec4 fish = texture2D(koiLayer, fishUV);
  float shadow = texture2D(koiLayer, floorUV - vec2(.007, .015)).a
    + texture2D(koiLayer, floorUV - vec2(.013, .023)).a;
  bed *= 1. - .12 * shadow;
  // This premultiplied layer has its own transmission and water tint.
  vec3 color = bed * (1. - fish.a) + fish.rgb * vec3(.87, .92, .86);
  float bank = smoothstep(.015, .16, bed.g - bed.r);
  float light = caustic * (.015 + patch * .034) + rippleLight;
  color *= 1. + light * 1.18 + bank * (sin(swell) * .12 + .12);
  color += mix(vec3(.22, .46, .41), vec3(.33, .78, .34), bank) * light;

  // These details come from photographed water highlights. They ride the
  // moving slope above both subjects and bend outward where a wake hits them.
  vec2 reflected = clamp(uv * .82 + .09 + transmission * 3.8
    + vec2(sin(time * .43 + p.y * 1.8) * .045, cos(time * .36 + p.x * 1.24) * .041), .001, .999);
  float flecks = texture2D(surfacePhoto, reflected).r;
  float reflection = smoothstep(.025, .45, flecks);
  float silver = reflection * (.16 + patch * .23 + caustic * .10 + max(0., rippleLight) * 1.9);
  color = mix(color, vec3(.34, .63, .49), clamp(silver, 0., .48));
  gl_FragColor = vec4(color, 1.);
}
`;

export function createArtworkSurface(
  canvas: HTMLCanvasElement,
  fish: HTMLCanvasElement,
  bedImage: HTMLImageElement,
  surfaceImage: HTMLImageElement,
) {
  const context = canvas.getContext("webgl", { alpha: false, antialias: false, depth: false });
  if (!context) return null;
  const gl = context;
  const shaders: WebGLShader[] = [];
  const program = gl.createProgram();
  const buffer = gl.createBuffer();
  const fishTexture = gl.createTexture();
  const bedTexture = gl.createTexture();
  const surfaceTexture = gl.createTexture();

  function dispose() {
    for (const shader of shaders) gl.deleteShader(shader);
    gl.deleteProgram(program);
    gl.deleteBuffer(buffer);
    gl.deleteTexture(fishTexture);
    gl.deleteTexture(bedTexture);
    gl.deleteTexture(surfaceTexture);
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

  if (!program || !buffer || !fishTexture || !bedTexture || !surfaceTexture || !attach(gl.VERTEX_SHADER, vertex) || !attach(gl.FRAGMENT_SHADER, fragment)) {
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

  bindImage(gl.TEXTURE1, bedTexture, bedImage);
  bindImage(gl.TEXTURE2, surfaceTexture, surfaceImage);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  bindImage(gl.TEXTURE0, fishTexture, fish);
  gl.uniform1i(gl.getUniformLocation(program, "koiLayer"), 0);
  gl.uniform1i(gl.getUniformLocation(program, "floorPhoto"), 1);
  gl.uniform1i(gl.getUniformLocation(program, "surfacePhoto"), 2);
  const clock = gl.getUniformLocation(program, "time");
  const impulses = gl.getUniformLocation(program, "waves[0]");
  const bowPoints = gl.getUniformLocation(program, "noses[0]");
  const wakePoints = gl.getUniformLocation(program, "wakes[0]");
  const ages = gl.getUniformLocation(program, "wakeAges[0]");

  return {
    draw(time: number, waves: Float32Array, flow: ReturnType<typeof createPondSwim>) {
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, fish);
      gl.uniform1f(clock, time);
      gl.uniform4fv(impulses, waves);
      gl.uniform4fv(bowPoints, flow.noses);
      gl.uniform4fv(wakePoints, flow.wakes);
      gl.uniform1fv(ages, flow.wakeAges);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    },
    dispose,
  };
}
