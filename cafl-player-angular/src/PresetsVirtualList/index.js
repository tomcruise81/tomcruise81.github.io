import React from 'react';
// import PropTypes from 'prop-types';
import FadeIn from "react-fade-in";
import clsx from 'clsx';
import Immutable from 'immutable';
import styles from './styles.css';
import { AutoSizer, List } from 'react-virtualized';
// import TextField from '@material-ui/core/TextField';
// import Autocomplete from '@material-ui/lab/Autocomplete';
// import CircularProgress from '@material-ui/core/CircularProgress';
// import Grid from '@material-ui/core/Grid';
// import Typography from '@material-ui/core/Typography';
// import parse from 'autosuggest-highlight/parse';
// import match from '../helpers/match';
// import { makeStyles } from '@material-ui/core/styles';

// const useStyles = makeStyles({
//     listbox: {
//         '& ul': {
//             padding: 0,
//             margin: 0,
//         },
//     },
// });

let dataList = undefined;

export default class PresetsVirtualList extends React.PureComponent {
    // static contextTypes = {
    //     dataList: PropTypes.instanceOf(Immutable.List).isRequired,
    // };

    constructor(props, context) {
        super(props, context);

        this.state = {
            done: undefined
        };

        this._getRowHeight = this._getRowHeight.bind(this);
        this._noRowsRenderer = this._noRowsRenderer.bind(this);
        this._onRowCountChange = this._onRowCountChange.bind(this);
        this._onScrollToRowChange = this._onScrollToRowChange.bind(this);
        this._rowRenderer = this._rowRenderer.bind(this);
    }

    async componentDidMount() {
        let presets = localStorage.getItem('presets');
        if (!presets) {
            const response = await fetch(`${process.env.PUBLIC_URL}/cafl.json`);
            presets = await response.json();
            localStorage.setItem('presets', JSON.stringify(presets));
        } else {
            presets = JSON.parse(presets);
        }
        const baseList = Object.keys(presets.programs).map(key => { return { name: key, ...presets.programs[key] } });
        dataList = Immutable.List(baseList);
        this.setState({
            done: true,
            listHeight: 300,
            listRowHeight: 50,
            overscanRowCount: 10,
            rowCount: dataList.size,
            scrollToIndex: undefined,
            showScrollingPlaceholder: false,
            useDynamicRowHeight: false,
        });
    }

    render() {
        const {
            listHeight,
            rowCount,
            scrollToIndex,
        } = this.state;

        return (
            <div>
                {!this.state.done ? (
                    <h1>Loading...</h1>
                ) : (
                        <FadeIn>
                            <AutoSizer disableHeight>{
                                ({ width }) => (
                                    <List
                                        ref="List"
                                        className={styles.List}
                                        height={listHeight}
                                        overscanRowCount={10}
                                        noRowsRenderer={this._noRowsRenderer}
                                        rowCount={rowCount}
                                        rowHeight={this._getRowHeight}
                                        rowRenderer={this._rowRenderer}
                                        scrollToIndex={scrollToIndex}
                                        width={width}
                                    />
                                )}
                            </AutoSizer>
                        </FadeIn>
                    )
                }
            </div>
        );
    }

    _getDatum(index) {
        return dataList.get(index % dataList.size);
    }

    _getRowHeight({ index }) {
        const datum = this._getDatum(index);
        let size = 48;
        size += (datum.comments) ? 36 : 0;
        size += (datum.ferquencies) ? 36 : 0;
        return size;
    }

    _noRowsRenderer() {
        return <div className={styles.noRows}>No rows</div>;
    }

    _onRowCountChange(event) {
        const rowCount = parseInt(event.target.value, 10) || 0;

        this.setState({ rowCount });
    }

    _onScrollToRowChange(event) {
        const { rowCount } = this.state;
        let scrollToIndex = Math.min(
            rowCount - 1,
            parseInt(event.target.value, 10),
        );

        if (isNaN(scrollToIndex)) {
            scrollToIndex = undefined;
        }

        this.setState({ scrollToIndex });
    }

    _rowRenderer({ index, isScrolling, key, style }) {
        const { showScrollingPlaceholder, useDynamicRowHeight } = this.state;

        if (showScrollingPlaceholder && isScrolling) {
            return (
                <div
                    className={clsx(styles.row, styles.isScrollingPlaceholder)}
                    key={key}
                    style={style}>
                    Scrolling...
          </div>
            );
        }

        const datum = this._getDatum(index);

        let additionalContent;

        if (useDynamicRowHeight) {
            switch (datum.size) {
                case 75:
                    additionalContent = <div>It is medium-sized.</div>;
                    break;
                case 100:
                    additionalContent = (
                        <div>
                            It is large-sized.
                <br />
                            It has a 3rd row.
              </div>
                    );
                    break;
            }
        }

        return (
            <div className={styles.row} key={key} style={style}>
                <div
                    className={styles.letter}
                    style={{
                        backgroundColor: datum.color,
                    }}>
                    {datum.name.charAt(0)}
                </div>
                <div>
                    <div className={styles.name}>{datum.name}</div>
                    <div className={styles.index}>This is row {index}</div>
                    {additionalContent}
                </div>
                {useDynamicRowHeight && (
                    <span className={styles.height}>{datum.size}px</span>
                )}
            </div>
        );
    }
}
