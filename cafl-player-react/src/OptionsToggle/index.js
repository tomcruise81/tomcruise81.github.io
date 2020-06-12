import React from 'react';
import { makeStyles, withStyles } from '@material-ui/core/styles';
import SquareWaveIcon from '../SquareWaveIcon';
import TriangleWaveIcon from '../TriangleWaveIcon';
import SawtoothWaveIcon from '../SawtoothWaveIcon';
import SineWaveIcon from '../SineWaveIcon';
import LoopIcon from '@material-ui/icons/Loop';
import Divider from '@material-ui/core/Divider';
import Paper from '@material-ui/core/Paper';
// import Tooltip from '@material-ui/core/Tooltip';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';

const useStyles = makeStyles(theme => ({
  paper: {
    display: 'flex',
    border: `1px solid ${theme.palette.divider}`,
    flexWrap: 'wrap',
  },
  divider: {
    alignSelf: 'stretch',
    height: 'auto',
    margin: theme.spacing(1, 0.5),
  },
}));

const StyledToggleButtonGroup = withStyles(theme => ({
  grouped: {
    margin: theme.spacing(0.5),
    border: 'none',
    padding: theme.spacing(0, 1),
    '&:not(:first-child)': {
      borderRadius: theme.shape.borderRadius,
    },
    '&:first-child': {
      borderRadius: theme.shape.borderRadius,
    },
  },
}))(ToggleButtonGroup);

export default function OptionsToggle({ optionsChangeCallback }) {
  const [waveform, setWaveform] = React.useState('sine');
  const [loop, setShouldLoop] = React.useState(true);

  const handleWaveform = (_, newWaveform) => {
    if (newWaveform !== null) {
      setWaveform(newWaveform);
      optionsChangeCallback({ waveform: newWaveform, loop: loop });
    }
  };

  const classes = useStyles();

  return (
    <div>
      <Paper elevation={0} className={classes.paper}>
        <StyledToggleButtonGroup
          size="small"
          value={waveform}
          exclusive
          onChange={handleWaveform}
          aria-label="waveform"
        >
          {/* Unfortunately, Tooltip doesn't work with multiple ToggleButtons in a ToggleButtonGroup */}
          {/* <Tooltip title="square waves"> */}
            <ToggleButton value="square" aria-label="square waves">
              <SquareWaveIcon />
            </ToggleButton>
          {/* </Tooltip> */}
          {/* <Tooltip title="triangle waves"> */}
            <ToggleButton value="triangle" aria-label="triangle waves">
              <TriangleWaveIcon />
            </ToggleButton>
          {/* </Tooltip> */}
          {/* <Tooltip title="sawtooth waves"> */}
            <ToggleButton value="sawtooth" aria-label="sawtooth waves">
              <SawtoothWaveIcon />
            </ToggleButton>
          {/* </Tooltip> */}
          {/* <Tooltip title="sine waves"> */}
            <ToggleButton value="sine" aria-label="sine waves">
              <SineWaveIcon />
            </ToggleButton>
          {/* </Tooltip> */}
        </StyledToggleButtonGroup>
        <Divider orientation="vertical" className={classes.divider} />
        <StyledToggleButtonGroup
          size="small"
          arial-label="text formatting"
        >
          {/* <Tooltip title="loop audio"> */}
            <ToggleButton value="loop"
              selected={loop}
              onClick={() => {
                setShouldLoop(!loop);
                optionsChangeCallback({ waveform: waveform, loop: !loop });
              }}
              aria-label="loop audio">
              <LoopIcon />
            </ToggleButton>
          {/* </Tooltip> */}
        </StyledToggleButtonGroup>
      </Paper>
    </div>
  );
}
