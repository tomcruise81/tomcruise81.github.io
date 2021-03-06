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
  if (oscillator) {
    try {
      oscillator.onended = function(){};
      // oscillator.frequency.cancelScheduledValues(audioCtx.currentTime);
      // console.log(`Audio Context State: ${audioCtx.state}`);
      // console.log('Stopping oscillator');
      oscillator.stop(0);
    } catch (err) {
      // console.error('Error cleaning up oscillator');
      // console.error(err);
      // console.error(err.stack);
    }
  }

  oscillator = undefined;
  analyser = undefined;
  // WARNING: Don't terminate the audioCtx, since doing so prevents repeats and requires a new button click
  // audioCtx = undefined;
}

function initializeAudio() {
  terminateAudio();

  // create web audio api context
  audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  audioCtx.onstatechange = function() {
    console.log(`Audio Context State: ${audioCtx.state}`);
  };
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
    const currentTimeMs = new Date().getTime() - playClickedTimeMs;
    let remainingTime = totalTime - Math.abs(currentTimeMs % totalTime);
    remainingTime = $('#repeat').is(":checked") ? '∞' : msToTime(remainingTime, true);
    $('#elapsed-value').val(msToTime(currentTimeMs, true));
    $('#remaining-value').val(remainingTime);
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
  let startOfNextFrequencyViaAudioCtx = audioCtx.currentTime;
  let startOfNextFrequencyFromNow = 0;

  const selectedPresets = $("#presets option:selected").map((index, option) => {
    return option.text;
  }).get();
  selectedPresets.forEach((selectedPresetText, index) => {
    const selectedProgram = caflData.programs[selectedPresetText];
    const frequencies = selectedProgram.frequencies;
    for (let frequency of frequencies) {
      oscillator.frequency.setValueAtTime(frequency, startOfNextFrequencyViaAudioCtx);
      indicateFrequency(frequency, startOfNextFrequencyFromNow);
      startOfNextFrequencyViaAudioCtx += secondsValue;
      startOfNextFrequencyFromNow += secondsValue;
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

  totalTime = startOfNextFrequencyFromNow * 1000;

  oscillator.start();
  oscillator.stop(startOfNextFrequencyViaAudioCtx);
  drawCanvas();
}

let playClickedTimeMs = 0;

$('#play').on("click", () => {
  playClickedTimeMs = new Date().getTime();
  stopClick();
  if (audioCtx) {
    audioCtx.close();
    audioCtx = undefined;
  }
  playClick();
});

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
$('#stop').on("click", () => {
  stopClick();
  if (audioCtx) {
    audioCtx.close();
    audioCtx = undefined;
  }
});

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
        function formatPreset(preset) {
          if (!preset.id) {
            return preset.text;
          }
          const program = caflData.programs[preset.text];
          var $preset = $(
            `<div>
              <span style="font-weight:bold;">${preset.text}</span><br />
              <span style="font-size:90%"><span style="font-weight:bold;">Frequencies:</span>&nbsp;<span>${(program.frequencies) ? program.frequencies.join(',') : 'None'}</span></span><br />
              <span style="font-size:90%"><span style="font-weight:bold;">Comments:</span>&nbsp;<span>${(program.comments) ? program.comments : 'None'}</span></span>
            </div>`
          );
          return $preset;
        }

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
            allowClear: true,
            templateResult: formatPreset
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
