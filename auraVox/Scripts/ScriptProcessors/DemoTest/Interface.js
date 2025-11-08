Content.makeFrontInterface(1000, 700);










const var CountTwo = 2;

const var AllRandomizerButtons  = [];
const var AllLockButtons        = [];
const var AllBypassButtons      = [];
const var AllFxKnobs            = [];

const var AllModButtons         = [];   // <-- 이제 여기 ‘버튼’ 대신 ‘노브’를 연결 (ID는 그대로 ModBypass#)
const var AllModMixKnob         = [];

const var GodRandomizer = Content.getComponent("GodRandomizer");

for (i = 0; i < CountTwo; i++)
{
    AllRandomizerButtons[i]  = Content.getComponent("Randomizer" + (i+1));
    AllRandomizerButtons[i].setControlCallback(onRandomizerControl);

    AllLockButtons[i]        = Content.getComponent("Lock" + (i+1));
    AllBypassButtons[i]      = Content.getComponent("FxBypass" + (i+1));
    AllFxKnobs[i]            = Content.getComponent("FxKnob" + (i+1));

    AllModButtons[i]         = Content.getComponent("ModBypass" + (i+1)); // <-- 여기 컴포넌트를 노브로 만들어둬
    AllModMixKnob[i]         = Content.getComponent("ModMix" + (i+1));
}

inline function onGodRandomizerControl(component, value)
{
    if (!value) return;

    for (i = 0; i < 2; i++)
    {
        AllRandomizerButtons[i].setValue(1);
        AllRandomizerButtons[i].changed();
        AllRandomizerButtons[i].setValue(0);
    }
}
Content.getComponent("GodRandomizer").setControlCallback(onGodRandomizerControl);

inline function onRandomizerControl(component, value)
{
    local idx = AllRandomizerButtons.indexOf(component);
    if (!value) return;

    if (AllLockButtons[idx].getValue() == 1)
        return;

    // 기존 bypass 토글
    AllBypassButtons[idx].setValue(Math.randInt(0, 2));
    AllBypassButtons[idx].changed();

    if (AllBypassButtons[idx].getValue() == 0)
    {
        AllFxKnobs[idx].setValue(Math.randInt(4, 14));
        AllFxKnobs[idx].changed();
    }

    // ===== CHANGED: ModBypass 를 '노브(0..100)'로 취급하여 직접 랜덤 =====
    if (AllModButtons[idx])
    {
        AllModButtons[idx].setValue(Math.randInt(0, 100)); // 0~100
        AllModButtons[idx].changed();
    }

    // ModMix 도 항상 랜덤 (원하면 조건 걸어도 됨)
    if (AllModMixKnob[idx])
    {
        AllModMixKnob[idx].setValue(Math.randInt(0, 100));
        AllModMixKnob[idx].changed();
    }
}


const var LevelMeter  = Content.getComponent("LevelMeter");
const var SimpleGain1 = Synth.getEffect("SimpleGain1");

// ===== Meter ballistics =====
const var TIMER_MS   = 30;   // 16~33ms 권장 (60~30fps 느낌)
const var ATTACK_MS  = 300;   // 올라갈 때 (빠르게 반응)
const var RELEASE_MS = 350;  // 내려갈 때 (천천히 감쇠)
const var EPS        = 1e-9; // -inf 방지

// 타이머 주기에 맞춘 계수 (지수평활: y = a*y + (1-a)*x)
const var aAtk = Math.exp(-TIMER_MS / ATTACK_MS);
const var aRel = Math.exp(-TIMER_MS / RELEASE_MS);

var env = 0.0; // linear domain에서 스무딩

const var t = Engine.createTimerObject();
t.setTimerCallback(function()
{
    // L/R 순간 레벨(선형)에서 더 큰 값 사용
    var L = SimpleGain1.getCurrentLevel(0);
    var R = SimpleGain1.getCurrentLevel(1);
    var target = Math.max(L, R);

    // Attack / Release 분리 스무딩
    if (target > env)
        env = aAtk * env + (1.0 - aAtk) * target;   // 빨리 따라감
    else
        env = aRel * env + (1.0 - aRel) * target;   // 천천히 떨어짐

    // dB로 변환 + 하한 클램프
    var dB = Engine.getDecibelsForGainFactor(Math.max(env, EPS));
    if (dB < -60) dB = -60;   // 미터 바닥 고정(필요 없으면 제거)

    // 미터에 세팅 (네 미터가 dB 스케일일 때)
    LevelMeter.setValue(dB);

    // 만약 미터가 0..1 노멀라이즈면 아래로 교체:
    // LevelMeter.setValue( (dB + 60) / 60 ); // -60..0dB -> 0..1
});
t.startTimer(TIMER_MS);



