const canvas = document.getElementById("canvas");
const canvasCtx = canvas.getContext("2d");
const presets = document.getElementById("presets");

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
let totalTime;

function drawClearCanvas() {
  if (analyser) {
    return;
  }

  requestAnimationFrame(drawClearCanvas);

  canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
}

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
  canvasCtx.font = "10vw Roboto";
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

function terminateAudio() {
  if (audioCtx) {
    try {
      audioCtx.close();
    } catch (err) {
      console.error('Error closing audioCtx');
      console.error(err);
    }
  }
  if (oscillator) {
    try {
      oscillator.stop(0);
      oscillator = undefined;
    } catch (err) {
      console.error('Error stopping oscillator');
      console.error(err);
    }
  }
  audioCtx = undefined;
  analyser = undefined;
}

function initializeAudio() {
  terminateAudio();

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
  if (totalTime && audioCtx.currentTime && audioCtx.currentTime > 0) {
    const currentTimeMs = audioCtx.currentTime * 1000;
    $('#elapsed-value').val(msToTime(currentTimeMs, true));
    $('#remaining-value').val(msToTime(totalTime - currentTimeMs, true));
  } else {
    $('#elapsed-value').val('');
    $('#remaining-value').val('');
  }
}

function playClick() {
  stopClick();

  initializeAudio();

  analyser.fftSize = 1024;

  drawClearCanvas();

  oscillator.type = caflData.defaults.waveform;
  const secondsValue = parseInt($('#seconds').val());
  let startOfNextFrequency = audioCtx.currentTime;

  const selectedPresets = $("#presets option:selected").map((index, option) => {
    return option.text;
  }).get();
  selectedPresets.forEach((selectedPresetText, index) => {
    const selectedProgram = caflData.programs[selectedPresetText];
    const frequencies = selectedProgram.frequencies;
    for (let frequency of frequencies) {
      oscillator.frequency.setValueAtTime(frequency, startOfNextFrequency);
      indicateFrequency(frequency, startOfNextFrequency);
      startOfNextFrequency += secondsValue;
    }
  });

  bufferLength = analyser.frequencyBinCount;
  timeDomainDataArray = new Uint8Array(bufferLength);

  oscillator.onended = function() {
    console.log("onEnded event signled");
    if ($('#repeat').is(":checked")) {
      setTimeout(() => {
        console.log("Repeating");
        playClick();
      }, 0);
    } else {
      stopClick();
    }
  };

  totalTime = startOfNextFrequency * 1000;

  oscillator.start();
  oscillator.stop(startOfNextFrequency);
  drawCanvas();
}
$('#play').on("click", playClick);

function stopClick() {
  terminateAudio();

  drawClearCanvas();

  while (timeouts.length) {
    clearTimeout(timeouts.pop());
  }
  indicateFrequency(0, 0);
  $('#elapsed-value').val('');
  $('#remaining-value').val('');
  totalTime = undefined;
}
$('#stop').on("click", stopClick);

$('#presets').on("change", function() {
  stopClick();
  const selectedPresets = $("#presets option:selected").map((index, option) => {
    return option.text;
  }).get();
  let cookieValue = '';
  selectedPresets.forEach((selectedPresetText, index) => {
    const selectedProgram = caflData.programs[selectedPresetText];
    let frequenciesValue = selectedProgram.frequencies;
    frequenciesValue = frequenciesValue ? frequenciesValue : 'No Frequencies';
    let commentValue = selectedProgram.comments;
    commentValue = commentValue ? commentValue : 'No Comments';
    console.log(`Selected preset ${selectedPresetText}`);
    if (index == 0) {
      cookieValue = `${selectedPresetText}`;
      $('#preset-frequencies').val(frequenciesValue);
      $('#comments').val(commentValue);
    } else {
      cookieValue += ` | ${selectedPresetText}`;
      $('#preset-frequencies').val(`${$('#preset-frequencies').val()} | ${frequenciesValue}`);
      $('#comments').val(`${$('#comments').val()} | ${commentValue}`);
    }
    document.cookie = `presets=${cookieValue}`;
  });
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

$('#repeat').on("change", function() {
  document.cookie = `repeat=${$('#repeat').is(":checked") ? 'true' : 'false'}`;
});

$('#seconds').on("change", function() {
  document.cookie = `seconds=${$('#seconds').val()}`;
  $('#stop').click();
});

$('#seconds').on("input", function() {
  $('#seconds-value').val(msToTime($('#seconds').val() * 1000));
});

function initializeCanvas() {
  canvas.height = 0.75 * window.innerHeight;
  canvas.width = window.innerWidth;
}

function initializePresets() {
    const presetCookieValue = getCookieValue("presets");
    const presets = (presetCookieValue) ? presetCookieValue.split(' | ') : [];
    $.ajax({
        url: 'cafl.json',
        cache: true
    }).done(function(data) {
        caflData = data;
        $('#presets').select2({
            data: function() {
                return Object.entries(caflData.programs).map((value, index) => {
                    return {
                        id: index,
                        text: value[0],
                        selected: (presets.includes(value[0]))
                    };
                });
            }(),
            width: 'resolve',
            dropdownAutoWidth: true,
            placeholder: 'Presets',
            allowClear: true
        });

        $('#presets').change();

        //Bugfix as per https://github.com/select2/select2/issues/4384#issuecomment-228464364
        $('select').on(
          'select2:close',
          function () {
              $(this).focus();
          }
      );
    });
}

function initializeSeconds() {
  const secondsCookieValue = getCookieValue("seconds");
  if (secondsCookieValue) {
    const seconds = $('#seconds');
    seconds.val(parseInt(secondsCookieValue)).trigger('input');
    seconds.change();
  }
}

function initializeRepeat() {
  const repeatCookieValue = getCookieValue("repeat");
  if (repeatCookieValue === 'true') {
    $('#repeat').prop("checked", true);
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

$(document).ready(initializeTimer);
$(document).ready(initializeCanvas);
$(document).ready(initializePresets);
$(document).ready(initializeSeconds);
$(document).ready(initializeRepeat);
