import React, { Component } from 'react';
import { Table, TableData } from '@finos/perspective';
import { ServerRespond } from './DataStreamer';
import { DataManipulator } from './DataManipulator';
import './Graph.css';

interface IProps {
  data: ServerRespond[],
}

interface PerspectiveViewerElement extends HTMLElement {
  load: (table: Table) => void,
}
class Graph extends Component<IProps, {}> {
  table: Table | undefined;

  render() {
    return React.createElement('perspective-viewer');
  }

  componentDidMount() {
    // Get element from the DOM.
    const elem = document.getElementsByTagName('perspective-viewer')[0] as unknown as PerspectiveViewerElement;

    const schema = {
      price_abc: 'float',
      price_def: 'float',
      ratio: 'float', // Tracks the ratio between stocks ABC and DEF.
      timestamp: 'date', // Ratios are being tracked with respect to time.
      upper_bound: 'float',
      lower_bound: 'float',
      trigger_alert: 'float', // Alerts when the ratio between the stocks crosses the upper or lower bound.
    };

    if (window.perspective && window.perspective.worker()) {
      this.table = window.perspective.worker().table(schema);
    }
    if (this.table) {
      // Load the `table` in the `<perspective-viewer>` DOM reference.
      elem.load(this.table);
      elem.setAttribute('view', 'y_line');
      elem.setAttribute('row-pivots', '["timestamp"]'); // Lists timestamps along x-axis.
      elem.setAttribute('columns', '["ratio", "lower_bound", "upper_bound", "trigger_alert"]'); // Plots only the 
                                                                                                // selected datapoints.
      elem.setAttribute('aggregates', JSON.stringify({ // Handles duplicate values by consolidating them into a
        price_abc: 'avg',                              // single point. Values are considered unique by having
        price_def: 'avg',                              // a different timestamp. Otherwise, find their average.
        ratio: 'avg',
        timestamp: 'distinct count',
        upper_bound: 'avg',
        lower_bound: 'avg',
        trigger_alert: 'avg',
      })); 
    }
  }

  // Executes whenever there is new data.
  componentDidUpdate() {
    if (this.table) {
      this.table.update([
        DataManipulator.generateRow(this.props.data),
      ] as unknown as TableData);
    }
  }
}

export default Graph;