const var WebsiteButton1 = Content.getComponent("WebsiteButton1");
const var WebsiteButton2 = Content.getComponent("WebsiteButton2");
const var WebsiteButton3 = Content.getComponent("WebsiteButton3");
const var WebsiteButton4 = Content.getComponent("WebsiteButton4");
const var WebsiteButton5 = Content.getComponent("WebsiteButton5");
const var WebsiteButton6 = Content.getComponent("WebsiteButton6");

inline function OpenLink(c, v)
{
    if (!v) return;

    if (c == WebsiteButton1)
        Engine.openWebsite("https://quietformat.com");
    else if (c == WebsiteButton2)
        Engine.openWebsite("https://instagram.com/gillatrack");
    else if (c == WebsiteButton3)
        Engine.openWebsite("https://instagram.com/slchld");
    else if (c == WebsiteButton4)
        Engine.openWebsite("https://open.spotify.com/artist/2qg65aLixfdExljOpqKJm3?si=mIvQdQ98Q3K_JAiryd2z_g");
    else if (c == WebsiteButton5)
        Engine.openWebsite("https://open.spotify.com/artist/33crDRqANd3NQHJagZkQ7O?si=TVEPjEeuRViXdnmcihK7UQ");
    else if (c == WebsiteButton6)
        Engine.openWebsite("https://www.youtube.com/slchldmusic");    
}

// attach
if (WebsiteButton1) WebsiteButton1.setControlCallback(OpenLink);
if (WebsiteButton2) WebsiteButton2.setControlCallback(OpenLink);
if (WebsiteButton3) WebsiteButton3.setControlCallback(OpenLink);
if (WebsiteButton4) WebsiteButton4.setControlCallback(OpenLink);
if (WebsiteButton5) WebsiteButton5.setControlCallback(OpenLink);
if (WebsiteButton6) WebsiteButton6.setControlCallback(OpenLink);




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


// =========================
// 0) Serial database (예시)
// =========================
const var serials = {
  "Data": [
    "QUIETFORMAT-100-FREE",
    "00LK-SSN9-FR22-GOI5",
    "01P5-JCAY-RI6Q-5YQO",
    "02I2-Y56Y-HB6X-03DD",
    "02NG-TPQI-D716-48O8",
    "02OS-HA6H-7BOB-MRU7",
    "03E0-UIEL-X769-78WS",
    "03IB-G150-4HIB-Z9LM",
    "03M8-J7A0-BQVD-TNIV",
    "03WH-LHRR-OZ35-P2DQ",
    "04DY-WV1H-WX7X-YOFM",
    "05N8-PGIP-4T2W-33TE",
    "06E1-6HVD-V2H1-71ZI",
    "06NB-F597-FLCS-MFK6",
    "07G0-MHRN-RL2R-K6VJ",
    "ZZNR-JRGJ-NWDZ-0X34"
  ]
};

const var SerialInput           = Content.getComponent("SerialInput");
const var Description           = Content.getComponent("Description");
const var SerialStateLabel      = Content.getComponent("SerialStateLabel");
const var AuthorisationDialogue = Content.getComponent("AuthorisationDialogue");
const var SubmitButton          = Content.getComponent("SubmitButton");
const var TrialButton           = Content.getComponent("TrialButton");

// ★ 트라이얼 표시용 패널 2개
const var TrialPanel1           = Content.getComponent("TrialPanel1");
const var TrialPanel2           = Content.getComponent("TrialPanel2");

const var GlobalMute = Synth.getMidiProcessor("GlobalMute");
const var TrialMute  = Synth.getEffect("TrialMute");

// =========================
// 1) Trial
// =========================
namespace Trial
{
    // ★ 여기서 3분, 2회
    const var DURATION_MS  = 3 * 60 * 1000;
    const var MAX_SESSIONS = 2;
    const var STATE_PATH   = "../TrialState.js";

    reg isActive     = false;
    reg usedSessions = 0;

    const var timer = Engine.createTimerObject();
    timer.setTimerCallback(function()
    {
        isActive = false;
        usedSessions += 1;
        saveState();

        Authorisation.updateAccess();
        updateTrialButtonUI();
        timer.stopTimer();
    });

    inline function saveState()
    {
        Engine.dumpAsJSON({ "usedSessions": usedSessions }, STATE_PATH);
    }

    inline function loadState()
    {
        local d = Engine.loadFromJSON(STATE_PATH);
        usedSessions = (d && d.usedSessions >= 0) ? d.usedSessions : 0;
    }

    inline function deactivate()
    {
        isActive = false;
    }

