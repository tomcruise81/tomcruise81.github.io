const canvas = document.getElementById("canvas");
const canvasCtx = canvas.getContext("2d");
const presets = document.getElementById("presets");
const seconds = document.getElementById("seconds");
const seconds_value = document.getElementById("seconds-value");
const elapsed_value = document.getElementById("elapsed-value");
const remaining_value = document.getElementById("remaining-value");
const total_value = document.getElementById("total-value");

const comments = document.getElementById("comments");
const play = document.getElementById("play");
const stop = document.getElementById("stop");
const preset_frequencies = document.getElementById("preset-frequencies");

const secToMs = 1000;
let audioCtx;
let oscillator;
let analyser;
let bufferLength;
let timeDomainDataArray;
let currentFrequency;
let timeouts = [];
let caflData;

function drawCanvas() {
  if (!analyser) {
    return;
  }

  requestAnimationFrame(drawCanvas);
  analyser.getByteTimeDomainData(timeDomainDataArray);

  canvasCtx.fillStyle = "rgb(255, 255, 255)";
  canvasCtx.fillRect(0, 0, canvas.width, canvas.height);

  canvasCtx.fillStyle = "gray";
  canvasCtx.textAlign = "center";
  canvasCtx.textBaseline = "middle";
  canvasCtx.font = "10vw Arial";
  canvasCtx.fillText(
    `${currentFrequency}`,
    canvas.width / 2,
    canvas.height / 2
  );

  canvasCtx.lineWidth = 2;
  canvasCtx.strokeStyle = "rgb(0, 0, 0)";
  canvasCtx.beginPath();
  var sliceWidth = (canvas.width * 1.0) / bufferLength;
  var x = 0;
  for (var i = 0; i < bufferLength; i++) {
    var v = timeDomainDataArray[i] / 128.0;
    var y = (v * canvas.height) / 2;

    if (i === 0) {
      canvasCtx.moveTo(x, y);
    } else {
      canvasCtx.lineTo(x, y);
    }

    x += sliceWidth;
  }
  canvasCtx.lineTo(canvas.width, canvas.height / 2);
  canvasCtx.stroke();
}

function initializeAudio() {
  if (audioCtx) {
    audioCtx.close();
  }
  // create web audio api context
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  analyser = audioCtx.createAnalyser();

  // create Oscillator node
  oscillator = audioCtx.createOscillator();

  oscillator.connect(analyser);
  analyser.connect(audioCtx.destination);
}

function indicateFrequency(frequency, secondsFromNow) {
  timeouts.push(
    setTimeout(() => {
      currentFrequency = frequency;
    }, secondsFromNow * secToMs)
  );
}

function displayTimer() {
  if (total_value.value && audioCtx.currentTime && audioCtx.currentTime > 0) {
    const currentTimeMs = audioCtx.currentTime * 1000;
    elapsed_value.value = msToTime(currentTimeMs);
    remaining_value.value = msToTime(total_value.value - currentTimeMs);
  } else {
    elapsed_value.value = remaining_value.value = "";
  }
}

play.addEventListener("click", function() {
  stop.dispatchEvent(new Event("click"));

  initializeAudio();

  analyser.fftSize = 1024;
  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);

  oscillator.type = caflData.defaults.waveform;
  const secondsValue = parseInt(seconds.value);
  let startOfNextFrequency = audioCtx.currentTime;

  const selectedPreset = presets.options[presets.selectedIndex];
  const selectedProgram = caflData.programs[selectedPreset.text];
  const frequencies = selectedProgram.frequencies;
  for (let frequency of frequencies) {
    oscillator.frequency.setValueAtTime(frequency, startOfNextFrequency);
    indicateFrequency(frequency, startOfNextFrequency);
    startOfNextFrequency += secondsValue;
  }

  bufferLength = analyser.frequencyBinCount;
  timeDomainDataArray = new Uint8Array(bufferLength);

  oscillator.onended = function() {
    console.log("onEnded event signled");
    oscillator = undefined;
    stop.dispatchEvent(new Event("click"));
  };

  total_value.value = startOfNextFrequency * 1000;

  oscillator.start();
  oscillator.stop(startOfNextFrequency);
  drawCanvas();
});

