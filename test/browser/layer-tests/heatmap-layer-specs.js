// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import test from 'tape';
import {
  testCreateCases,
  testFormatLayerDataCases,
  preparedDataset,
  dataId,
  pointLayerMeta
} from 'test/helpers/layer-utils';
import {StateWFiles, testCsvDataId} from 'test/helpers/mock-state';
import {gpsPointBounds} from 'test/fixtures/test-csv-data';

import {MAX_ZOOM_LEVEL, KeplerGlLayers} from '@soft-yyw/kepler.gl-layers';
import {copyTableAndUpdate} from '@soft-yyw/kepler.gl-table';

const {HeatmapLayer} = KeplerGlLayers;

const columns = {
  lat: 'lat',
  lng: 'lng'
};

test('#HeatmapLayer -> contructor', t => {
  const TEST_CASES = {
    CREATE: [
      {
        props: {
          dataId: 'taro',
          isVisible: true,
          label: 'test heatmap layer'
        },
        test: layer => {
          // test constructor
          t.equal(layer.config.visConfig.radius, 20, 'Heatmap default radius should be 20');
          t.ok(layer.config.dataId === 'taro', 'heatmaplayer dataId should be correct');
          t.ok(layer.type === 'heatmap', 'type should be heatmap');
          t.ok(layer.isAggregated === true, 'heatmaplayer is aggregated');
          t.ok(layer.config.label === 'test heatmap layer', 'label should be correct');
          t.ok(Object.keys(layer.columnPairs).length, 'should have columnPairs');
        }
      }
    ]
  };

  testCreateCases(t, HeatmapLayer, TEST_CASES.CREATE);
  t.end();
});

test('#Heatmaplayer -> formatLayerData -> w/ GpuFilter', t => {
  const filteredIndex = [0, 2, 4];

  const expectedConfig = {
    type: 'heatmap',
    id: 'heatmap-test-1',
    source: `${dataId}-points-1-2--1`,
    layout: {visibility: 'visible'},
    filter: ['all', ['>=', 'gpu:utc_timestamp', 39000], ['<=', 'gpu:utc_timestamp', 552000]],
    paint: {
      'heatmap-weight': ['interpolate', ['linear'], ['get', 'id'], 1, 0, 345, 1],
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 18, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0,0,0,0)',
        0.14285714285714285,
        'rgb(76,0,53)',
        0.2857142857142857,
        'rgb(136,0,48)',
        0.42857142857142855,
        'rgb(183,47,21)',
        0.5714285714285714,
        'rgb(214,97,10)',
        0.7142857142857143,
        'rgb(239,145,0)',
        0.8571428571428571,
        'rgb(255,195,0)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 18, 20],
      'heatmap-opacity': 0.8
    }
  };

  const TEST_CASES = [
    {
      name: 'Heatmap gps point.1',
      layer: {
        type: 'heatmap',
        id: 'heatmap-test-1',
        config: {
          dataId,
          label: 'mapbox heatmap',
          isVisible: true,
          columns,
          weightField: {
            type: 'integer',
            name: 'id'
          }
        }
      },
      datasets: {
        [dataId]: copyTableAndUpdate(preparedDataset, {filteredIndex})
      },
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          columns: {
            lat: {value: 'lat', fieldIdx: 1},
            lng: {value: 'lng', fieldIdx: 2},
            geoarrow: {value: null, fieldIdx: -1}
          },
          config: expectedConfig,
          data: {
            type: 'FeatureCollection',
            features: [
              {
                type: 'Feature',
                properties: {
                  index: 0,
                  'gpu:utc_timestamp': Number.MIN_SAFE_INTEGER,
                  id: 1
                },
                geometry: {type: 'Point', coordinates: [-122.39096, 37.778564]}
              },
              {
                type: 'Feature',
                properties: {
                  index: 4,
                  'gpu:utc_timestamp': 184000,
                  id: 5
                },
                geometry: {type: 'Point', coordinates: [-122.136795, 37.456535]}
              }
            ]
          },
          weightField: null,
          getPosition: () => {}
        };

        t.deepEqual(
          Object.keys(layerData).sort(),
          Object.keys(expectedLayerData).sort(),
          'lheatmap ayerData should have correct keys'
        );
        t.deepEqual(
          layerData.columns,
          expectedLayerData.columns,
          'should format correct heatmap layerData.columns'
        );

        // test data
        t.deepEqual(
          layerData.data,
          expectedLayerData.data,
          'should format correct heatmap layerData.data'
        );

        // test columns,
        expectedLayerData.config.id = layer.id;
        // test config
        t.deepEqual(
          layerData.config,
          expectedLayerData.config,
          'should format correct heatmap layerData.config'
        );

        // test layer.meta
        t.deepEqual(layer.meta, pointLayerMeta, 'should format correct heatmap layer.meta');
      }
    }
  ];

  testFormatLayerDataCases(t, HeatmapLayer, TEST_CASES);
  t.end();
});

