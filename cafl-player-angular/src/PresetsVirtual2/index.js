import React from 'react';
import { CellMeasurer, CellMeasurerCache, List } from 'react-virtualized';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import parse from 'autosuggest-highlight/parse';
// import match from 'autosuggest-highlight/match';
// import match from '../helpers/match';

export default function PresetsVirtual2() {
  const [open] = React.useState(false);
  const [options, setOptions] = React.useState([]);
  const loading = open && options.length === 0;

  // In this example, average cell height is assumed to be about 50px.
  // This value will be used for the initial `Grid` layout.
  // Width is not dynamic.
  const cache = new CellMeasurerCache({
    defaultHeight: 50,
    fixedWidth: true,
    keyMapper: () => 1,
  });

  function rowRenderer({ index, key, parent, style }) {
    // const matchOptions = {
    //   insideWords: true,
    //   findAllOccurrences: true,
    // };
    const option = options[index];
    const nameMatches = []; //match(option.name, inputValue, matchOptions);
    const nameParts = parse(option.name, nameMatches);
    const commentMatches = []; //match(option.comments, inputValue, matchOptions);
    const commentParts = parse(option.comments, commentMatches);
    const frequencies = (option.frequencies) ? option.frequencies.join(", ") : undefined;
    const frequencyMatches = []; //match(frequencies, inputValue, matchOptions);
    const frequencyParts = parse(frequencies, frequencyMatches);

    return (
      <CellMeasurer
        cache={cache}
        columnIndex={0}
        key={key}
        parent={parent}
        rowIndex={index}
      >
        {({ measure }) => (
          // 'style' attribute required to position cell (within parent List)
          <Grid container alignItems="center" style={style}>
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
        )}
      </CellMeasurer>
    );
  }

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

  return (
    <List
      width={300}
      height={300}
      rowCount={100}
      deferredMeasurementCache={cache}
      rowHeight={cache.rowHeight}
      rowRenderer={rowRenderer}
    />
  );
}
