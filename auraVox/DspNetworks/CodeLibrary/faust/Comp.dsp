declare name "Bare FF Comp (AR parallel, safe)";
declare version "0.8.3";
import("stdfaust.lib");

EPS = 1e-20;
anti_denormal(x) = x + 1e-40;
dc_blocker(x) = x : fi.highpass(1, 2);

// ===== UI =====
thresh_dB  = hslider("Threshold [dB]", -18, -60,   0, 0.1) : si.smoo;
ratio      = hslider("Ratio",            4,   1,  20, 0.1) : si.smoo;
attack_ms  = hslider("Attack [ms]",     10, 0.1, 100, 0.1) : si.smoo;
release_ms = hslider("Release [ms]",   200,   5,1000,   5) : si.smoo;
makeup_dB  = hslider("Makeup [dB]",      0, -24,  24, 0.1) : si.smoo;
mix_pct    = hslider("Mix [%]",        100,   0, 100,   1) : si.smoo;
knee_dB    = hslider("Knee [dB]",        0,   0,  24, 0.1) : si.smoo; // 0 = 하드니(원본)

// ===== helpers =====
pos(x) = max(0.0, x);

// 병렬 A/R (안전)
ar_smooth_prl_safe(t, att_s, rel_s) = max(a, r) with {
  att = min(att_s, rel_s);
  rel = max(att_s, rel_s);
  pA  = ba.tau2pole(max(2e-5, att));
  pR  = ba.tau2pole(max(2e-5, rel));
  a   = t : si.smooth(pA);
  r   = t : si.smooth(pR);
};

// 소프트니 over(dB): 삼항 대신 불리언 게이트 사용
hard_over_dB(d) = max(0.0, d);
soft_over_dB(d, k) = hard_over_dB(d) * (k <= 0.0) + form * (k > 0.0)
with {
  a    = pos(d + 0.5*k);
  b    = pos(d - 0.5*k);
  form = (a*a - b*b) / (2.0*max(k, 1e-6));
};

// 게인 컴퓨터
gain_comp(x) = g_lin with {
  env_lin = abs(x) : si.smooth(ba.tau2pole(0.003));
  lvl_dB  = ba.linear2db(env_lin + EPS);
  d       = lvl_dB - thresh_dB;
  over_dB = soft_over_dB(d, knee_dB);
  slope   = 1.0 - 1.0 / max(1.001, ratio);
  gr_tgt  = over_dB * slope;
  gr_s    = ar_smooth_prl_safe(gr_tgt, attack_ms*1e-3, release_ms*1e-3);
  g_lin   = ba.db2linear(-gr_s);
};

// 채널 처리
proc_ch(x) = y with {
  dry = x; wet = x * gain_comp(x);
  m   = max(0.0, min(1.0, mix_pct/100.0));
  out = (dry*(1.0 - m) + wet*m) * ba.db2linear(makeup_dB);
  y   = out : dc_blocker : anti_denormal;
};

// GR 출력핀 (keep-alive 가드 유지)
meter_group(x) = vgroup("[2]Meters", x);
left_gr_meter  = meter_group(hbargraph("[0]Left GR [unit:dB]",  -30, 0));
right_gr_meter = meter_group(hbargraph("[1]Right GR [unit:dB]", -30, 0));

calc_gr_db(x) = gr_db with {
  env_lin = abs(x) : si.smooth(ba.tau2pole(0.003));
  lvl_dB  = ba.linear2db(env_lin + EPS);
  d       = lvl_dB - thresh_dB;
  over_dB = soft_over_dB(d, knee_dB);
  slope   = 1.0 - 1.0 / max(1.001, ratio);
  gr_tgt  = over_dB * slope;
  gr_s    = ar_smooth_prl_safe(gr_tgt, attack_ms*1e-3, release_ms*1e-3);
  gr_db   = (-gr_s) + 0.0*(env_lin - env_lin);
};

// 스테레오 + attach
proc_ch_L(x) = attach(proc_ch(x), calc_gr_db(x) : left_gr_meter);
proc_ch_R(x) = attach(proc_ch(x), calc_gr_db(x) : right_gr_meter);
process = proc_ch_L, proc_ch_R;
