import React from "react";
import PropTypes from 'prop-types';
import TextField from '@material-ui/core/TextField';
import Autocomplete from '@material-ui/lab/Autocomplete';
import CircularProgress from '@material-ui/core/CircularProgress';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import parse from 'autosuggest-highlight/parse';
// import match from 'autosuggest-highlight/match';
import match from '../helpers/match';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import { useTheme, makeStyles } from '@material-ui/core/styles';
import { FixedSizeList } from 'react-window';

function renderRow(props) {
    const { data, index, style } = props;

    return React.cloneElement(data[index], {
        style: {
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            display: 'block',
            ...style,
        },
    });
}

// Adapter for react-window
const ListboxComponent = React.forwardRef(function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const theme = useTheme();
    const smUp = useMediaQuery(theme.breakpoints.up('sm'));
    const itemCount = Array.isArray(children) ? children.length : 0;
    //Easier to just fix the size...
    const itemSize = (smUp ? 36 : 48) * 2.2;

    const outerElementType = React.useMemo(() => {
        return React.forwardRef((props2, ref2) => <div ref={ref2} {...props2} {...other} />);
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div ref={ref}>
            <FixedSizeList
                style={{ padding: 0, height: Math.min(3, itemCount) * itemSize, maxHeight: 'auto' }}
                itemData={children}
                height={250}
                width="100%"
                outerElementType={outerElementType}
                innerElementType="ul"
                itemSize={itemSize}
                overscanCount={5}
                itemCount={itemCount}
            >
                {renderRow}
            </FixedSizeList>
        </div>
    );
});

ListboxComponent.propTypes = {
    children: PropTypes.node,
};

const useStyles = makeStyles({
    listbox: {
        '& ul': {
            padding: 0,
            margin: 0,
        },
    },
});

export default function PresetsVirtual({presetsChangeCallback}) {
    const classes = useStyles();
    const [open, setOpen] = React.useState(false);
    const [presets, setPresets] = React.useState([]);
    const [selectedPresets, setSelectedPresets] = React.useState(
        JSON.parse(localStorage.getItem('selectedPresets') || '[]')
    );
    const loading = open && presets.length === 0;

    React.useEffect(() => {
        localStorage.setItem('selectedPresets', JSON.stringify(selectedPresets));
    }, [selectedPresets]);

    React.useEffect(() => {
        let active = true;

        if (!loading) {
            // active = false;
            return undefined;
        }

        (async () => {
            let presetsFromLocalStorage = localStorage.getItem('presets');
            if (!presetsFromLocalStorage) {
                const response = await fetch(`${process.env.PUBLIC_URL}/cafl.json`);
                let presetsFromRemote = await response.json();
                localStorage.setItem('presets', JSON.stringify(presetsFromRemote));
                presetsFromLocalStorage = localStorage.getItem('presets');
            }

            let parsedPresets = JSON.parse(presetsFromLocalStorage);

            if (active) {
                setPresets(
                    Object.keys(parsedPresets.programs).map(
                        key => {
                            let preset = parsedPresets.programs[key];
                            let name = key;
                            if (!preset.comments) {
                                preset.comments = "None";
                            }
                            if (!preset.frequencies) {
                                preset.frequencies = [];
                            }
                            return { name: name, ...parsedPresets.programs[key] }
                        }
                    )
                );
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
            /* style={{ width: 600 }} */
            multiple
            open={open}
            onOpen={() => {
                setOpen(true);
            }}
            onClose={() => {
                setOpen(false);
            }}
            value={selectedPresets}
            onChange={(_, values) => {
                setSelectedPresets(values)
                presetsChangeCallback(values);
            }}
            getOptionLabel={preset => preset.name}
            filterSelectedOptions
            filterOptions={
                (allPresets, state) => {
                    if (allPresets.length > 0) {
                        const label = state.inputValue.toLowerCase();
                        const filteredPresets = allPresets.filter(preset => {
                            if (preset.name.toLowerCase().includes(label) ||
                                (preset.comments && preset.comments.toLowerCase().includes(label))) {
                                return true;
                            }
                            return false;
                        });
                        return filteredPresets;
                    }
                    return [];
                }
            }
            //disableCloseOnSelect
            disableOpenOnFocus
            disableListWrap
            classes={classes}
            ListboxComponent={ListboxComponent}
            freeSolo
            autoHighlight
            options={presets}
            loading={loading}
            renderInput={params => (
                <TextField
                    {...params}
                    label="Presets"
                    fullWidth
                    variant="outlined"
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
