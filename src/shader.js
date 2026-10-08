// The terrain is drawn by one fragment shader that reads the world's fields as textures.
// Smooth height (bicubic) gives clean hillshading at any zoom; close in, forests break into
// single trees and fields into furrows.
export const VERT = `#version 300 es
in vec2 p; void main(){ gl_Position = vec4(p, 0., 1.); }`;

export const FRAG = `#version 300 es
precision highp float;
uniform sampler2D uElev, uA, uB, uC, uD;
uniform vec3 uFaith[16];
uniform vec2 uRes, uCenter;
uniform float uZoom, uSea, uTime, uPhase;
uniform int uLens;
uniform vec3 uPal[32];
out vec4 o;
const vec2 SZ = vec2(512., 256.);

float hash12(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
vec2 hash22(vec2 p){ float n = hash12(p); return vec2(n, hash12(p + n + 17.1)); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.-2.*f);
  return mix(mix(hash12(i), hash12(i+vec2(1,0)), f.x), mix(hash12(i+vec2(0,1)), hash12(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0., w = .5; for(int k=0;k<4;k++){ a += w*vnoise(p); p = p*2.03 + 11.7; w *= .5; } return a; }

float elevAt(vec2 c){
  vec2 st = c - 0.5, i = floor(st), f = st - i, f2 = f*f, f3 = f2*f;
  vec2 w0 = (1. - 3.*f + 3.*f2 - f3)/6., w1 = (4. - 6.*f2 + 3.*f3)/6., w2 = (1. + 3.*f + 3.*f2 - 3.*f3)/6., w3 = f3/6.;
  vec2 g0 = w0 + w1, g1 = w2 + w3;
  vec2 p0 = (i - 0.5 + w1/g0)/SZ, p1 = (i + 1.5 + w3/g1)/SZ;
  return g0.y*(g0.x*texture(uElev, vec2(p0.x,p0.y)).r + g1.x*texture(uElev, vec2(p1.x,p0.y)).r)
       + g1.y*(g0.x*texture(uElev, vec2(p0.x,p1.y)).r + g1.x*texture(uElev, vec2(p1.x,p1.y)).r);
}
float detail(vec2 c, float zf){ return (fbm(c*1.3) - .5)*0.05 + (fbm(c*5.1) - .5)*0.016*zf; }
float heightD(vec2 c, float zf){ float h = elevAt(c) - uSea; return h + detail(c, zf)*smoothstep(-0.01, 0.07, h)*(0.35 + 2.2*max(h,0.)); }
vec4 cellAt(vec2 c){ return texelFetch(uC, ivec2(int(mod(floor(c.x), SZ.x)), int(clamp(floor(c.y), 0., SZ.y - 1.))), 0); }

float dAt(ivec2 p, int ch){ p.x = (p.x % 128 + 128) % 128; p.y = clamp(p.y, 0, 63); vec4 v = texelFetch(uD, p, 0); return floor((ch == 0 ? v.r : v.g)*255. + .5); }
// which region holds wc, and how firmly (.5 is the border), blended smoothly between texels
vec2 regionPick(vec2 wc, int ch){ vec2 c = wc/4. - .5, i = floor(c), f = c - i; f = f*f*(3. - 2.*f); ivec2 p = ivec2(i);
  vec4 ids = vec4(dAt(p, ch), dAt(p + ivec2(1,0), ch), dAt(p + ivec2(0,1), ch), dAt(p + ivec2(1,1), ch));
  vec4 wt = vec4((1. - f.x)*(1. - f.y), f.x*(1. - f.y), (1. - f.x)*f.y, f.x*f.y);
  float bid = 0., bm = 0.;
  for(int k = 0; k < 4; k++){ float id = ids[k]; if(id < .5) continue; float m = dot(wt, vec4(equal(ids, vec4(id)))); if(m > bm){ bm = m; bid = id; } }
  return vec2(bid, bm); }
vec3 heatPal(float t){ t = clamp(t, 0., 1.);
  vec3 a = vec3(.16,.20,.55), b = vec3(.35,.62,.80), c = vec3(.93,.93,.80), d = vec3(.93,.60,.25), e = vec3(.70,.12,.12);
  return t < .25 ? mix(a,b,t*4.) : t < .5 ? mix(b,c,(t-.25)*4.) : t < .75 ? mix(c,d,(t-.5)*4.) : mix(d,e,(t-.75)*4.); }
vec3 wetPal(float t){ t = clamp(t, 0., 1.);
  vec3 a = vec3(.86,.74,.52), b = vec3(.80,.82,.50), c = vec3(.36,.66,.42), d = vec3(.10,.42,.48), e = vec3(.10,.20,.45);
  return t < .25 ? mix(a,b,t*4.) : t < .5 ? mix(b,c,(t-.25)*4.) : t < .75 ? mix(c,d,(t-.5)*4.) : mix(d,e,(t-.75)*4.); }

void main(){
  vec2 px = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec2 wc = uCenter + (px - uRes*0.5)/uZoom;
  if(wc.y < 0. || wc.y > SZ.y){ float d = wc.y < 0. ? -wc.y : wc.y - SZ.y; o = vec4(mix(vec3(.09,.11,.14), vec3(.04,.05,.07), clamp(d/5., 0., 1.)), 1.); return; }
  vec2 uv = wc/SZ;
  float zf = smoothstep(4., 22., uZoom);
  float land = heightD(wc, zf);
  float e = 0.6;
  float hx = heightD(wc + vec2(e,0.), zf) - heightD(wc - vec2(e,0.), zf);
  float hy = heightD(wc + vec2(0.,e), zf) - heightD(wc - vec2(0.,e), zf);
  vec2 grad = vec2(hx, hy)/(2.*e);
  vec3 nrm = normalize(vec3(-grad*mix(11., 7., zf), 1.));
  float lit = dot(nrm, normalize(vec3(-.55, -.65, .52)));
  float sh = clamp(.5 + .9*(lit - .52), 0., 1.3);

  vec4 A = texture(uA, uv), B = texture(uB, uv), Cc = cellAt(wc);
  float temp = A.r*80. - 40., mi = A.g*2.5, grass = A.b, trees = A.a, snow = B.r, lake = B.g, green = B.b, tmean = B.a*80. - 40.;
  { vec2 q = vec2(.42)/SZ; lake = (lake*2. + texture(uB, uv + vec2(q.x, q.y)).g + texture(uB, uv + vec2(-q.x, q.y)).g + texture(uB, uv + vec2(q.x, -q.y)).g + texture(uB, uv - q).g)/6.; }
  int flags = int(Cc.g*255. + .5);
  bool fFarm = (flags & 1) != 0, fUrban = (flags & 2) != 0, fFire = (flags & 4) != 0, fAsh = (flags & 8) != 0, fIce = (flags & 16) != 0, fLava = (flags & 64) != 0;
  vec3 col; bool isSea = land < 0.;
  if(isSea){
    float d = -land;
    vec3 shallow = mix(vec3(.30,.56,.62), vec3(.33,.72,.72), smoothstep(8., 26., temp));
    col = mix(shallow, vec3(.13,.36,.54), smoothstep(0., .08, d));
    col = mix(col, vec3(.07,.20,.38), smoothstep(.06, .45, d));
    col *= .90 + .2*sh;
    float wv = sin(wc.x*9. + uTime*1.2 + sin(wc.y*7.)*2.)*sin(wc.y*11. - uTime*.9);
    col += .028*zf*wv;
    float si = smoothstep(.3, .8, snow)*(.86 + .14*vnoise(wc*.45));
    col = mix(col, vec3(.90,.94,.97), si);
    col = mix(col, vec3(.80,.92,.94), smoothstep(.014, 0., d)*.45*(1. - si));
  } else {
    float arid = 1. - smoothstep(.1, .55, mi);
    vec3 sand = mix(vec3(.85,.75,.55), vec3(.80,.62,.44), vnoise(wc*.07));
    vec3 dirt = mix(vec3(.62,.57,.44), vec3(.55,.51,.43), vnoise(wc*.31));
    vec3 ground = mix(dirt, sand, arid*smoothstep(6., 19., tmean));
    ground = mix(ground, vec3(.57,.59,.50), smoothstep(4., -7., tmean));
    vec3 gG = mix(vec3(.55,.70,.34), vec3(.34,.59,.27), smoothstep(.35, 1.5, mi));
    vec3 gc = mix(vec3(.78,.71,.43), gG, green);
    col = mix(ground, gc, smoothstep(.04, .65, grass));
    // forest
    vec3 fc = mix(vec3(.13,.33,.29), vec3(.18,.46,.24), smoothstep(0., 9., tmean));
    fc = mix(fc, vec3(.09,.39,.20), smoothstep(17., 23., tmean));
    float lat = (.5 - uv.y)*156.;
    float fall = lat > 0. ? smoothstep(.60,.72,uPhase)*smoothstep(.95,.84,uPhase) : smoothstep(.10,.22,uPhase)*smoothstep(.45,.34,uPhase);
    float decid = smoothstep(2., 7., tmean)*smoothstep(17., 12., tmean);
    fc = mix(fc, vec3(.74,.45,.15), fall*decid*.85);
    fc = mix(fc, vec3(.45,.40,.32), decid*smoothstep(3., -3., temp)*.65);
    float tr = smoothstep(.1, .72, trees);
    float zt = smoothstep(9., 17., uZoom);
    col = mix(col, fc, tr*(1. - zt*.55));
    if(zt > 0.01 && trees > .04){
      vec2 q = wc*3.2, qi = floor(q); float best = 9.; vec2 bo = vec2(0.); float br = 0.;
      for(int j=-1;j<=1;j++) for(int k=-1;k<=1;k++){
        vec2 cell = qi + vec2(float(j), float(k)); vec2 r = hash22(cell); vec2 pt = cell + .5 + (r - .5)*.8;
        float cover = texture(uA, (pt/3.2)/SZ).a;
        if(hash12(cell + 7.3) > cover*1.15 - .06) continue;
        float rad = .34 + .22*r.x; float dd = length(q - pt)/rad;
        if(dd < best){ best = dd; bo = (q - pt)/rad; br = r.y; }
      }
      if(best < 1.){ float lightSide = clamp(.5 - .5*(bo.x + bo.y)*.7, 0., 1.); vec3 tc = fc*(.72 + .55*lightSide)*(.9 + .2*br); col = mix(col, tc, zt*smoothstep(1., .82, best)); }
      else col *= 1. - .10*zt*tr;
    }
    float rock = smoothstep(.36, .6, land);
    col = mix(col, mix(vec3(.56,.53,.50), vec3(.48,.46,.45), vnoise(wc*.9)), rock);
    if(fFarm){
      vec2 blk = floor(wc/2.); float ang = hash12(blk)*3.14159; vec2 dir = vec2(cos(ang), sin(ang));
      float stripe = smoothstep(.35,.5,abs(fract(dot(wc, dir)*2.4) - .5)*2.);
      vec3 fcol = mix(mix(vec3(.82,.73,.38), vec3(.70,.62,.33), stripe), mix(vec3(.62,.72,.33), vec3(.50,.63,.28), stripe), green*.75);
      vec2 fe = abs(fract(wc) - .5); float edge = smoothstep(.44, .5, max(fe.x, fe.y))*zf;
      col = mix(col, fcol*(1. - .25*edge), .88);
    }
    if(fUrban){
      vec2 b = fract(wc*3.) - .5; float blocks = smoothstep(.36,.3,max(abs(b.x),abs(b.y)));
      vec3 ucol = mix(vec3(.66,.60,.53), mix(vec3(.80,.72,.62), vec3(.62,.44,.36), hash12(floor(wc*3.))), blocks*zf);
      col = mix(col, ucol, .92);
    }
    if(fAsh) col = mix(col, vec3(.22,.19,.18), .7);
    // snow lies in patches with a crisp edge, thicker on the shaded side, rather than as a haze
    float sraw = snow + smoothstep(.5, .75, land)*.5 + (vnoise(wc*1.7) - .5)*.32 + (fbm(wc*4.3) - .5)*.18*zf - (sh - .6)*.12;
    float sn = smoothstep(.40, .40 + .06 + .14*(1. - zf), sraw);
    col = mix(col, vec3(.95,.96,.98), sn);
    col = mix(col, mix(vec3(.90,.94,.98), vec3(.80,.88,.95), fbm(wc*.35)), smoothstep(.9, .99, snow)*.85);
    if(lake > .085){ float ld = (lake - .085)*1.5; col = mix(mix(vec3(.36,.62,.72), vec3(.16,.40,.60), clamp(ld*2.5,0.,1.)), vec3(.92,.95,.97), smoothstep(.5,.9,snow)); sh = mix(sh, 1., .8); }
    col *= mix(.60, 1.30, clamp(sh, 0., 1.));
    if(fFire){ float fl = vnoise(wc*4. + uTime*5.); col = mix(vec3(1.,.42,.08), vec3(1.,.86,.35), fl); }
    if(fLava){ float fl = fbm(wc*2.5 + vec2(uTime*.3, 0.)); col = mix(vec3(.95,.25,.05), vec3(1.,.80,.30), fl); }
  }
  // coastline
  float gmag = length(grad);
  float cdist = abs(land)/(gmag + 1e-4)*uZoom;
  col = mix(col, vec3(.09,.19,.26), (1. - smoothstep(.5, 1.7, cdist))*.5*step(gmag, 5.));

  // lenses
  if(uLens > 0){
    vec3 lc = col;
    float gray = dot(col, vec3(.3,.5,.2));
    if(uLens == 1) lc = heatPal((temp + 30.)/65.);
    else if(uLens == 2) lc = isSea ? vec3(.22,.27,.36) : wetPal(mi/2.2);
    else if(uLens == 3) lc = isSea ? vec3(.22,.27,.36) : mix(vec3(.75,.66,.55), vec3(.25,.16,.08), clamp(Cc.a*1.5, 0., 1.));
    else if(uLens == 4){ float id = floor(Cc.b*255. + .5); vec3 pc = .45 + .4*cos(6.2832*(id*.137 + vec3(0.,.33,.67))); lc = isSea ? pc*.55 : pc;
      vec4 r1 = cellAt(wc + vec2(1.,0.)), r2 = cellAt(wc + vec2(0.,1.)); if(r1.b != Cc.b || r2.b != Cc.b) lc = vec3(.08); }
    else if(uLens == 5) lc = isSea ? mix(vec3(.55,.75,.85), vec3(.10,.18,.40), clamp(-land*2.2,0.,1.)) : mix(mix(vec3(.45,.62,.38), vec3(.86,.80,.55), clamp(land*4.,0.,1.)), vec3(.98), clamp((land-.3)*2.5,0.,1.));
    else if(uLens == 7){ vec2 st = wc - .5, fi = floor(st), ff = st - fi; float m = mix(mix(cellAt(fi + .5).a, cellAt(fi + vec2(1.5,.5)).a, ff.x), mix(cellAt(fi + vec2(.5,1.5)).a, cellAt(fi + 1.5).a, ff.x), ff.y);
      lc = isSea ? mix(vec3(.10,.10,.16), vec3(.30,.20,.45), clamp(m*1.2,0.,1.)) : mix(vec3(.16,.14,.22), vec3(.80,.45,1.), clamp(m*1.4, 0., 1.)); lc += vec3(.25,.2,.3)*smoothstep(.55,.6,m)*smoothstep(.66,.6,m); }
    if(uLens == 6 || uLens == 9) col = mix(vec3(gray)*.9 + .08, col, .25); else col = lc*(isSea ? 1. : mix(.72, 1.18, clamp(sh,0.,1.)));
  }
  // realms (or faiths, in that lens) as smooth regions: a faint wash and a clean border line
  int ch = uLens == 9 ? 1 : 0;
  vec2 rg = regionPick(wc, ch); float rid = rg.x, m = rg.y, fw = fwidth(m);
  if(rid > .5 && !isSea && uLens != 4 && uLens != 5){
    vec3 pc = ch == 1 ? uFaith[int(mod(rid - 1., 16.))] : uPal[int(mod(rid - 1., 32.))];
    bool strong = uLens == 6 || uLens == 9;
    float inside = smoothstep(.38, .62, m), line = 1. - smoothstep(fw*.6, fw*2.4 + .004, abs(m - .5));
    col = mix(col, pc, (strong ? .5 : .07)*inside);
    col = mix(col, pc*(strong ? .7 : .9), line*(strong ? .95 : .75));
  }
  o = vec4(col, 1.);
}`;
