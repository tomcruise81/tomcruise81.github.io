import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Fab from '@material-ui/core/Fab';
import PlayIcon from '@material-ui/icons/PlayArrow';
import PauseIcon from '@material-ui/icons/Pause';
import Tone from "tone";

const useStyles = makeStyles(theme => ({
    fab: {
        position: 'absolute',
        bottom: theme.spacing(2),
        right: theme.spacing(2),
    },
}));

export default function ShuttleControls({presets, options}) {
    const classes = useStyles();
    // const theme = useTheme();
    const [playing, setPlaying] = React.useState(false);

    async function handlePlaying() {
        await Tone.start();
        const transport = Tone.Transport;

        if (playing) {
            transport.stop();
            //Clear out the timeline
            transport.cancel();
        } else {
            //These may be indifferent
            transport.timeSignature = [4, 4];
            transport.bpm.value = 60;

            const secondsPerFrequency = 3 * 60;
            let timeOffset = 0;

            for (let presetIndex = 0; presetIndex < presets.length; presetIndex++) {
                let preset = presets[presetIndex];
                if (preset.frequencies) {
                    for (let frequencyIndex = 0; frequencyIndex < preset.frequencies.length; frequencyIndex++) {
                        let frequency = preset.frequencies[frequencyIndex];
                        new Tone.OmniOscillator(frequency, options.waveform)
                            .toMaster()
                            .sync()
                            .start(timeOffset)
                            .stop(timeOffset + secondsPerFrequency);
                        timeOffset += secondsPerFrequency;
                    }
                }
            }

            transport.setLoopPoints(0, timeOffset);
            transport.loop = options.loop;

            transport.start(0, 0);
        }
        setPlaying(!playing && presets.length > 0);
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
