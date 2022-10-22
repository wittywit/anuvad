
const MIDI_UUID = '03b80e5a-ede8-4b33-a751-6ce34ec4c700';
const MIDI_CHARA_UUID = '7772e5db-3868-4112-a1a9-f2669d106bf3';

const SERVICE_UUID = MIDI_UUID;

// connected device value
var connectDevice = null;
var connectService = null;
var connectChar = null;

//var midioutport = document.getElementById("midiOutput");
//synth = new WebAudioTinySynth(); // webaudio-tinysynth without GUI
//synth = document.getElementById("tinySynth"); // webaudio-tinysynth with GUI


mdc.ripple.MDCRipple.attachTo(document.querySelector('.foo-button'));
let bticon = document.querySelector("#btstatus");

function SetProgram(p){
  console.log("program: " + p);
  synth.send([0xc0,p-1]);
}

function Init(){
  synth=new WebAudioTinySynth({voices:64});
  for(var i=0;i<128;++i){
    var o=document.createElement("option");
    o.innerHTML=synth.getTimbreName(0,i);
    document.getElementById("prog").appendChild(o);
  }
}
window.onload=Init;

// disconnect process
function disconnect () {
  console.log(connectDevice);
  if (!connectDevice || !connectDevice.gatt.connected) return;
  connectDevice.gatt.disconnect();
  bticon.style.color="#bbb";
  bticon.innerText="bluetooth";
}

// connect process
function connect () {
  navigator.bluetooth.requestDevice({
	filters: [
      {services: [MIDI_UUID]}
     ,{namePrefix: 'BBC micro:bit'}
     ,{namePrefix: 'Roland A-01'}
	]
    ,optionalServices: [MIDI_UUID]

  })
	.then(device => {
	  connectDevice = device;
	  console.log('device', device);
	  return device.gatt.connect();
	})
	.then(server => {
	  console.log('server', server);
	  server.getPrimaryService(SERVICE_UUID)
		.then(service => {
		  connectService = service;
		  // start service is here
		  startMIDIService(service, MIDI_CHARA_UUID); // set interval timer
		})


 		.catch(error => {
		  console.log("can't startMIDIService()");
		  console.log(error);
		})
	})
	.catch(error => {
	  console.log(error);
	})
}


// start service event
function startMIDIService (service, charUUID) {
  service.getCharacteristic(charUUID)
	.then(characteristic => {
	  console.log('char', characteristic);
	  connectChar = characteristic;
	  characteristic.startNotifications()
		.then(char => {
		  messagelog.innerHTML = "";
		  midilog.innerHTML = "";
		  //alert('Connected');
		  
		  //Change Bluetooth icon color
		  bticon.style.color="#77F";
		  bticon.innerText="bluetooth_connected";
		  
		  characteristic.addEventListener('characteristicvaluechanged',
			// event is here
			onMIDIEvent);
		})
	})
	.catch(error => {
	  console.log(error);
	})
}

function printString(str) {
	var messagelog = document.getElementById('messagelog');
	messagelog.innerHTML += str + "\n";
	messagelog.scrollTop = messagelog.scrollHeight;
}

function printReceivedMessage(data) {
	var str ="";
	for (var i = 0; i < data.buffer.byteLength; i++) {
		let val = data.getUint8(i);
		if (val < 0x10) {
		  str += "0";
		}
		str += val.toString(16) + " ";
	}
	printString(str);
}

function onMIDIEvent (event) {
  printReceivedMessage(event.target.value);
  printReceivedMessageMIDI(event.target.value);
}

function printStringMIDI(str) {
	var midilog = document.getElementById('midilog');
	//midilog.innerHTML += str + "\n";
	midilog.innerHTML += str;
	midilog.scrollTop = midilog.scrollHeight;
}


function printReceivedMessageMIDI(data) {
	if(data.buffer.byteLength == 3 && data.getUint8(2) == 254){ //active sensing
		return;
	}
	var str ="";
  /*
	var timestampHigh = "0" + data.getUint8(0).toString(16);
	var timestampLow  = "0" + data.getUint8(1).toString(16);
	var timestamp     = (timestampHigh.substr(-2,2) + ":" + timestampLow.substr(-2,2) + " ").toUpperCase();
	printStringMIDI(timestamp);
  */

	for (var i = 2; i < data.buffer.byteLength; i++) {
		let val = data.getUint8(i);
		var msgBuf =[];
		var strBuf ="";

		switch (val){
        }

		if(val> 0x80 && val < 0xF0){
			val = val & 0xf0;
		}
		switch (val){
			//2 Byte Channel Messages
			case 0x80: //NoteOff :
            case 0x90: //NoteOn :
            case 0xA0: //AfterTouchPoly :
            case 0xB0: //ControlChange :
            case 0xE0: //PitchBend :
            //case 0xF0: //sysex :
                msgBuf[0] = data.getUint8(i);
                msgBuf[1] = data.getUint8(i+1);
                msgBuf[2] = data.getUint8(i+2);
				//midioutport.sendRawMessage([msgBuf[0], msgBuf[1], msgBuf[2]]);
				synth.send([msgBuf[0], msgBuf[1], msgBuf[2]]);

				i += 3;
				printBuf(msgBuf);
                break;
            //1 Byte Channel Messages
            case 0xC0: //ProgramChange :
            case 0xD0: //AfterTouchChannel :
                msgBuf[0] = data.getUint8(i);
                msgBuf[1] = data.getUint8(i+1);
				//midioutport.sendRawMessage([msgBuf[0], msgBuf[1]]);
				synth.send([msgBuf[0], msgBuf[1]]);
				i += 2;
				printBuf(msgBuf);
                break;

			case 0xF6: //tune request
            // System realtime message
			case 0xF8: //MIDI Clock
			//case 0xF9: // -- 
			case 0xFA: //Start
			case 0xFB: //Continue
			case 0xFC: //Stop
			//case 0xFD: // --
			case 0xFE: //active sencing
                msgBuf[0] = data.getUint8(i);
				//midioutport.sendRawMessage([msgBuf[0]]);
				i += 1;
                break;
			default:
                break;
		}
		str += val.toString(16) + " ";
	}

	//printStringMIDI(str + "\n");
	printStringMIDI("\n");
}

function printBuf(data){
	var strBuf = "";
	for (var i = 0; i < data.length; i++) {
		let val = data[i];
		if (val < 0x10) {
		  strBuf += "0";
		}
		strBuf += val.toString(16).toUpperCase() + " ";
	}
	printStringMIDI("[" + strBuf.trim() + "] ");
}


function panic () {
    for(var i=0; i < 16; i++){  //
      synth.send([0xB0 + i, 0x79, 0]); //reset all controlers
      synth.send([0xB0 + i, 0x7b, 0]); //allnoteoff
      synth.send([0xB0 + i, 0x78, 0]); //allsoundoff
    }
}


document.getElementById("testtone").addEventListener( "mousedown",function(){
	synth.send([0x90,0x43,100]);
}) ;
document.getElementById("testtone").addEventListener( "mouseup",function(){
	synth.send([0x80,0x43,0]);
}) ;

/*
document.getElementById("panic").addEventListener( "mousedown",function(){
	panic();
}) ;
*/




