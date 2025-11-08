Content.makeFrontInterface(943, 609);

const var TimeLinkButton = Content.getComponent("TimeLinkButton");
const var TimeL          = Content.getComponent("TimeL");
const var TimeR          = Content.getComponent("TimeR");

const var SyncLinkButton = Content.getComponent("SyncLinkButton");
const var SyncL          = Content.getComponent("SyncL");
const var SyncR          = Content.getComponent("SyncR");

const var Delay1         = Synth.getEffect("Delay1");

// === Button5 (모멘터리) 핸들 ===
const var Button5        = Content.getComponent("Button5");

const var SyncFreeBtn = Content.getComponent("SyncFreeBtn");
const var FreePanel   = Content.getComponent("FreePanel");

// --- TimeLinkButton ↔ SyncLinkButton 상호 동기화 가드/헬퍼 ---
var _pairLinkGuard = false;
inline function setLinkedButton(btn, v)
{
    if (btn.getValue() == v) return; // 불필요한 트리거 방지
    _pairLinkGuard = true;
    btn.setValue(v);
    btn.changed();                    // 상대 콜백 실행되지만 가드로 재귀 차단
    _pairLinkGuard = false;
}

// ================== Button5 펄스 유틸 ==================
const var Btn5Pulse = Engine.createTimerObject();
var _btn5Busy  = false;
var _initSyncFree = false; // 초기화 단계 가드

Btn5Pulse.setTimerCallback(function()
{
    // release
    Button5.setValue(0);
    Button5.changed();
    _btn5Busy = false;
    Btn5Pulse.stopTimer();
});

// ms 동안 눌렀다(1) → 원래(0)로 복귀
inline function pressButton5Pulse(ms)
{
    if (_btn5Busy) return;
    _btn5Busy = true;

    // press
    Button5.setValue(1);
    Button5.changed();

    Btn5Pulse.startTimer(ms|50); // 30~60ms 권장
}

// ===== Sync/Free 버튼 콜백 (연동 + 원래 기능 유지) =====
inline function onSyncFreeBtnControl(c, v)
{
    // 팝업 표시/숨김
    FreePanel.set("visible", v ? true : false);

    // Delay1의 sync_free 파라미터 연동 (0/1 그대로 전달)
    Delay1.setAttribute(Delay1.sync_free, v);

    // 초기 세팅 호출에는 반응하지 않도록 1회 가드
    if (_initSyncFree)
        pressButton5Pulse(90);  // ← Button5 강제 ‘클릭’ (바이패스→복귀 트리거)
    else
        _initSyncFree = true;
}
SyncFreeBtn.setControlCallback(onSyncFreeBtnControl);

// ===== 기본값: 켜진 상태로 시작 (초기 가드 덕분에 펄스 안 남) =====
SyncFreeBtn.setValue(1);
onSyncFreeBtnControl(SyncFreeBtn, 1);

// ===== Time 링크 (동기화 포함)
inline function onTimeLControl(component, value)
{
    Delay1.setAttribute(Delay1.timeL2, value);

    if (TimeLinkButton.getValue())
    {
        TimeR.setValue(value);
        Delay1.setAttribute(Delay1.timeR2, value);
    }
};
TimeL.setControlCallback(onTimeLControl);

inline function onTimeRControl(component, value)
{
    Delay1.setAttribute(Delay1.timeR2, value);

    if (TimeLinkButton.getValue())
    {
        TimeL.setValue(value);
        Delay1.setAttribute(Delay1.timeL2, value);
    }
};
TimeR.setControlCallback(onTimeRControl);

// ===== TimeLinkButton 콜백 (SyncLinkButton과 상태 동기화)
inline function onTimeLinkButtonControl(component, value)
{
    // 서로 상태 동기화 (무한루프 방지)
    if (!_pairLinkGuard) setLinkedButton(SyncLinkButton, value);

    // 기존 동작 유지
    if (value)
    {
        TimeL.setValue(TimeL.getValue());
        TimeL.changed();
    }
};
TimeLinkButton.setControlCallback(onTimeLinkButtonControl);

// ===== Sync 링크 (신규 추가 그대로 유지)
inline function onSyncLControl(component, value)
{
    Delay1.setAttribute(Delay1.syncL2, value);

    if (SyncLinkButton.getValue())
    {
        SyncR.setValue(value);
        Delay1.setAttribute(Delay1.syncR2, value);
    }
};
SyncL.setControlCallback(onSyncLControl);

