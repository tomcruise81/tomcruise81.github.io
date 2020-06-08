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

export default function ShuttleControls() {
    const classes = useStyles();
    // const theme = useTheme();
    const [playing, setPlaying] = React.useState(false);

    function handlePlaying() {
        setPlaying(!playing);
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
