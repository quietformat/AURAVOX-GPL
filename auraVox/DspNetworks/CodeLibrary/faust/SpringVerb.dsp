declare name "StereoSpringVerb_v1";
import("stdfaust.lib");    // maths, delays, filters 포함

// =============== UI ===============
gr(x)     = hgroup("SPRING", x);
mixPct    = gr(hslider("Mix [%]",        20,   0, 100, 1));
pre_ms    = gr(hslider("PreDelay [ms]",   8,   0,  60, 0.1));
decay_s   = gr(hslider("Decay [s]",     1.8, 0.3, 6.0, 0.1));
dampHz    = gr(hslider("Damping LPF [Hz]", 5500, 800, 12000, 10));
colorHz   = gr(hslider("Color HPF [Hz]",   180,  20,   800, 1));
boing     = gr(hslider("Boing",          0.15, 0.0, 1.0, 0.01));

// =============== Helpers ===============
ms(n)      = n*ma.SR/1000.0;
clip1(x)   = min(1.0, max(-1.0, x));
mixf       = (mixPct/100.0) : si.smooth(0.02);
preSamps   = max(0, min(int(ms(pre_ms)), int(ms(80.0))-2));
predelay(x)= x : de.fdelay(int(ms(80.0)), preSamps);

rt60_to_fb(dMainSamps, T) = pow(0.001, dMainSamps/(ma.SR*T));
lp1(fc) = fi.lowpass(1, fc);
hp1(fc) = fi.highpass(1, fc);
apCoef  = 0.7*boing + 1e-5;
softlim = _ : (ma.tanh(_*0.8) / max(1e-6, ma.tanh(0.8)));

// =============== Tank ===============
tank(dMain_ms, a1_ms, a2_ms, a3_ms, inSig) = wet
with {
  dMain  = int(ms(dMain_ms));
  a1d    = int(ms(a1_ms));
  a2d    = int(ms(a2_ms));
  a3d    = int(ms(a3_ms));
  maxD   = int(ms(200));

  disper = fi.allpass_comb(4096, a1d, apCoef)
         : fi.allpass_comb(4096, a2d, apCoef*0.9)
         : fi.allpass_comb(4096, a3d, apCoef*0.8);

  loopPath = de.fdelay(maxD, dMain)
           : disper
           : hp1(colorHz)
           : lp1(dampHz);

  fb = min(0.98, rt60_to_fb(dMain, decay_s));

  rec  = inSig : (+ ~ ( loopPath : *(fb) ));
  wet  = loopPath(rec);
};

// =============== Process (2-in / 2-out) ===============
process(inL, inR) = outL, outR with {
  preL = predelay(inL);
  preR = predelay(inR);

  // 서로 다른 지연으로 데코릴레이션
  wetL = tank(62.0, 3.1, 5.7, 7.9, preL);
  wetR = tank(74.0, 2.8, 6.3, 8.5, preR);

  outL = (inL*(1.0-mixf) + wetL*mixf) : fi.dcblocker : softlim : clip1;
  outR = (inR*(1.0-mixf) + wetR*mixf) : fi.dcblocker : softlim : clip1;
};