inline function onSyncRControl(component, value)
{
    Delay1.setAttribute(Delay1.syncR2, value);

    if (SyncLinkButton.getValue())
    {
        SyncL.setValue(value);
        Delay1.setAttribute(Delay1.syncL2, value);
    }
};
SyncR.setControlCallback(onSyncRControl);

// ===== SyncLinkButton 콜백 (TimeLinkButton과 상태 동기화)
inline function onSyncLinkButtonControl(component, value)
{
    // 서로 상태 동기화 (무한루프 방지)
    if (!_pairLinkGuard) setLinkedButton(TimeLinkButton, value);

    // 기존 동작 유지
    if (value)
    {
        SyncL.setValue(SyncL.getValue());
        SyncL.changed();
    }
};
SyncLinkButton.setControlCallback(onSyncLinkButtonControl);

// 두 버튼 초기 상태 정렬 (TimeLink 값을 기준으로)
setLinkedButton(SyncLinkButton, TimeLinkButton.getValue());

// ====== 레벨 미터 ======
const var LevelMeter  = Content.getComponent("LevelMeter");
const var SimpleGain1 = Synth.getEffect("SimpleGain1");

// Decay Rate
const var DECAY_RATE = 0.95;

// Current Values
var curLevel = 0.0;

// Timer Callback
const var t = Engine.createTimerObject();
t.setTimerCallback(function()
{
    // Synth Values (L/R 평균)
    var Level = (SimpleGain1.getCurrentLevel(1) + SimpleGain1.getCurrentLevel(0)) / 2;

    // Peak Synth Values
    var peakLevel = Math.max(Level, Level);

    if (peakLevel > curLevel)
        curLevel = peakLevel;
    else
        curLevel *= DECAY_RATE;

    // Decibel Conversion
    Level = Engine.getDecibelsForGainFactor(curLevel);

    // Set Values
    LevelMeter.setValue(Level);
});
t.startTimer(30);






// ========== 세팅창 ==========
const pageSetting = Content.getComponent("pageSetting");
const pageAdvanced = Content.getComponent("pageAdvanced");
// ========== 버튼 ==========
const btnToggleSet = Content.getComponent("btnTogglePage"); // 세팅 토글 버튼 (Switch 타입 추천)
const btnToggleSet2 = Content.getComponent("btnTogglePage2"); // 세팅 토글 버튼 (Switch 타입 추천)


const var clickShield    = Content.getComponent("clickShield");      // ScriptPanel (투명)




inline function updateShield()
{
    local anyOpen = pageSetting.get("visible") || pageAdvanced.get("visible");
    if (clickShield) clickShield.set("visible", anyOpen); // 팝업 열리면 쉴드 ON, 아니면 OFF
}

// ==========================
// 버튼 콜백
// ==========================
inline function onToggleSetClick(c, v)
{
    pageSetting.set("visible", v == 1);
    if (v == 0) btnToggleSet.setValue(0);
    updateShield();
}
btnToggleSet.setControlCallback(onToggleSetClick);

inline function onToggleSet2Click(c, v)
{
    pageAdvanced.set("visible", v == 1);
    if (v == 0) btnToggleSet2.setValue(0);
    updateShield();
}
btnToggleSet2.setControlCallback(onToggleSet2Click);

// ==========================
// 초기화
// ==========================
pageSetting.set("visible", false);
btnToggleSet.setValue(0);
pageAdvanced.set("visible", false);
btnToggleSet2.setValue(0);
updateShield();

// ==========================
// 쉴드 "클릭" 시에만 닫기
// ==========================
inline function onClickShieldMouse(e)
{
    // Hover / move 등은 무시. 실제 클릭(또는 mouseUp) 때만 처리
    if (!e || (e.clicked != 1 && e.mouseUp != 1)) return;

    // 바깥 클릭 → 전부 닫기
    pageSetting.set("visible", false);
    pageAdvanced.set("visible", false);

    // 토글 동기화
    btnToggleSet.setValue(0);
    btnToggleSet2.setValue(0);

    // 쉴드 OFF
    clickShield.set("visible", false);
}
if (clickShield) clickShield.setMouseCallback(onClickShieldMouse);


const var WebsiteButton1 = Content.getComponent("WebsiteButton1");



inline function OpenQuietformat(c, v)
{
    if (v)
        Engine.openWebsite("https://quietformat.com");
}

// 두 버튼에 같은 콜백 연결
WebsiteButton1.setControlCallback(OpenQuietformat);
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
 