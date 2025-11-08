declare name "StereoSpread_Simple_v1";
import("stdfaust.lib");

// ================= UI =================
grp(x)    = hgroup("SPREAD", x);                // ← sp → grp 로 변경
widthPct  = grp(hslider("Width [%]", 100, 0, 200, 1)); // 100=원음, 0=모노, 200=사이드 2배
mixPct    = grp(hslider("Mix [%]",   100, 0, 100, 1)); // 드라이/웻 블렌드

// ================= Helpers =================
mixf      = mixPct/100.0;
k         = widthPct/100.0;
norm      = 1.0/sqrt(2.0);
softlim(x)= ma.tanh(x*0.99) / max(1e-6, ma.tanh(0.99));

// ================= Process (stereo) =================
process(inL, inR) = outL, outR
with {
  // Mid/Side
  M  = (inL + inR) * norm;   // Mid
  S  = (inL - inR) * norm;   // Side
  S2 = S * k;                // Width 적용

  // 재합성
  Lw = (M + S2) * norm;
  Rw = (M - S2) * norm;

  // 소프트 안전
  Ls = softlim(Lw);
  Rs = softlim(Rw);

  // 드라이/웻 블렌드  (오타: inRx → inR 수정)
  outL = inL*(1.0 - mixf) + Ls*mixf;
  outR = inR*(1.0 - mixf) + Rs*mixf;
};