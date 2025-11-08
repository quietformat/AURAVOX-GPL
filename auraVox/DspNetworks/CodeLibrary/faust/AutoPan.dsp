declare name "AutoPan_Simple_v1";
import("stdfaust.lib");

// ================= UI =================
ap(x)   = hgroup("AUTOPAN", x);
rateHz  = ap(hslider("Rate [Hz]",    1.00, 0.01, 10.0, 0.01));
depthPct= ap(hslider("Depth [%]",      70,    0, 100, 1));
mixPct  = ap(hslider("Mix [%]",       100,    0, 100, 1));
shape   = ap(hslider("Shape[style:menu{'Sine','Triangle'}]", 0, 0, 1, 1)); // 0=Sine,1=Tri

// ================= Helpers =================
clamp01(x) = max(0.0, min(1.0, x));
mixf       = mixPct/100.0;

// LFO (-1..+1)
lfo_sin = os.osc(rateHz);
lfo_tri = os.lf_triangle(rateHz);
lfo_raw = select2(shape, lfo_sin, lfo_tri) : si.smooth(0.002);

// 팬 포지션 p (0..1)를 LFO로 모듈레이션 (중심 0.5)
depth = min(0.5, depthPct/200.0);                 // 최대 진폭 = 0.5 (끝↔끝)
p     = clamp01(0.5 + depth * lfo_raw);

// 상수전력 게인 (부드러운 크로스페이드)
gL = cos(p * ma.PI/2.0);
gR = sin(p * ma.PI/2.0);

// ================= Process (stereo) =================
// 스테레오 밸런스 오토팬: 각 채널을 gL/gR로 가중
process(inL, inR) =
  outL, outR
with {
  panL = inL * gL;
  panR = inR * gR;
  outL = inL*(1.0 - mixf) + panL*mixf;
  outR = inR*(1.0 - mixf) + panR*mixf;
};