// back button
function backClick(){
console.log(history.back())
  window.history.back()
}

// reload button
function reloadClick(){
document.location.reload(true);
}

// MIDI Guitar

var selectMidiIn = document.getElementById('selectmidiin');
var selectMidiOut = document.getElementById('selectmidiout');
var midiInName = 'HTML Piano';
var midiOutName = 'Not available';
var midiInPort;
var midiOutPort;

function setListbox(lb, s) {
  for (var i = 0; i < lb.options.length; i++) if (lb.options[i].value == s) lb.options[i].selected = 1;
}

JZZ.synth.Tiny.register('Web Audio');
var ascii = JZZ.input.ASCII({Z:'C5', S:'C#5', X:'D5', D:'D#5', C:'E5', V:'F5', G:'F#5', B:'G5', H:'Ab5', N:'A5', J:'Bb5', M:'B5'});
var piano = JZZ.input.Kbd({at: 'piano', from: 'C5', to: 'B5', onCreate: function(){
  this.getBlackKeys().setStyle({color:'#fff'});
  this.getKey('C5').setInnerHTML('<span class=inner>Z</span>');
  this.getKey('C#5').setInnerHTML('<span class=inner>S</span>');
  this.getKey('D5').setInnerHTML('<span class=inner>X</span>');
  this.getKey('D#5').setInnerHTML('<span class=inner>D</span>');
  this.getKey('E5').setInnerHTML('<span class=inner>C</span>');
  this.getKey('F5').setInnerHTML('<span class=inner>V</span>');
  this.getKey('F#5').setInnerHTML('<span class=inner>G</span>');
  this.getKey('G5').setInnerHTML('<span class=inner>B</span>');
  this.getKey('G#5').setInnerHTML('<span class=inner>H</span>');
  this.getKey('A5').setInnerHTML('<span class=inner>N</span>');
  this.getKey('A#5').setInnerHTML('<span class=inner>J</span>');
  this.getKey('B5').setInnerHTML('<span class=inner>M</span>');
}});
ascii.connect(piano);
midiInPort = piano;

var through = JZZ.Widget();

function onMidiOutSuccess() {
  if (midiOutPort) {
    midiOutPort.close();
  }
  midiOutPort = this;
  through.connect(this);
  midiOutName = this.name();
  setListbox(selectMidiOut, midiOutName);
}

function onMidiOutFail() {
  if (midiOutPort) through.connect(midiOutPort);
  setListbox(selectMidiOut, midiOutName);
}

function onMidiInSuccess() {
  if (midiInPort && midiInPort != piano) {
    midiInPort.close();
  }
  midiInPort = this;
  this.connect(through);
  midiInName = this.name();
  setListbox(selectMidiIn, midiInName);
}

function onMidiInFail() {
  if (midiInPort) midiInPort.connect(through);
  setListbox(selectMidiIn, midiInName);
}

JZZ().and(function(){
  var i;
  for (i = 0; i < this.info().outputs.length; i++) {
    selectMidiOut[i] = new Option(this.info().outputs[i].name);
  }
  if (!i) {
    selectMidiOut[i] = new Option('Not available');
  }
  for (i = 0; i < this.info().inputs.length; i++) {
    selectMidiIn[i] = new Option(this.info().inputs[i].name);
  }
  selectMidiIn[i] = new Option('HTML Piano');
  selectMidiIn[i].selected = 1;
});

JZZ().openMidiOut().or(onMidiOutFail).and(onMidiOutSuccess);
JZZ().openMidiIn().or(onMidiInFail).and(onMidiInSuccess);

function changeMidiIn() {
  var name = selectMidiIn.options[selectMidiIn.selectedIndex].value;
  if (name == midiInName) return;
  if (midiInPort) midiInPort.disconnect(through);
  if (name == 'HTML Piano') {
    if (midiInPort) midiInPort.close();
    midiInPort = piano;
    midiInPort.connect(through);
    midiInName = name;
  }
  else JZZ().openMidiIn(name).or(onMidiInFail).and(onMidiInSuccess);
}

function changeMidiOut() {
  var name = selectMidiOut.options[selectMidiOut.selectedIndex].value;
  if (name == midiOutName) return;
  if (midiOutPort) through.disconnect(midiOutPort);
  JZZ().openMidiOut(name).or(onMidiOutFail).and(onMidiOutSuccess);
}

selectMidiIn.addEventListener('change', changeMidiIn);
selectMidiOut.addEventListener('change', changeMidiOut);