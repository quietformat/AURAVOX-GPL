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
tLevel.startTimer(30);

// ================= Optional Cleanup =================
// UI 언로드(창 닫힘 등) 시 타이머 정지. 환경 훅에서 이 함수를 호출하세요.
inline function __opt62StopTimers()
{
    if (isDefined(tKnob))  tKnob.stopTimer();
    if (isDefined(tLevel)) tLevel.stopTimer();
}



// ===== Target components =====
const var MagicBtn        = Content.getComponent("MagicBtn");        // momentary
const var VerbTypeBtn     = Content.getComponent("VerbTypeBtn");     // toggle 0/1
const var ModeSlectorKnob = Content.getComponent("ModeSlectorKnob"); // 6..12, step 1

// ===== Processor bindings =====
if (VerbTypeBtn)
{
    VerbTypeBtn.set("saveInPreset", true);
    VerbTypeBtn.set("processorId", "Delay1");
    VerbTypeBtn.set("parameterId", "VerbType7");
}

if (ModeSlectorKnob)
{
    ModeSlectorKnob.set("min", 6.0);
    ModeSlectorKnob.set("max", 12.0);
    ModeSlectorKnob.set("stepSize", 1.0);
    ModeSlectorKnob.set("saveInPreset", true);
    ModeSlectorKnob.set("processorId", "Delay1");
    ModeSlectorKnob.set("parameterId", "modSeletor"); // spelling as given
}

// ===== Helpers =====
inline function randIntInclusive(lo, hi)
{
    return lo + Math.randInt(0, hi - lo + 1); // inclusive
}

// ===== CORE LOGIC (inline; used for pointer callback) =====
// 1) 실제 동작은 inline 함수로 (setControlCallback가 요구)
inline function __MB_logic_impl(component, value) {
    if (component != MagicBtn || value != 1) return;

    if (VerbTypeBtn) {
        VerbTypeBtn.setValue( Math.randInt(0, 2) ); // 0 or 1
        VerbTypeBtn.changed(); VerbTypeBtn.repaint();
    }
    if (ModeSlectorKnob) {
        ModeSlectorKnob.setValue( 6 + Math.randInt(0, 7) ); // 6..12
        ModeSlectorKnob.changed(); ModeSlectorKnob.repaint();
    }
}

// 2) Inspector가 문자열로 부르는 전역 함수(이름을 콘솔 에러 그대로 맞춤)
function __MB_logic(component, value) {
    __MB_logic_impl(component, value);   // 전역 → inline 위임
}

// 3) 런타임 포인터 콜백 등록은 inline 쪽으로
if (MagicBtn)
    MagicBtn.setControlCallback(__MB_logic_impl);

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
 