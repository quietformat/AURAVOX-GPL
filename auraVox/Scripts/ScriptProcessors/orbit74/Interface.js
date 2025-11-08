Content.makeFrontInterface(1083, 609);



const var LevelMeter = Content.getComponent("LevelMeter");
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
    {
        curLevel = peakLevel;
    }
    else
    {
        curLevel *= DECAY_RATE;
    }

    // Decibel Conversion
    Level = Engine.getDecibelsForGainFactor(curLevel);

    // Set Values
    LevelMeter.setValue(Level);
});

t.startTimer(30);function onNoteOn()
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
 