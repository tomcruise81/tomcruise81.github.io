import React from "react";
// import { createStore } from 'redux';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import parse from 'autosuggest-highlight/parse';
// import match from 'autosuggest-highlight/match';
import match from '../helpers/match';

export default function Presets() {
  const [open, setOpen] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const loading = open && options.length === 0;

  React.useEffect(() => {
    let active = true;

    if (!loading) {
      // active = false;
      return undefined;
    }

    (async () => {
      let presets = localStorage.getItem('presets');
      if (!presets) {
        const response = await fetch(`${process.env.PUBLIC_URL}/cafl.json`);
        presets = await response.json();
        localStorage.setItem('presets', JSON.stringify(presets));
      } else {
        presets = JSON.parse(presets);
      }

      if (active) {
        setOptions(Object.keys(presets.programs).map(key => { return { name: key, ...presets.programs[key] } }));
      }
    })();

    return () => {
      active = false;
    };
  }, [loading]);

  // React.useEffect(() => {
  //   if (!open) {
  //     setOptions([]);
  //   }
  // }, [open]);

  return (
    <Autocomplete
      id="presets"
      //style={{ width: 600 }}
      multiple
      open={open}
      onOpen={() => {
        setOpen(true);
      }}
      onClose={() => {
        setOpen(false);
      }}
      getOptionLabel={option => option.name}
      filterSelectedOptions
      //disableCloseOnSelect
      disableOpenOnFocus
      freeSolo
      autoHighlight
      options={options}
      loading={loading}
      renderInput={params => (
        <TextField
          {...params}
          label="Presets"
          fullWidth
          variant="outlined"
          //inputProps={{
          //  ...params.inputProps,
          //  minlength: 2,
          //}}
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <React.Fragment>
                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                {params.InputProps.endAdornment}
              </React.Fragment>
            ),
          }}
        />
      )}
      renderOption={(option, { inputValue }) => {
        const matchOptions = {
          insideWords: true,
          findAllOccurrences: true,
        };
        const nameMatches = match(option.name, inputValue, matchOptions);
        const nameParts = parse(option.name, nameMatches);
        const commentMatches = match(option.comments, inputValue, matchOptions);
        const commentParts = parse(option.comments, commentMatches);
        const frequencies = (option.frequencies) ? option.frequencies.join(", ") : undefined;
        const frequencyMatches = match(frequencies, inputValue, matchOptions);
        const frequencyParts = parse(frequencies, frequencyMatches);

        return (
          <Grid container alignItems="center">
            <Grid item xs>
              {nameParts.map((part, index) => (
                <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                  {part.text}
                </span>
              ))}
              <Typography variant="body2" color="textSecondary">
                {option.comments && "Comments: "}
                {option.comments && commentParts.map((part, index) => (
                    <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                      {part.text}
                    </span>
                  ))
                }
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {option.frequencies && "Frequencies: "}
                {option.frequencies && frequencyParts.map((part, index) => (
                    <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
                      {part.text}
                    </span>
                  ))
                }
              </Typography>
            </Grid>
          </Grid>
        );
      }}
    />
  );
}
