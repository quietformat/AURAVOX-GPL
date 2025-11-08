declare name "StereoDelay_Tape_fixed";
import("stdfaust.lib");

// ================= UI (grouped to avoid control collision) =================
deGroup(x) = hgroup("DELAY", x);   // Delay controls
moGroup(x) = hgroup("MODE",  x);   // Mode selector

time   = deGroup(hslider("Time [ms]",   500, 1, 2000, 1));
glide  = deGroup(hslider("Glide [ms]",   50, 0,  300, 1));   // time change smoothing
fb     = deGroup(hslider("Feedback",   0.35, 0, 0.90, 0.01));
wet    = deGroup(hslider("Mix [%]",      30, 0,  100, 1));

/* RE-201 style 12-step selector (요청 맵)
   1: Echo OFF (6 o'clock)
   2: H1
   3: H2
   4: H3
   5: H1+H2
   6: H2+H3
   7: H1+H3
   8: H1+H2          // ← 수정: 원래 H1+H2+H3였던 것을 H1+H2로 변경
   9: H1 + (REV)
  10: H2 + (REV)
  11: H3 + (REV)
  12: H1+H2+H3 + (REV)
*/
headMode = moGroup(hslider(
  "Mode 12-step[style:menu{'1','2','3','4','5','6','7','8','9','10','11','12'}]",
  8, 1, 12, 1));

// ================= Multi-Tap (3-Head) =================
h1r = 1.00; h2r = 1.67; h3r = 2.33;
eqi(a,b) = (a==b);

// raw gains per mode
// 1은 어떤 헤드도 활성화되지 않으므로 에코 OFF
g1_raw = eqi(headMode,2) + eqi(headMode,5) + eqi(headMode,7) + eqi(headMode,8) + eqi(headMode,9)  + eqi(headMode,12);
g2_raw = eqi(headMode,3) + eqi(headMode,5) + eqi(headMode,6) + eqi(headMode,8) + eqi(headMode,10) + eqi(headMode,12);
// ↓↓ 수정: 8번을 제외해서 H3가 켜지지 않게 함
g3_raw = eqi(headMode,4) + eqi(headMode,6) + eqi(headMode,7) /* + eqi(headMode,8) 제거 */ + eqi(headMode,11) + eqi(headMode,12);

// normalize so sum<=1 (안정/레벨)
den = max(1.0, g1_raw + g2_raw + g3_raw);
g1 = g1_raw / den;
g2 = g2_raw / den;
g3 = g3_raw / den;

// ================= Helpers =================
ms(n)        = n*ma.SR/1000.0;
maxDelay     = int(ms(2000));               // 2s buffer
wetf         = wet/100.0;

// smoothed base time in samples
time_s       = time : si.smoo : si.smooth(glide/1000.0);
baseSamps    = ms(time_s);

// clamps
clipSamps(n) = max(1.0, min(maxDelay-2.0, n));

// per-head sample delays
d1 = clipSamps(baseSamps*h1r);
d2 = clipSamps(baseSamps*h2r);
d3 = clipSamps(baseSamps*h3r);

// sum of selected heads
fbPath(sig) =
    (sig : de.fdelay(maxDelay, d1)) * g1
  + (sig : de.fdelay(maxDelay, d2)) * g2
  + (sig : de.fdelay(maxDelay, d3)) * g3;

// single-channel multi-tap tape delay
delayline(x) = wetOut
with {
  // rec = x + fb * taps(rec)   (causal loop via ~)
  rec    = x : (+ ~ ( fbPath : *(fb) ));
  wetOut = fbPath(rec); // audible taps regardless of fb
};

// ================= I/O (mono) =================
process(x) = x*(1.0-wetf) + delayline(x)*wetf;
