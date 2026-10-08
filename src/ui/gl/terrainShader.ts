// The atlas: one full-screen pass that paints the land and sea like a hand-coloured map. Paper
// underneath; watercolour washes for the country; engraved ripple lines along the coasts; ink
// for the shorelines; soft hill shading; realm borders hand-coloured in bands with a dotted
// line, the way old political maps were painted.
export const TERRAIN_VS = `#version 300 es
in vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }`;

export const TERRAIN_FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uElev, uA, uB, uC, uCoast, uRealm, uCoarse, uWorks;
uniform vec2 uRes, uCenter, uMap;      // screen px, camera centre (cells), map size (cells)
uniform float uZoom, uSea, uTime, uPhase, uDpr, uSolar;
uniform int uLens;
uniform vec3 uPal[32];
uniform vec3 uFaith[16];
uniform vec2 uCoarseSize;
out vec4 frag;

float h21(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vn(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p) { float a = 0.0, m = 0.5; for (int k = 0; k < 4; k++) { a += vn(p) * m; p = p * 2.03 + 17.1; m *= 0.5; } return a; }
vec2 uvOf(vec2 c) { return c / uMap; }
float elev(vec2 c) { return texture(uElev, uvOf(c)).r; }

// paper: warm cream, fibres, foxing, and the page browning toward its edges
vec3 paper(vec2 s, vec2 w) {
  float f = fbm(s * 0.012) * 0.55 + fbm(s * 0.09) * 0.3 + vn(s * vec2(0.9, 0.06)) * 0.15;
  vec3 c = mix(vec3(0.93, 0.89, 0.79), vec3(0.97, 0.94, 0.86), f);
  float fox = smoothstep(0.72, 0.9, fbm(w * 0.045 + 3.0)); c *= 1.0 - fox * 0.07;
  return c;
}
// watercolour: wobble the pigment and let it pool darker at the edges of a wash
vec3 wash(vec3 base, vec3 col, float a, vec2 w) {
  float n = fbm(w * 0.35) - 0.5, gran = vn(w * 3.1) - 0.5;
  vec3 c = col * (1.0 + n * 0.16 + gran * 0.05);
  return mix(base, base * c / max(vec3(0.6), vec3(0.95)), a);   // multiply-ish, so the paper shows through
}
vec3 mulPaint(vec3 base, vec3 col, float a) { return mix(base, base * col, a); }

vec3 biome(vec4 A, vec4 B, float hh, vec2 w, out float forest, out float rock) {
  float T = A.r * 80.0 - 40.0, m = A.g * 2.5, g = A.b, t = A.a, snow = B.r, green = B.b, Tm = B.a * 80.0 - 40.0;
  // palette: painted, a little muted, warm
  vec3 sand = vec3(0.93, 0.80, 0.55), steppe = vec3(0.84, 0.82, 0.55), meadow = vec3(0.70, 0.78, 0.45), scrub = vec3(0.80, 0.72, 0.52);
  vec3 wood = vec3(0.44, 0.60, 0.33), taiga = vec3(0.36, 0.50, 0.36), jungle = vec3(0.27, 0.50, 0.30), dryw = vec3(0.58, 0.62, 0.36);
  vec3 tundra = vec3(0.72, 0.74, 0.62), ice = vec3(0.95, 0.97, 0.98), marsh = vec3(0.56, 0.64, 0.48);
  vec3 c = mix(scrub, sand, smoothstep(0.35, 0.12, m));
  c = mix(c, mix(steppe, meadow, smoothstep(0.3, 0.9, green * g)), smoothstep(0.15, 0.55, g) * smoothstep(0.12, 0.35, m));
  c = mix(c, tundra, smoothstep(6.0, -2.0, Tm) * (1.0 - smoothstep(0.6, 0.9, t)));
  vec3 tree = mix(mix(wood, taiga, smoothstep(9.0, 2.0, Tm)), mix(dryw, jungle, smoothstep(0.9, 1.5, m)), smoothstep(16.0, 22.0, Tm));
  forest = smoothstep(0.32, 0.62, t);
  c = mix(c, tree, forest);
  c = mix(c, marsh, smoothstep(1.6, 2.1, m) * smoothstep(0.08, 0.02, hh) * (1.0 - forest * 0.5));
  rock = smoothstep(0.26, 0.55, hh);
  vec3 stone = mix(vec3(0.70, 0.62, 0.50), vec3(0.62, 0.58, 0.56), smoothstep(0.4, 0.7, hh));
  c = mix(c, stone, rock * 0.85);
  c = mix(c, ice, max(smoothstep(0.35, 0.8, snow), 0.0));
  return c;
}

float realmPick(vec2 w, out vec2 dd) {
  vec4 r = texture(uRealm, uvOf(w)); dd = r.gb; return r.r;   // id (nearest), distance to the border (linear)
}

void main() {
  vec2 sp = gl_FragCoord.xy; sp.y = uRes.y - sp.y;
  vec2 w = uCenter + (sp - uRes * 0.5) / uZoom;          // world position in cells
  float px = 1.0 / uZoom;                                 // one screen pixel, in cells
  vec3 pap = paper(sp / uDpr + uCenter * uZoom / uDpr, w);
  // outside the map: the margin of the page, and the frame
  vec2 m0 = -w, m1 = w - uMap; float outside = max(max(m0.x, m0.y), max(m1.x, m1.y));
  if (outside > 0.0) {
    vec3 c = pap * vec3(0.95, 0.92, 0.85);
    float fr = outside / px;   // in pixels from the map edge
    float line = smoothstep(1.6, 0.6, abs(fr - 7.0 * uDpr)) * 0.85 + smoothstep(1.2, 0.3, abs(fr - 2.0 * uDpr)) * 0.5;
    // the degree bar: alternating ink and paper between the two lines
    float along = (abs(m0.x) < abs(m0.y) || abs(m1.x) < abs(m1.y)) ? w.y : w.x;
    float bar = step(fr, 7.0 * uDpr) * step(2.0 * uDpr, fr) * step(0.5, fract(along / 16.0));
    c = mix(c, vec3(0.23, 0.17, 0.11), max(line, bar * 0.75));
    frag = vec4(c, 1.0); return;
  }
  // wobble the shoreline a little, the way a hand would draw it
  vec2 q = w + (vec2(fbm(w * 0.7), fbm(w * 0.7 + 9.3)) - 0.5) * 0.45;
  float sd = texture(uCoast, uvOf(q)).r;                  // >0 land, <0 water, in cells
  float h = elev(w), hh = h - uSea;
  vec4 A = texture(uA, uvOf(w)), B = texture(uB, uvOf(w));
  vec4 C = texelFetch(uC, ivec2(clamp(floor(w), vec2(0), uMap - 1.0)), 0);
  int flags = int(C.g * 255.0 + 0.5);
  float lake = B.g;
  vec3 col = pap;
  bool water = sd < 0.0;
  float aa = px * 1.2;
  float landA = smoothstep(-aa, aa, sd);

  // --- the sea ---
  {
    float depth = clamp(-hh * 2.2, 0.0, 1.0);
    vec3 shallow = vec3(0.76, 0.85, 0.80), deep = vec3(0.56, 0.70, 0.74);
    vec3 sc = mix(shallow, deep, smoothstep(0.0, 0.7, depth));
    if (lake > 0.02) sc = vec3(0.60, 0.77, 0.80);
    vec3 s = wash(pap, sc, 0.86, w * 0.6);
    // engraved ripple lines along the shore, constant on screen
    float dpx = -sd / px / uDpr;                       // distance from the coast in CSS px
    float sp6 = 5.5, k = dpx / sp6;
    float ln = smoothstep(0.16, 0.0, abs(fract(k) - 0.5) - 0.32) * step(0.6, k) * smoothstep(9.0, 3.0, k);
    s = mix(s, s * vec3(0.55, 0.66, 0.70), ln * 0.55);
    // a darker rim right along the shore, the pigment pooling against the coast
    s *= 1.0 - 0.18 * smoothstep(18.0, 0.0, dpx);
    // sea ice
    float ice = smoothstep(0.4, 0.8, B.r);
    s = mix(s, vec3(0.93, 0.95, 0.97) * (0.95 + 0.05 * vn(w * 2.0)), ice * 0.85);
    // fish and plankton show as a faint green bloom on rich water
    vec4 F = texture(uCoarse, vec2(w.x / uMap.x, (w.y / uMap.y) * 0.5 + 0.5));
    s = mix(s, s * vec3(0.94, 1.03, 0.97), F.a * 0.25);
    col = s;
  }
  // --- the land ---
  vec3 land = pap; float forest = 0.0, rock = 0.0;
  {
    vec3 bc = biome(A, B, hh, w, forest, rock);
    land = wash(pap, bc, 0.9, w);
    // fields: a patchwork of strips at close range, a warm tint from afar
    // flags at full smoothness: fetch the four nearest cells once, blend each bit
    float farm, streets, ashM, fireM, lavaM; {
      vec2 f = w - 0.5, fi = floor(f), ff = fract(f);
      int c00 = int(texelFetch(uC, ivec2(clamp(fi, vec2(0), uMap - 1.0)), 0).g * 255.0 + 0.5);
      int c10 = int(texelFetch(uC, ivec2(clamp(fi + vec2(1, 0), vec2(0), uMap - 1.0)), 0).g * 255.0 + 0.5);
      int c01 = int(texelFetch(uC, ivec2(clamp(fi + vec2(0, 1), vec2(0), uMap - 1.0)), 0).g * 255.0 + 0.5);
      int c11 = int(texelFetch(uC, ivec2(clamp(fi + vec2(1, 1), vec2(0), uMap - 1.0)), 0).g * 255.0 + 0.5);
      float nz = (vn(w * 1.7) - 0.5) * 0.3;
      #define BIT(m) (mix(mix(float((c00 & m) != 0), float((c10 & m) != 0), ff.x), mix(float((c01 & m) != 0), float((c11 & m) != 0), ff.x), ff.y))
      farm = smoothstep(0.35, 0.65, BIT(1) + nz); streets = smoothstep(0.3, 0.7, BIT(2) + nz); ashM = smoothstep(0.3, 0.7, BIT(8) + nz); fireM = smoothstep(0.3, 0.7, BIT(4) + nz); lavaM = smoothstep(0.3, 0.7, BIT(64) + nz);
    }
    if (farm > 0.0) {
      vec2 cell = floor(w * 1.5 + vec2(vn(w * 0.3), 0.0)); float r = h21(cell);
      float stripes = 0.5 + 0.5 * sin((r > 0.5 ? w.x : w.y) * 18.0 + r * 6.0);
      vec3 fc = mix(vec3(0.86, 0.76, 0.42), vec3(0.72, 0.74, 0.40), r);
      if (r > 0.8) fc = vec3(0.80, 0.62, 0.38);
      if (uPhase > 0.75 || uPhase < 0.15) fc = mix(fc, vec3(0.62, 0.52, 0.38), 0.6);   // ploughed in winter
      float close = smoothstep(6.0, 14.0, uZoom / uDpr);
      vec3 plot = fc * (1.0 - close * 0.12 * stripes);
      land = mix(land, wash(pap, plot, 0.95, w * 2.0), farm * 0.85);
      // hedges between the plots, when you are close enough to see them
      vec2 g2 = fract(w * 1.5 + vec2(vn(w * 0.3), 0.0)); float hedge = 1.0 - smoothstep(0.0, 0.06, min(min(g2.x, 1.0 - g2.x), min(g2.y, 1.0 - g2.y)));
      land = mix(land, land * vec3(0.72, 0.78, 0.6), hedge * farm * close * 0.6);
    }
    land = mix(land, vec3(0.78, 0.70, 0.60) * pap, streets * 0.5);
    land = mix(land, vec3(0.52, 0.48, 0.44) * pap, ashM * 0.55);
    if (fireM > 0.0) { float fl = 0.6 + 0.4 * sin(uTime * 9.0 + h21(floor(w * 2.0)) * 6.28); land = mix(land, vec3(0.95, 0.36, 0.12), 0.75 * fl * fireM); }
    if (lavaM > 0.0) { float fl = 0.7 + 0.3 * sin(uTime * 3.0 + w.x); land = mix(land, mix(vec3(0.15, 0.08, 0.06), vec3(1.0, 0.42, 0.1), fl * smoothstep(0.3, 0.7, vn(w * 2.5 + uTime * 0.2))), lavaM); }
    // hill shading: light from the north-west, soft, like a wash of sepia
    float e = 0.7;
    float hx = elev(w + vec2(e, 0)) - elev(w - vec2(e, 0)), hy = elev(w + vec2(0, e)) - elev(w - vec2(0, e));
    float shade = clamp(-(hx * 0.9 + hy * 1.1) * 7.0, -1.0, 1.0);
    float relief = smoothstep(0.02, 0.25, hh);
    land *= 1.0 + shade * (0.10 + 0.22 * relief);
    land = mix(land, land * vec3(0.92, 0.88, 0.80), relief * 0.25);
    // forest edges: the wash pools darker where it stops
    float fe = clamp(length(vec2(dFdx(forest), dFdy(forest))) / px * 0.6, 0.0, 1.0);
    land *= 1.0 - fe * 0.18;
    // winter: snow lies on the land
    land = mix(land, vec3(0.95, 0.96, 0.97) * (0.92 + 0.08 * shade) * pap / vec3(0.95, 0.92, 0.84), smoothstep(0.35, 0.9, B.r) * (1.0 - smoothstep(0.35, 0.8, A.a) * 0.5) * 0.6);
  }
  col = mix(col, land, landA);

  // --- realms: a band of colour inside each border, a dotted line on it ---
  if (uLens == 0 || uLens == 6 || uLens == 9) {
    vec2 rw = w + (vec2(fbm(w * 0.5 + 4.0), fbm(w * 0.5 + 8.0)) - 0.5) * 1.2;
    vec4 R = texture(uRealm, uvOf(rw));
    int id = int(texelFetch(uRealm, ivec2(clamp(floor(rw), vec2(0), uMap - 1.0)), 0).r * 255.0 + 0.5);
    if (uLens == 9) { id = int(texelFetch(uRealm, ivec2(clamp(floor(rw), vec2(0), uMap - 1.0)), 0).a * 255.0 + 0.5); }
    float bd = (uLens == 9 ? R.b : R.g) * 32.0;                           // cells to the border
    if (id > 0 && sd > -1.5) {
      vec3 rc = uLens == 9 ? uFaith[(id - 1) & 15] : uPal[(id - 1) & 31];
      float bpx = bd / px / uDpr;                                           // in CSS px
      float band = smoothstep(uLens == 0 ? 9.0 : 16.0, 1.0, bpx);
      float fill = uLens == 0 ? 0.0 : 0.24;
      col = mulPaint(col, mix(vec3(1.0), rc, 0.9), clamp(fill + band * (uLens == 0 ? 0.3 : 0.4), 0.0, 0.8) * landA);
      // the border itself: short dashes of dark ink
      float dash = step(0.45, fract((w.x + w.y) * uZoom / uDpr / 7.0));
      float line = smoothstep(1.3, 0.3, bpx) * dash;
      col = mix(col, vec3(0.30, 0.20, 0.14), line * 0.7 * landA);
    }
  }

  // --- the coastline in ink ---
  {
    float lw = 0.9 * uDpr; float d = abs(sd) / px;
    float ink = smoothstep(lw + 0.8, lw - 0.4, d);
    col = mix(col, vec3(0.22, 0.17, 0.12), ink * 0.85);
  }

  // --- lenses ---
  if (uLens == 1) { float T = A.r * 80.0 - 40.0; vec3 hc = T < -10.0 ? mix(vec3(0.16,0.2,0.55), vec3(0.35,0.6,0.8), (T+30.0)/20.0) : T < 10.0 ? mix(vec3(0.35,0.6,0.8), vec3(0.93,0.93,0.8), (T+10.0)/20.0) : mix(vec3(0.93,0.93,0.8), vec3(0.75,0.15,0.1), clamp((T-10.0)/25.0, 0.0, 1.0)); col = mix(col, pap * hc * 1.1, 0.75); }
  else if (uLens == 2) { float m = A.g * 2.5; vec3 rc = mix(vec3(0.86,0.74,0.52), mix(vec3(0.45,0.66,0.42), vec3(0.15,0.35,0.5), smoothstep(0.9,1.8,m)), smoothstep(0.1,0.9,m)); col = mix(col, pap * rc * 1.1, 0.75 * landA); }
  else if (uLens == 5) { vec3 hc = hh < 0.0 ? mix(vec3(0.7,0.84,0.88), vec3(0.2,0.33,0.55), clamp(-hh*2.0,0.0,1.0)) : hh < 0.15 ? mix(vec3(0.55,0.72,0.45), vec3(0.85,0.8,0.55), hh/0.15) : mix(vec3(0.85,0.8,0.55), vec3(0.98,0.97,0.95), clamp((hh-0.15)/0.5,0.0,1.0)); col = mix(col, pap * hc * 1.08, 0.8); }
  else if (uLens == 7) { float mg = texture(uWorks, uvOf(w)).b; col = mix(col * vec3(0.8, 0.78, 0.86), vec3(0.62, 0.32, 0.86), smoothstep(0.1, 0.9, mg) * 0.8); }
  else if (uLens == 10) { vec4 E = texture(uCoarse, vec2(w.x / uMap.x, (w.y / uMap.y) * 0.5)); vec4 F = texture(uCoarse, vec2(w.x / uMap.x, (w.y / uMap.y) * 0.5 + 0.5)); vec3 lc = mix(vec3(0.95,0.92,0.8), vec3(0.35,0.62,0.22), smoothstep(0.0, 0.6, E.b)); lc = mix(lc, vec3(0.62,0.18,0.12), smoothstep(0.05, 0.6, E.a) * 0.7); vec3 sc2 = mix(vec3(0.78,0.86,0.88), vec3(0.2,0.45,0.6), clamp(F.r * F.a * 2.0, 0.0, 1.0)); sc2 = mix(sc2, vec3(0.35,0.3,0.55), clamp(F.g * 2.0, 0.0, 1.0) * 0.6); col = mix(col, pap * (landA > 0.5 ? lc : sc2), 0.7); }
  else if (uLens == 4) { int pl = int(C.b * 255.0 + 0.5); vec3 pc = uPal[(pl * 7 + 3) & 31]; col = mix(col, pap * pc, 0.5); float e1 = abs(dFdx(C.b)) + abs(dFdy(C.b)); col = mix(col, vec3(0.2, 0.1, 0.05), step(0.001, e1) * 0.7); }

  // the page darkens toward the frame, a little
  vec2 edge = min(w, uMap - w); float vig = smoothstep(0.0, 26.0, min(edge.x, edge.y));
  col *= 0.9 + 0.1 * vig;
  frag = vec4(col, 1.0);
}`;
