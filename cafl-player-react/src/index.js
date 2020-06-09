import React from "react";
import ReactDOM from "react-dom";
import Grid from '@material-ui/core/Grid';
// import Paper from '@material-ui/core/Paper';
import OptionsToggle from './OptionsToggle';
// import Presets from './Presets';
import PresetsVirtual from './PresetsVirtual';
// import PresetsVirtual2 from './PresetsVirtual2';
// import PresetsVirtualList from './PresetsVirtualList';
import ShuttleControls from "./ShuttleControls";
// import "./index.css";
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';
import indigo from '@material-ui/core/colors/indigo';
import blue from '@material-ui/core/colors/blue';

const theme = createMuiTheme({
  palette: {
    primary: indigo,
    secondary: blue,
  },
});

class Player extends React.Component {
  // const [frequencies, setFrequencies] = React.useState(true);
  // const [options, setOptions] = React.useState([]);

  constructor(props) {
    super(props);
    this.state = {
      //TODO: Remove this hideousness
      presets: JSON.parse(localStorage.getItem('selectedPresets') || '[]'),
      options: {waveform: 'sine', loop: true}
    };
  }

  render() {
    const presetsChangeCallback = (presets) => {
      this.setState({ presets: (presets) ? presets : [] });
    }

    const optionsChangeCallback = (options) => {
      this.setState({ options: options });
    }

    return (
      <div className={theme.root}>
        <Grid container spacing={3}>
          {/* <Grid item xs={12}>
            <Presets />
          </Grid> */}
          <Grid item xs={12}>
            <PresetsVirtual presetsChangeCallback={presetsChangeCallback} />
          </Grid>
          {/* <Grid item xs={12} sm={6}>
            <PresetsVirtual2 />
          </Grid> */}
          {/* <Grid item xs={12} sm={6}>
            <PresetsVirtualList />
          </Grid> */}
          <Grid item xs={12} sm={6}>
            <OptionsToggle optionsChangeCallback={optionsChangeCallback} />
          </Grid>
          <Grid item xs={12}>
            <ShuttleControls presets={this.state.presets} options={this.state.options} />
          </Grid>
        </Grid>
      </div>


      /* <div>
        <div>
          <Presets />
        </div>
        <div>
          <PresetsVirtual />
        </div>
        <div>
          <OptionsToggle />
        </div>
        <div>
          <ShuttleControls />
        </div>
      </div> */
    );
  }
}
// ========================================

ReactDOM.render(<ThemeProvider theme={theme}><Player /></ThemeProvider>, document.getElementById("root"));
