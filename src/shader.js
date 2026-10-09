// The map as pixel art: every cell is one crisp square, coloured by what grows there over a
// whole year (no seasons flickering across it), lit by its height against its neighbours. Close
// in, each square gets a few pixels of its own: trees, furrows, roofs, and the animals moving in
// it. Rivers and roads are drawn as cells too.
export const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

export const FRAG = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D uElev, uA, uB, uC, uD, uF;
uniform vec3 uFaith[16];
uniform vec3 uPal[32];
uniform vec3 uSpec[10];
uniform vec3 uZone[14];
uniform vec2 uRes, uCenter;
uniform float uZoom, uSea, uTime, uDpr;
uniform int uLens;
out vec4 o;
const ivec2 SZ = ivec2(512, 256);

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
ivec2 wrapc(ivec2 c){ return ivec2((c.x % SZ.x + SZ.x) % SZ.x, clamp(c.y, 0, SZ.y - 1)); }
float hAt(ivec2 c){ return texelFetch(uElev, wrapc(c), 0).r - uSea; }
vec4 A(ivec2 c){ return texelFetch(uA, wrapc(c), 0); }
vec4 B(ivec2 c){ return texelFetch(uB, wrapc(c), 0); }
vec4 C(ivec2 c){ return texelFetch(uC, wrapc(c), 0); }
vec4 F(ivec2 c){ return texelFetch(uF, wrapc(c), 0); }
int flagsAt(ivec2 c){ return int(C(c).g * 255. + .5); }

// land colour from the year-round climate and what grows there
vec3 landCol(float Tm, float mi, float g, float t, float hh, bool ice, float cell){
  if (ice) return vec3(.93, .95, .97);
  if (hh > .55) return mix(vec3(.66, .62, .58), vec3(.92, .93, .95), step(-2., -Tm) * .9 + step(.62, hh) * .6);
  if (hh > .38) return mix(vec3(.55, .50, .45), vec3(.48, .44, .40), cell);
  vec3 c;
  bool cold = Tm < 1.;
  if (t > .5) {                                   // forest
    c = Tm < 5. ? vec3(.17, .36, .26) : Tm > 21. ? (mi > 1.3 ? vec3(.07, .40, .20) : vec3(.36, .50, .20)) : vec3(.20, .46, .21);
    c *= .9 + .2 * (1. - t);
  } else if (mi < .2 && Tm > 6.) c = Tm > 17. ? vec3(.88, .76, .50) : vec3(.74, .69, .55);   // desert
  else if (mi > 1.7 && hh < .07) c = vec3(.30, .48, .38);                                   // marsh
  else if (cold) c = mix(vec3(.55, .58, .50), vec3(.62, .64, .55), cell);                   // tundra
  else {
    vec3 dry = Tm > 18. ? vec3(.75, .68, .36) : vec3(.70, .66, .44);
    vec3 lush = Tm > 18. ? vec3(.47, .64, .23) : vec3(.43, .62, .26);
    c = mix(dry, lush, clamp((mi - .25) / .8, 0., 1.) * clamp(g * 1.4, 0., 1.));
    c = mix(c, vec3(.33, .52, .24), clamp(t * 1.4, 0., .6));                                 // scattered trees
  }
  return c;
}
vec3 seaCol(float d){ return d < .02 ? vec3(.30, .58, .76) : d < .07 ? vec3(.21, .47, .70) : d < .2 ? vec3(.15, .36, .60) : d < .45 ? vec3(.11, .27, .50) : vec3(.08, .20, .40); }
vec3 heatPal(float t){ t = clamp(t, 0., 1.); vec3 a = vec3(.16,.20,.55), b = vec3(.35,.62,.80), c = vec3(.93,.93,.80), d = vec3(.93,.60,.25), e = vec3(.70,.12,.12);
  return t < .25 ? mix(a,b,t*4.) : t < .5 ? mix(b,c,(t-.25)*4.) : t < .75 ? mix(c,d,(t-.5)*4.) : mix(d,e,(t-.75)*4.); }
vec3 wetPal(float t){ t = clamp(t, 0., 1.); vec3 a = vec3(.86,.74,.52), b = vec3(.80,.82,.50), c = vec3(.36,.66,.42), d = vec3(.10,.42,.48), e = vec3(.10,.20,.45);
  return t < .25 ? mix(a,b,t*4.) : t < .5 ? mix(b,c,(t-.25)*4.) : t < .75 ? mix(c,d,(t-.5)*4.) : mix(d,e,(t-.75)*4.); }
