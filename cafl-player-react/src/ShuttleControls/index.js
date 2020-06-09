import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';

const useStyles = makeStyles(theme => ({
    fab: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
}));

export default function ShuttleControls({ presets, options }) {
    const classes = useStyles();
    // const theme = useTheme();
    const [playing, setPlaying] = React.useState(false);
    const oscillator = React.useRef(null);
    const audioCtx = React.useRef(null);
    // const polySynth = React.useRef(null);
    // const sequence = React.useRef(null);

    const secToMs = 1000;
    let playClickedTimeMs = 0;
    let analyser;
    let bufferLength;
    let timeDomainDataArray;
    let currentFrequency;
    let timeouts = [];
    let totalTime;

    function terminateAudio() {
        if (oscillator.current) {
            try {
                oscillator.current.onended = function () { };
                // oscillator.current.frequency.cancelScheduledValues(audioCtx.current.currentTime);
                // console.log(`Audio Context State: ${audioCtx.current.state}`);
                // console.log('Stopping oscillator');
                oscillator.current.stop(0);
            } catch (err) {
                // console.error('Error cleaning up oscillator');
                // console.error(err);
                // console.error(err.stack);
            }
        }

        oscillator.current = undefined;
        analyser = undefined;
        // WARNING: Don't terminate the audioCtx, since doing so prevents repeats and requires a new button click
        // audioCtx.current = undefined;
    }

    function initializeAudio() {
        terminateAudio();

        // create web audio api context
        audioCtx.current = audioCtx.current || new (window.AudioContext || window.webkitAudioContext)();
        // audioCtx.current.onstatechange = function () {
        //     console.log(`Audio Context State: ${audioCtx.current.state}`);
        // };
        analyser = audioCtx.current.createAnalyser();

        // create Oscillator node
        oscillator.current = audioCtx.current.createOscillator();

        oscillator.current.connect(analyser);
        analyser.connect(audioCtx.current.destination);
    }

    function indicateFrequency(frequency, secondsFromNow) {
        timeouts.push(
            setTimeout(() => {
                currentFrequency = frequency;
            }, secondsFromNow * secToMs)
        );
    }

    function playClick() {
        stopClick();

        initializeAudio();

        analyser.fftSize = 1024;

        // drawClearCanvas();

        oscillator.current.type = options.waveform;
        const secondsValue = 60 * 3;//parseInt($('#seconds').val());
        let startOfNextFrequencyViaAudioCtx = audioCtx.current.currentTime;
        let startOfNextFrequencyFromNow = 0;

        let frequencies = [];
        for (let presetIndex = 0; presetIndex < presets.length; presetIndex++) {
            let preset = presets[presetIndex];
            if (preset.frequencies) {
                frequencies = frequencies.concat(preset.frequencies)
            }
        }

        for (let frequency of frequencies) {
            oscillator.current.frequency.setValueAtTime(frequency, startOfNextFrequencyViaAudioCtx);
            indicateFrequency(frequency, startOfNextFrequencyFromNow);
            startOfNextFrequencyViaAudioCtx += secondsValue;
            startOfNextFrequencyFromNow += secondsValue;
        }

        bufferLength = analyser.frequencyBinCount;
        timeDomainDataArray = new Uint8Array(bufferLength);

        oscillator.current.onended = function () {
            console.log("onEnded event signled");
            if (options.loop) {
                setTimeout(() => {
                    console.log("Repeating");
                    playClick();
                }, 0);
            } else {
                stopClick();
            }
        };

        totalTime = startOfNextFrequencyFromNow * 1000;

        oscillator.current.start();
        oscillator.current.stop(startOfNextFrequencyViaAudioCtx);
        // drawCanvas();
    }

    function stopClick() {
        terminateAudio();

        // drawClearCanvas();

        while (timeouts.length) {
            clearTimeout(timeouts.pop());
        }
        indicateFrequency(0, 0);
        // $('#elapsed-value').val('');
        // $('#remaining-value').val('');
        totalTime = undefined;
    }

    function handlePlaying() {
        const isPlay = !playing && presets.length > 0;
        if (isPlay) {
            playClickedTimeMs = new Date().getTime();
            stopClick();
            if (audioCtx.current) {
              audioCtx.current.close();
              audioCtx.current = undefined;
            }
            playClick();
        }
        else {
            stopClick();
            if (audioCtx.current) {
                audioCtx.current.close();
                audioCtx.current = undefined;
            }
        }
        setPlaying(isPlay);
    }

    return (
        <div>
            {!playing ?
                <Fab aria-label="Play" className={classes.fab} color="primary" onClick={handlePlaying}>
                    <PlayIcon />
                </Fab>
                :
                <Fab aria-label="Pause" className={classes.fab} color="secondary" onClick={handlePlaying}>
                    <PauseIcon />
                </Fab>
            }
        </div>
    );
}
