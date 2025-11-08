declare name "PlateVerb_Dattorro_Wrapper";
import("stdfaust.lib");
re = library("reverbs.lib");   // 네가 붙인 reverbs.lib 사용

// ================== UI ==================
grp(x)   = hgroup("PLATE (Dattorro)", x);
mixUI    = grp(hslider("Mix [%]",         20,    0, 100, 1));
preMsUI  = grp(hslider("PreDelay [ms]",     8,    0,  80, 0.1));

// Dattorro 파라미터(0..1 권장 범위)
bwUI     = grp(hslider("Bandwidth (pre)", 0.9995, 0.90, 0.9999, 0.0001)); // 입력 대역폭
iDiff1UI = grp(hslider("Input Diff 1",     0.75,   0.0,  1.0, 0.01));
iDiff2UI = grp(hslider("Input Diff 2",     0.625,  0.0,  1.0, 0.01));
decayUI  = grp(hslider("Decay (0..1)",     0.50,   0.0,  0.98, 0.001));   // 1.0=무한 주의
dDiff1UI = grp(hslider("Decay Diff 1",     0.70,   0.0,  1.0, 0.01));
dDiff2UI = grp(hslider("Decay Diff 2",     0.50,   0.0,  1.0, 0.01));
dampUI   = grp(hslider("HF Damping",       0.0005, 0.0,  0.02, 0.0001));

// ================== Helpers ==================
ms(n)          = n*ma.SR/1000.0;
clip1(x)       = min(1.0, max(-1.0, x));
mixf           = (mixUI/100.0) : si.smooth(0.03);   // 30 ms로 팝 방지
preSamps       = max(0, min(int(ms(preMsUI)), int(ms(100.0))-2));

// 프리딜레이(런타임 조절 가능)
predelay2(x)   = del(x) with {
  del = de.fdelay(int(ms(100.0)), preSamps);
};

// ================== Process ==================
process(inL, inR) = outL, outR with {
  // Dattorro 코어 호출 (pre_delay=0). 채널 분리는 라우팅으로.
  wetL = ( predelay2(inL), predelay2(inR)
         : re.dattorro_rev(0, bwUI, iDiff1UI, iDiff2UI,
                              decayUI, dDiff1UI, dDiff2UI, dampUI)
         : _,! );   // 왼쪽만 통과

  wetR = ( predelay2(inL), predelay2(inR)
         : re.dattorro_rev(0, bwUI, iDiff1UI, iDiff2UI,
                              decayUI, dDiff1UI, dDiff2UI, dampUI)
         : !,_ );   // 오른쪽만 통과

  // Dry/Wet + DC 차단 + 안전 클리핑
  outL = (inL*(1.0 - mixf) + wetL*mixf) : fi.dcblocker : clip1;
  outR = (inR*(1.0 - mixf) + wetR*mixf) : fi.dcblocker : clip1;
};