stop.addEventListener("click", function() {
  if (oscillator) {
    oscillator.stop();
  }
  while (timeouts.length) {
    clearTimeout(timeouts.pop());
  }
  indicateFrequency(0, 0);
  elapsed_value.value = remaining_value.value = total_value.value = "";
  drawCanvas();
});

presets.addEventListener("change", function() {
  stop.dispatchEvent(new Event("click"));
  const selectedIndex = presets.selectedIndex >= 0 ? presets.selectedIndex : 0;
  const selectedPreset = presets.options[selectedIndex];
  if (selectedPreset) {
    document.cookie = `preset=${selectedPreset.text}`;
    const selectedProgram = caflData.programs[selectedPreset.text];
    console.log(`Selected preset ${selectedPreset.text}`);
    preset_frequencies.value = selectedProgram.frequencies;
    const commentValue = caflData.programs[selectedPreset.text].comments;
    comments.value = commentValue ? commentValue : "";
  }
});

function msToTime(ms, includeHrs, includeMs) {
  let milliseconds = parseInt((ms % 1000) / 100),
    seconds = parseInt((ms / 1000) % 60),
    minutes = parseInt((ms / (1000 * 60)) % 60),
    hours = parseInt((ms / (1000 * 60 * 60)) % 24);

  hours = hours < 10 ? "0" + hours : hours;
  minutes = minutes < 10 ? "0" + minutes : minutes;
  seconds = seconds < 10 ? "0" + seconds : seconds;

  return (
    (includeHrs ? hours + ":" : "") +
    minutes +
    ":" +
    seconds +
    (includeMs ? "." + milliseconds : "")
  );
}

seconds.addEventListener("change", function() {
  document.cookie = `seconds=${seconds.value}`;
  stop.dispatchEvent(new Event("click"));
});

seconds.addEventListener("input", function() {
  seconds_value.value = msToTime(seconds.value * 1000);
});

function initializeCanvas() {
  canvas.height = 0.75 * window.innerHeight;
  canvas.width = window.innerWidth;
}

function initializePresets() {
   const loadingOption = document.createElement("option");
   loadingOption.innerHTML = loadingOption.value = "Loading...";
   // then append it to the select element
   presets.appendChild(loadingOption);

  const presetCookieValue = getCookieValue("preset");

   const xhttp = new XMLHttpRequest();
   xhttp.onreadystatechange = function() {
     if (this.readyState == 4 && this.status == 200) {
       caflData = JSON.parse(this.responseText);
       for (const programName in caflData.programs) {
         const program = caflData.programs[programName];
         if (program.frequencies && program.frequencies.length > 0) {
           let option = document.createElement("option");
           option.innerHTML = programName;

           if (programName === presetCookieValue) {
             option.selected = true;
           }
           // then append it to the select element
           presets.appendChild(option);
         }
       }
       loadingOption.remove();
       presets.dispatchEvent(new Event("change"));
       seconds.dispatchEvent(new Event("input"));
     }
   };
   xhttp.open("GET", "cafl.json", true);
   xhttp.send();
}

function initializeSeconds() {
  const secondsCookieValue = getCookieValue("seconds");
  if (secondsCookieValue) {
    seconds.value = parseInt(secondsCookieValue);
  }
}

function getCookieValue(cookieName) {
  const cookieValue = document.cookie.replace(
    new RegExp(`(?:(?:^|.*;\\s*)${cookieName}\\s*\\=\\s*([^;]*).*\$)|^.*\$`),
    "$1"
  );
  return cookieValue !== "" ? cookieValue : undefined;
}

function initializeTimer() {
  setInterval(displayTimer, 30);
  displayTimer();
}

window.addEventListener("load", initializeTimer);
window.addEventListener("load", initializeCanvas);
window.addEventListener("load", initializePresets);
window.addEventListener("load", initializeSeconds);
