// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import {addDataToMap, ActionTypes} from '@soft-yyw/kepler.gl-actions';
import {KeplerGlSchema} from '@soft-yyw/kepler.gl-schemas';
import document from 'global/document';

import renderRoot from './components/root';
import createAppStore from './store';
import {loadJupyterData} from './utils';
import log from '../log';

const getData = that => that.model.get('data');
const getConfig = that => that.model.get('config');
const getHeight = that => that.model.get('height');

const DOM_EL_ID = 'keplergl';
let counter = 0;

const NONE_UPDATE_ACTIONS = [
  ActionTypes.REGISTER_ENTRY,
  ActionTypes.DELETE_ENTRY,
  ActionTypes.RENAME_ENTRY,
  ActionTypes.LOAD_MAP_STYLES,
  ActionTypes.LAYER_HOVER
];

function getConfigInStore({hash = true, store} = {}) {
  if (store) {
    const currentState = store.getState().keplerGl.map;
    const currentValue = KeplerGlSchema.getConfigToSave(currentState);
    return hash ? JSON.stringify(currentValue) : currentValue;
  }
  return {};
}

function getDatasetsInStore(store) {
  if (store) {
    return store.getState().keplerGl.map.visState.datasets;
  }
}

class KeplerGlJupyter {
  constructor() {
    this.id = `${DOM_EL_ID}-${counter}`;
    counter++;
    this.mapUpdateCounter = 0;
  }

  create(that) {
    log('kepler.gl create');
    let previousValue;

    function handleStoreChange(action, nextStore) {
      log(action);

      if (!action || NONE_UPDATE_ACTIONS.includes(action.type)) {
        return;
      }

      const saveState = getConfigInStore({hash: false, store: nextStore});
      const hash = JSON.stringify(saveState);

      // should not update model after first UPDATE_MAP action
      // when component first mounted
      if (previousValue !== hash && this.mapUpdateCounter > 2) {
        // keplerGl State has changed
        log('store state has changed, update model');
        log(previousValue);
        log(hash);

        previousValue = hash;
        that.model.set({config: saveState});

        // that.model.save_changes();
        that.touch();
      }
      if (action.type === ActionTypes.UPDATE_MAP) {
        this.mapUpdateCounter++;
      }
    }

    this.store = createAppStore(handleStoreChange.bind(this));

    const height = getHeight(that);

    that.el.classList.add('jupyter-widgets');
    that.el.classList.add('keplergl-jupyter-widgets');

    const divElmt = document.createElement('div');
    divElmt.setAttribute('id', this.id);
    divElmt.classList.add('kepler-gl');
    divElmt.setAttribute('style', ` width: 100%; height: ${height}px;`);
    that.el.appendChild(divElmt);

    renderRoot({id: this.id, store: this.store, ele: divElmt});
    const data = getData(that);
    const config = getConfig(that);
    log('<<<<<<<< render finished! >>>>>>>>>');

    // After rendering the component,
    // we add the data that's already in the model
    const hasData = data && Object.keys(data).length;
    const hasConfig = config && config.version;

    if (hasData) {
      log('data already in model');
      addDataConfigToKeplerGl({data, config, store: this.store});
    } else if (hasConfig) {
      log('config already in model');
      this.onConfigChange(that);
    }
  }

  onDataChange(that) {
    log('kepler.gl onDataChange');
    const data = getData(that);

    addDataConfigToKeplerGl({data, store: this.store});
  }

  onConfigChange(that) {
    log('kepler.gl onConfigChange');
    const config = getConfig(that);

    const currentValue = getConfigInStore({hash: true, store: this.store});
    if (currentValue === JSON.stringify(config)) {
      // calling model.set('config') inside the js component will trigger another onConfigChange
      log('onConfigChange: config is the same as saved in store');
      return;
    }

    this.store.dispatch(
      addDataToMap({
        // reuse datasets in state
        // a hack to apply config to existing data
        datasets: Object.values(getDatasetsInStore(this.store)).map(d => ({
          info: {
            id: d.id,
            label: d.label,
            color: d.color
          },
          data: {
            fields: d.fields,
            ...(d.dataContainer instanceof ArrowDataContainer
              ? {cols: d.dataContainer._cols}
              : {rows: d.allData})
          }
        })),
        config,
        options: {centerMap: false}
      })
    );
  }
}

export function addDataConfigToKeplerGl({data: inputData, config, options, store}) {
  const data = inputData ? dataToDatasets(inputData) : [];
  log(data);

  const results = loadJupyterData(data);
  const succeeded = results.filter(r => r && r.data);
  log('addDataConfigToKeplerGl');
  log(succeeded);
  log(config);
  const hasMapState = Boolean(config && config.config && config.config.mapState);

  store.dispatch(
    addDataToMap({
      datasets: succeeded,
      config,
      options: options || {centerMap: !hasMapState}
    })
  );
}
export function dataToDatasets(data) {
  return Object.keys(data).map(key => ({
    id: key,
    data: data[key]
  }));
}

export default KeplerGlJupyter;
