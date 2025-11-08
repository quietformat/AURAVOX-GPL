Content.makeFrontInterface(1000, 700);

const var LevelMeter  = Content.getComponent("LevelMeter"); // dB 미터
const var SimpleGain1 = Synth.getEffect("SimpleGain1");     // 프로젝트 이름 확인


// ================= Helpers =================
inline function round1(x) { return Math.round(x * 10) / 10; }
inline function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
inline function isFiniteNumber(x) { return (x == x) && (x != 1/0) && (x != -1/0); }

// ================= Output Level Meter =================
const var ATTACK_RATE = 2.00;
const var DECAY_RATE = 0.95;
var curLevel = 0.0;

const var tLevel = Engine.createTimerObject();
tLevel.setTimerCallback(function()
{
    if (!isDefined(SimpleGain1) || !isDefined(LevelMeter)) return;

    // L/R 평균 (가드)
    var l = SimpleGain1.getCurrentLevel(0);
    var r = SimpleGain1.getCurrentLevel(1);
    if (!isFiniteNumber(l)) l = 0.0;
    if (!isFiniteNumber(r)) r = 0.0;

    var Level = (l + r) * 0.5;

    // Peak hold + decay
    if (Level > curLevel) curLevel = Level;
    else                  curLevel *= DECAY_RATE;

    // dB 변환: -inf 방지용 바닥값 적용
    var dB = Engine.getDecibelsForGainFactor(Math.max(curLevel, 1e-9));
    LevelMeter.setValue(dB);
});
tLevel.startTimer(50);

// ================= Optional Cleanup =================
// UI 언로드(창 닫힘 등) 시 타이머 정지. 환경 훅에서 이 함수를 호출하세요.
inline function __opt62StopTimers()
{
    if (isDefined(tKnob))  tKnob.stopTimer();
    if (isDefined(tLevel)) tLevel.stopTimer();
}


// ===== Components =====
const var MagicBtn    = Content.getComponent("MagicBtn");

const var SyncLknob   = Content.getComponent("SyncLknob");
const var syncRknob   = Content.getComponent("syncRknob");
const var echoVolKnob = Content.getComponent("echoVolKnob");
const var LPknob      = Content.getComponent("LPknob");
const var HPknob      = Content.getComponent("HPknob");
const var DecayKnob   = Content.getComponent("DecayKnob");

const var ChorusBtn   = Content.getComponent("ChorusBtn");
const var VerbTypeBtn = Content.getComponent("VerbTypeBtn");

// ===== Processor =====
const var Delay1 = Synth.getEffect("Delay1");
Console.print("Delay1 = " + (Delay1 ? "OK" : "NULL")); // NULL이면 Processor ID 확인

// ===== Bind (존재하는 속성만) =====
inline function bindKnob(c, pid, mn, mx, st)
{
    if (!c) return;
    c.set("min", mn); c.set("max", mx); c.set("stepSize", st);
    c.set("processorId", "Delay1"); c.set("parameterId", pid);
    c.set("saveInPreset", true);
}
inline function bindToggle(c, pid)
{
    if (!c) return;
    c.set("isMomentary", false);
    c.set("processorId", "Delay1"); c.set("parameterId", pid);
    c.set("saveInPreset", true);
}

bindKnob(SyncLknob,   "syncL",   4.0, 14.0, 1.0);
bindKnob(syncRknob,   "syncR",   4.0, 14.0, 1.0);
bindKnob(echoVolKnob, "echoVol", 0.0, 1.0,  0.01);
bindKnob(LPknob,      "LP",      0.0, 1.0,  0.01);
bindKnob(HPknob,      "HP",      0.0, 1.0,  0.01);
bindKnob(DecayKnob,   "decay",   0.0, 1.0,  0.01);

bindToggle(ChorusBtn,   "Chorus");
bindToggle(VerbTypeBtn, "VerbType"); // 최종 정리에서 VerbType 사용

// ===== Random helpers =====
inline function rInt(lo, hi) { return lo + Math.randInt(0, hi - lo + 1); }
inline function rStep(mn, mx, st)
{
    if (st <= 0.0) return mn + (mx - mn) * (Math.randInt(0,100000)/100000.0);
    local n = Math.round((mx - mn)/st);
    return mn + Math.randInt(0, n) * st;
}

inline function applyBoth(uiComp, paramId, val)
{
    if (uiComp) { uiComp.setValue(val); uiComp.changed(); uiComp.repaint(); }
    if (Delay1)
    {
        local idx = Delay1.getAttributeIndex(paramId);
        if (idx >= 0) Delay1.setAttribute(idx, val);
    }
}

// ===== One-shot randomizer =====
function randomizeAll() // 전역(문자열 콜백 호환)
{
    applyBoth(SyncLknob,   "syncL",   rInt(4,14));
    applyBoth(syncRknob,   "syncR",   rInt(4,14));
    applyBoth(echoVolKnob, "echoVol", rStep(0.0,1.0,0.01));
    applyBoth(LPknob,      "LP",      rStep(0.0,1.0,0.01));
    applyBoth(HPknob,      "HP",      rStep(0.0,1.0,0.01));
    applyBoth(DecayKnob,   "decay",   rStep(0.0,1.0,0.01));
    applyBoth(ChorusBtn,   "Chorus",  Math.randInt(0,2));   // 0/1
    applyBoth(VerbTypeBtn, "VerbType",Math.randInt(0,2));   // 0/1
    Console.print("Randomized.");
}

// ===== MagicBtn edge-detect by timer (no callbacks) =====
const var __mbTimer = Engine.createTimerObject();
var __mbLast = 0;

__mbTimer.setTimerCallback(function()
{
    var v = MagicBtn ? MagicBtn.getValue() : 0;
    if (v == 1 && __mbLast == 0) randomizeAll();
    __mbLast = v;
});
__mbTimer.startTimer(30); // ms

// ===== MagicBtn 기본 속성만 설정 =====
if (MagicBtn) { MagicBtn.set("isMomentary", true); MagicBtn.set("saveInPreset", false); }

// ===== 더미(혹시 Inspector에 남아있을 옛 문자열 콜백을 조용히 처리) =====
function pushUIAndDSP() { randomizeAll(); }
function onMagic()      { randomizeAll(); }


function onNoteOn()
{
	
}
 function onNoteOff()
{
	
}
 function onController()
{
	
}
 function onTimer()
{
	
}
 function onControl(number, value)
{
	
}
 