    inline function start()
    {
        if (isActive) return;
        if (usedSessions >= MAX_SESSIONS)
        {
            updateTrialButtonUI();
            return;
        }

        isActive = true;
        Authorisation.updateAccess();
        timer.startTimer(DURATION_MS);
        updateTrialButtonUI();
    }

    inline function updateTrialButtonUI()
    {
        if (!TrialButton) return;

        if (Authorisation.licenseValid)
        {
            TrialButton.set("visible", false);
            return;
        }

        TrialButton.set("visible", true);

        if (isActive)
        {
            TrialButton.set("enabled", false);
            TrialButton.set("text", "Trial running…");
        }
        else if (usedSessions >= MAX_SESSIONS)
        {
            TrialButton.set("enabled", false);
            TrialButton.set("text", "Trial used");
        }
        else
        {
            TrialButton.set("enabled", true);
            TrialButton.set("text", "Try 3 minutes");
        }
    }

    loadState();
}

// =========================
// 2) Authorisation
// =========================
namespace Authorisation
{
    reg licenseValid = false;

    inline function onSubmitButtonControl(c, v)
    {
        if (!v) return;

        local entered = SerialInput.getValue();
        if (serials.Data.contains(entered))
        {
            Engine.dumpAsJSON({ "Serial": entered }, "../RegistrationInfo.js");
            setValidLicense(true);
        }
        else
        {
            if (Description)
                Description.set("text", "The license key is incorrect. Please check the key in your purchase email and try again.");
            setValidLicense(false);
        }
    }

    if (SubmitButton)
        SubmitButton.setControlCallback(onSubmitButtonControl);

    inline function updateAccess()
    {
        local allowed = licenseValid || Trial.isActive;

        if (GlobalMute)
            GlobalMute.setAttribute(0, allowed ? 0 : 1);

        if (TrialMute)
            TrialMute.setAttribute(0, allowed ? 0.0 : -100.0);

        if (SerialStateLabel)
            SerialStateLabel.set("bgColour", allowed ? Colours.greenyellow : Colours.red);

        if (AuthorisationDialogue)
            AuthorisationDialogue.set("visible", !allowed);

        // ★ 여기서 두 패널 제어
        // 1) 라이선스 있으면 무조건 둘 다 끈다
        if (licenseValid)
        {
            if (TrialPanel1) TrialPanel1.set("visible", false);
            if (TrialPanel2) TrialPanel2.set("visible", false);
        }
        else
        {
            // 2) 라이선스 없고, 지금 트라이얼 중일 때만 켠다
            if (Trial.isActive)
            {
                // 첫 번째 세션 실행 중 (usedSessions == 0)
                if (Trial.usedSessions == 0)
                {
                    if (TrialPanel1) TrialPanel1.set("visible", true);
                    if (TrialPanel2) TrialPanel2.set("visible", false);
                }
                // 두 번째 세션 실행 중 (usedSessions == 1)
                else if (Trial.usedSessions == 1)
                {
                    if (TrialPanel1) TrialPanel1.set("visible", false);
                    if (TrialPanel2) TrialPanel2.set("visible", true);
                }
                else
                {
                    // 혹시 이상한 값이면 둘 다 끔
                    if (TrialPanel1) TrialPanel1.set("visible", false);
                    if (TrialPanel2) TrialPanel2.set("visible", false);
                }
            }
            else
            {
                // 트라이얼 안 돌고 있으면 둘 다 끔
                if (TrialPanel1) TrialPanel1.set("visible", false);
                if (TrialPanel2) TrialPanel2.set("visible", false);
            }
        }

        Trial.updateTrialButtonUI();
    }

    inline function setValidLicense(ok)
    {
        licenseValid = ok;
        updateAccess();
    }

    inline function checkOnLoad()
    {
        if (SerialInput)
            SerialInput.set("text", "");

        local saved = Engine.loadFromJSON("../RegistrationInfo.js");

        if (saved)
        {
            local v = saved.Serial;
            if (serials.Data.contains(v))
            {
                setValidLicense(true);
                return;
            }
        }

        Trial.deactivate();
        setValidLicense(false);
    }

    checkOnLoad();
}

// ============================
// 3) Trial 버튼
// ============================
inline function onTrialButton(c, v)
{
    if (!v) return;
    Trial.start();
}

if (TrialButton)
    TrialButton.setControlCallback(onTrialButton);

// ============================
// 4) 시작 시 강제 동기화
// ============================
if (!Authorisation.licenseValid)
{
    Trial.deactivate();
    Authorisation.updateAccess();
}
else
{
    Authorisation.updateAccess();
}function onNoteOn()
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
 