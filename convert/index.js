"use strict";

let fs = require("fs");
let MIDIFile = require("midifile");

function toArrayBuffer(buffer) {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

let data = fs.readFileSync(process.argv[2]);
let mf = new MIDIFile(toArrayBuffer(data));
let events = mf.getMidiEvents();

let out = "return {";

for (let event of events) {
  switch (event.subtype) {
    case 9:
      //console.log("on", event.playTime, event.param1, event.param2);
      out += "{event=\"on\",time=" + event.playTime.toString() + ",a=" + event.param1.toString() + ",b=" + event.param2.toString() + "},";
      break;
    case 8:
      //console.log("off", event.playTime, event.param1, event.param2);
      out += "{event=\"off\",time=" + event.playTime.toString() + ",a=" + event.param1.toString() + ",b=" + event.param2.toString() + "},";
      break;
    default:
      console.log("unhandled event", event.subtype);
      return;
  }
}

out += "}";
fs.writeFileSync(process.argv[2] + ".lua", out);
