(function(){
  "use strict";

  // var nameMP3 = "songs/Dimrain47 - Surface.mp3";
  // var nameMID = "songs/Dimrain47 - Surface.mid";
  var nameMP3 = "songs/guitar.mp3";
  var nameMID = "songs/NOTES.mid";

  var noteToLane = {
    "96":  0,
    "97":  1,
    "98":  2,
    "99":  3,
    "100": 4
  };

  var laneColors = ["#fadf45", "#db45ff", "#a9ff41", "#f55044", "#6cb8f2"];

  var getArrayBuffer = function(url, callback) {
    var request = new XMLHttpRequest();
    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    request.onload = function() {
      callback(request.response);
    };

    request.send();
  };

  var audioContext;

  if (typeof AudioContext !== "undefined") {
    audioContext = new AudioContext();
  } else if (typeof webkitAudioContext !== "undefined") {
    audioContext = new webkitAudioContext();
  } else {
    throw new Error('AudioContext not supported. :(');
  }

  var soundSource;
  var soundStart;

  getArrayBuffer(nameMP3, function(audioData) {
    audioContext.decodeAudioData(audioData, function (soundBuffer) {
      soundSource = audioContext.createBufferSource();
      soundStart = audioContext.currentTime;

      soundSource.buffer = soundBuffer;
      soundSource.connect(audioContext.destination);
      soundSource.start();
    });
  });

  var notes;
  var noteIndex = 0;

  getArrayBuffer(nameMID, function(buffer) {
    notes = [];

    var events = new MIDIFile(buffer).getMidiEvents();
    var active = {};

    for (var i = 0; i < events.length; i++) {
      var event = events[i];
      var lane = noteToLane[event.param1];

      if (typeof lane === "undefined") {
        continue;
      }

      if (event.subtype == 9 && typeof active[lane] === "undefined") {
        active[lane] = {
          time: event.playTime / 1000,
          held: false,
          lane: lane
        };

        notes.push(active[lane]);
      } else if (event.subtype == 8 && typeof active[lane] !== "undefined") {
        var time = event.playTime / 1000;

        if (time - active[lane].time > 0.075) {
          active[lane].held = true;
          active[lane].duration = time - active[lane].time - 0.075;
        }

        active[lane] = undefined;
      }
    }
  });

  var canvas = document.getElementById("game");
  var ctx = game.getContext("2d");

  var prevTime;

  var update = function(currTime) {
    var delta = 0;

    if (typeof prevTime !== "undefined") {
      delta = currTime - prevTime;
    }

    prevTime = currTime;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (typeof soundSource === "undefined") {
      ctx.fillStyle = "white";
      ctx.fillText("Sound not loaded yet", 10, 22);
      requestAnimationFrame(update);
      return;
    }

    if (typeof notes === "undefined") {
      ctx.fillStyle = "white";
      ctx.fillText("Notes not loaded yet", 10, 22);
      requestAnimationFrame(update);
      return;
    }

    var time = (audioContext.currentTime - soundStart);
    var drawn = 0;

    var baseNoteY = 294;
    var noteRadius = 16;
    var pixelsPerSecond = 330;

    var topDownBlackAlphaGrad = ctx.createLinearGradient(0,0,0,154);
    topDownBlackAlphaGrad.addColorStop(0, "black");
    topDownBlackAlphaGrad.addColorStop(1, "transparent");

    for (var i = noteIndex; i < notes.length; i++) {
      var note = notes[i];

      var x = 39.5 + note.lane * 40;
      var y = baseNoteY - (note.time - time) * pixelsPerSecond;

      var y1 = y + noteRadius;
      var y2 = y - noteRadius;

      if (note.held) {
        y2 = Math.min(y - noteRadius, y - note.duration * pixelsPerSecond);
      }

      if (y2 >= canvas.height) {
        noteIndex = i + 1;
        continue;
      }

      if (y1 < 0) {
        break;
      }

      if (note.held) {
        ctx.beginPath();
        ctx.lineWidth = 6;
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - note.duration * pixelsPerSecond);
        ctx.strokeStyle = laneColors[note.lane];
        ctx.stroke();
      }

      var path = new Path2D();
      path.arc(x, y, noteRadius, 0, Math.PI * 2, false);
      ctx.fillStyle = laneColors[note.lane];
      ctx.fill(path);
      ctx.lineWidth = 4;
      ctx.strokeStyle = "#484848";
      ctx.stroke(path);
      drawn++;
    }

    ctx.fillStyle = topDownBlackAlphaGrad;
    ctx.fillRect(0, 0, canvas.width, 154);

    ctx.fillStyle = "white";
    ctx.fillText(drawn + " notes at " + Math.floor(1 / (delta / 1000) + 0.5) + " fps", 10, 22);

    requestAnimationFrame(update);
  };

  requestAnimationFrame(update);
})();