test('#Heatmaplayer -> formatLayerData -> w/o GpuFilter', t => {
  const testData = StateWFiles.visState.datasets[testCsvDataId];
  const gpsColumns = {
    lat: 'gps_data.lat',
    lng: 'gps_data.lng'
  };

  const expectedConfig = {
    type: 'heatmap',
    id: 'heatmap-test-1',
    source: `${testCsvDataId}-points-1-2--1`,
    layout: {visibility: 'visible'},
    paint: {
      'heatmap-weight': 1,
      'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, MAX_ZOOM_LEVEL, 3],
      'heatmap-color': [
        'interpolate',
        ['linear'],
        ['heatmap-density'],
        0,
        'rgba(0,0,0,0)',
        0.25,
        'rgb(1,1,1)',
        0.5,
        'rgb(2,2,2)',
        0.75,
        'rgb(3,3,3)'
      ],
      'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, MAX_ZOOM_LEVEL, 100],
      'heatmap-opacity': 0.2
    }
  };

  const TEST_CASES = [
    {
      name: 'Heatmap gps point.1',
      layer: {
        type: 'heatmap',
        id: 'heatmap-test-1',
        config: {
          dataId: testCsvDataId,
          label: 'mapbox heatmap',
          isVisible: true,
          columns: gpsColumns,
          visConfig: {
            colorRange: {
              colors: ['#010101', '#020202', '#030303']
            },
            radius: 100,
            opacity: 0.2
          }
        }
      },
      datasets: StateWFiles.visState.datasets,
      assert: result => {
        const {layerData, layer} = result;

        const expectedLayerData = {
          columns: {
            lat: {value: 'gps_data.lat', fieldIdx: 1},
            lng: {value: 'gps_data.lng', fieldIdx: 2},
            geoarrow: {value: null, fieldIdx: -1}
          },
          config: expectedConfig,
          weightField: null,
          getPosition: () => {}
        };
        const expectedLayerMeta = {bounds: gpsPointBounds};

        // test columns,
        t.deepEqual(
          layerData.columns,
          expectedLayerData.columns,
          'should format correct heatmap layerData.columns'
        );

        // test data
        t.equal(
          layerData.data.features.length,
          testData.dataContainer.numRows(),
          'should have same number of features'
        );

        t.deepEqual(
          layerData.data.features[0],
          {
            type: 'Feature',
            properties: {
              index: 0
            },
            geometry: {type: 'Point', coordinates: [31.2590542, 29.9900937]}
          },
          'should format correct feature 0'
        );
        // test id
        expectedLayerData.config.id = layer.id;

        // test config
        t.deepEqual(
          layerData.config,
          expectedLayerData.config,
          'should format correct heatmap layerData.config'
        );

        // test layer.meta
        t.deepEqual(layer.meta, expectedLayerMeta, 'should format correct heatmap layer.meta');
      }
    }
  ];

  testFormatLayerDataCases(t, HeatmapLayer, TEST_CASES);
  t.end();
});