float band(float v, float n){ return floor(v * n + .5) / n; }   // quantise, for that pixel look

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 wc = uCenter + (px - uRes * .5) / uZoom;
  if (wc.y < 0. || wc.y >= float(SZ.y)) { o = vec4(.05, .07, .10, 1.); return; }
  ivec2 c = ivec2(floor(wc)); c = wrapc(c);
  vec2 f = fract(wc);
  float cellPx = uZoom / uDpr;                    // how big one cell is on screen, in CSS px
  float hh = hAt(c);
  vec4 a = A(c), b = B(c), cc = C(c), ff = F(c);
  float Tm = a.r * 80. - 40., mi = a.g * 2.5, g = a.b, t = a.a;
  float lake = b.r, riv = b.g * 4.25, road = b.b;
  int fl = int(cc.g * 255. + .5);
  bool farm = (fl & 1) != 0, urban = (fl & 2) != 0, fire = (fl & 4) != 0, ash = (fl & 8) != 0, ice = (fl & 16) != 0, lava = (fl & 64) != 0;
  float rnd = hash(vec2(c));
  bool sea = hh < 0.;
  vec3 col;
  // light: this cell against the one up-left of it, in a few hard steps
  float slope = (hAt(c + ivec2(-1, -1)) - hAt(c + ivec2(1, 1))) * 9.;
  float lit = band(clamp(.5 + slope, 0., 1.), 4.);
  if (sea) {
    col = seaCol(-hh);
    // a lighter rim where the sea meets land
    bool coast = hAt(c + ivec2(1, 0)) >= 0. || hAt(c + ivec2(-1, 0)) >= 0. || hAt(c + ivec2(0, 1)) >= 0. || hAt(c + ivec2(0, -1)) >= 0.;
    if (coast) col = mix(col, vec3(.48, .74, .86), .55);
    if (ice) col = vec3(.86, .91, .95) - rnd * .04;
    if (cellPx > 7. && !ice) { float wv = step(.93, hash(floor(wc * 4.) + floor(uTime * .7))); col = mix(col, col + .08, wv); }
  } else {
    col = landCol(Tm, mi, g, t, hh, ice, rnd);
    col *= .96 + .08 * rnd;
    col *= .82 + .36 * lit;
    if (lake > .05) col = mix(vec3(.26, .55, .76), vec3(.18, .42, .66), step(.5, lake));
    // close in: each cell gets its own little picture
    if (cellPx >= 7. && lake <= .05) {
      vec2 sp = floor(f * 6.); float sh = hash(vec2(c) * 7. + sp);
      if (t > .45 && !farm && !urban && hh < .38) {            // trees: dark crowns with a lit side
        vec2 q = fract(f * 3.) - .5; float tr = length(q + (vec2(hash(vec2(c) + floor(f * 3.)), hash(vec2(c) * 3. + floor(f * 3.))) - .5) * .3);
        if (tr < .38 && hash(vec2(c) * 5. + floor(f * 3.)) < t) col = (q.x + q.y < -.1 ? col * 1.35 : col * .7);
      } else if (g > .4 && !farm && !urban && sh < .12) col *= 1.15;
      if (hh > .38 && hh <= .55 && sh < .2) col *= .85;
    }
    if (farm) {
      vec3 fc = mod(float(c.x * 3 + c.y * 7), 3.) < 1. ? vec3(.86, .76, .38) : mod(float(c.x + c.y * 5), 2.) < 1. ? vec3(.74, .70, .34) : vec3(.62, .66, .30);
      if (cellPx >= 7.) fc *= mod(floor((fl == 0 ? f.x : (c.x % 2 == 0 ? f.x : f.y)) * 6.), 2.) < 1. ? 1. : .86;
      col = fc * (.9 + .2 * lit);
    }
    if (urban) {
      col = vec3(.60, .55, .50);
      if (cellPx >= 7.) { vec2 sp = floor(f * 4.); float k = hash(vec2(c) * 3. + sp); col = k < .5 ? vec3(.70, .36, .26) : k < .8 ? vec3(.80, .76, .68) : vec3(.42, .40, .38); }
    }
    // rivers and roads are cells too
    if (riv > .5 && (riv > 1.5 || cellPx > 3.)) {
      vec3 rc = riv > 2.5 ? vec3(.20, .45, .72) : vec3(.29, .58, .82);
      if (cellPx >= 7. && riv < 2.5) { float w = abs(f.x - .5) < .3 || abs(f.y - .5) < .3 ? 1. : 0.; col = mix(col, rc, w); } else col = rc;
    }
    if (road > .1 && !urban && riv < .5 && cellPx > 2.5) { vec3 rd = vec3(.66, .55, .40); if (cellPx >= 7.) { float w = abs(f.x - .5) < .18 || abs(f.y - .5) < .18 ? 1. : 0.; col = mix(col, rd, w); } else col = mix(col, rd, .7); }
    if (ash) col = mix(col, vec3(.25, .23, .22), .7);
    if (fire) col = mod(floor(uTime * 6. + rnd * 10.), 2.) < 1. ? vec3(1., .45, .1) : vec3(1., .8, .3);
    if (lava) col = mod(floor(uTime * 3. + rnd * 10.), 2.) < 1. ? vec3(.95, .3, .05) : vec3(.6, .12, .04);
    // animals: grazers and hunters as specks moving about their cell
    if (cellPx >= 5. && uLens != 4 && uLens != 5) {
      float gz = ff.r * 2., hu = ff.g; int sp = int(ff.b * 255. + .5);
      vec2 sub = floor(f * 8.);
      for (int k = 0; k < 3; k++) {
        float fk = float(k);
        if (gz < .25 + fk * .45 && k > 0) break;
        if (gz < .12) break;
        float ph = uTime * (.15 + .1 * hash(vec2(c) + fk)) + hash(vec2(c) * 1.7 + fk) * 6.28;
        vec2 pos = floor((vec2(.5) + vec2(sin(ph), cos(ph * .8)) * .32 + (vec2(hash(vec2(c) + fk * 3.), hash(vec2(c) * 2. + fk)) - .5) * .3) * 8.);
        if (sub == pos || (cellPx >= 12. && sub == pos + vec2(1., 0.))) col = sp < 10 ? uSpec[sp] : vec3(.5, .4, .3);
      }
      if (hu > .12) { float ph = uTime * .4 + rnd * 6.28; vec2 pos = floor((vec2(.5) + vec2(cos(ph), sin(ph * 1.3)) * .35) * 8.); if (sub == pos) col = vec3(.18, .17, .2); }
    }
  }
  // lenses
  if (uLens == 1) col = heatPal((Tm + 30.) / 65.) * (sea ? .8 : .9 + .2 * lit);
  else if (uLens == 2) col = sea ? vec3(.18, .22, .30) : wetPal(mi / 2.2) * (.9 + .2 * lit);
  else if (uLens == 3) col = sea ? vec3(.18, .22, .30) : mix(vec3(.75, .66, .55), vec3(.25, .16, .08), clamp(cc.a * 1.5, 0., 1.));
  else if (uLens == 4) { float id = floor(cc.b * 255. + .5); vec3 pc = .45 + .4 * cos(6.2832 * (id * .137 + vec3(0., .33, .67))); col = sea ? pc * .55 : pc; if (C(c + ivec2(1, 0)).b != cc.b || C(c + ivec2(0, 1)).b != cc.b) col = vec3(.08); }
  else if (uLens == 5) col = sea ? seaCol(-hh) : mix(mix(vec3(.30, .55, .30), vec3(.85, .78, .50), clamp(hh * 3.5, 0., 1.)), vec3(.97), clamp((hh - .4) * 3., 0., 1.)) * (.85 + .3 * lit);
  else if (uLens == 7) { float m = cc.a; col = sea ? mix(vec3(.08, .08, .14), vec3(.30, .20, .45), m) : mix(vec3(.16, .14, .22), vec3(.80, .45, 1.), m); }
  else if (uLens == 10) { int z = int(ff.a * 255. + .5); col = sea ? vec3(.12, .16, .24) : uZone[z] * (.9 + .2 * lit); }
  else if (uLens == 11) { float gz = ff.r * 2., hu = ff.g; col = sea ? vec3(.10, .13, .20) : mix(vec3(.30, .27, .22), vec3(.52, .86, .32), sqrt(clamp(gz, 0., 1.))); if (!sea) col = mix(col, vec3(.80, .26, .18), clamp(hu * 1.4 - .1, 0., .6)); }
  // peoples: their land outlined in their colour (filled, in the Peoples lens)
  int own = int(cc.r * 255. + .5);
  if (!sea && uLens != 4 && uLens != 5 && uLens != 10 && uLens != 11 && uLens != 1 && uLens != 2) {
    if (uLens == 9) { ivec2 q = ivec2(c.x / 4, c.y / 4); int fid = int(texelFetch(uD, ivec2(q.x % 128, clamp(q.y, 0, 63)), 0).g * 255. + .5); if (fid > 0) col = mix(col, uFaith[(fid - 1) % 16], .6); }
    else if (own > 0) {
      vec3 pc = uPal[(own - 1) % 32];
      if (uLens == 6) col = mix(col * .6 + .1, pc, .6);
      bool edge = int(C(c + ivec2(1, 0)).r * 255. + .5) != own || int(C(c + ivec2(-1, 0)).r * 255. + .5) != own || int(C(c + ivec2(0, 1)).r * 255. + .5) != own || int(C(c + ivec2(0, -1)).r * 255. + .5) != own;
      if (edge) {
        if (cellPx < 6.) col = mix(col, pc, .75);
        else { bool e2 = (f.x < .18 && int(C(c + ivec2(-1, 0)).r * 255. + .5) != own) || (f.x > .82 && int(C(c + ivec2(1, 0)).r * 255. + .5) != own) || (f.y < .18 && int(C(c + ivec2(0, -1)).r * 255. + .5) != own) || (f.y > .82 && int(C(c + ivec2(0, 1)).r * 255. + .5) != own); if (e2) col = pc; }
      }
    }
  }
  // a faint grid when you are close enough to count cells
  if (cellPx >= 14.) { vec2 gd = min(f, 1. - f) * cellPx; if (min(gd.x, gd.y) < .6) col *= .94; }
  o = vec4(col, 1.);
}`;
