// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import {ScenegraphLayer as DeckScenegraphLayer} from '@deck.gl/mesh-layers';
import {load} from '@loaders.gl/core';
import {GLTFLoader, postProcessGLTF} from '@loaders.gl/gltf';

import Layer, {LayerBaseConfig} from '../base-layer';
import ScenegraphLayerIcon from './scenegraph-layer-icon';
import ScenegraphInfoModalFactory from './scenegraph-info-modal';
import {LAYER_VIS_CONFIGS} from '@soft-yyw/kepler.gl-constants';
import {
  ColorRange,
  Merge,
  VisConfigColorRange,
  VisConfigNumber,
  LayerColumn
} from '@soft-yyw/kepler.gl-types';
import {default as KeplerTable} from '@soft-yyw/kepler.gl-table';
import {DataContainerInterface} from '@soft-yyw/kepler.gl-utils';

export type ScenegraphLayerVisConfigSettings = {
  opacity: VisConfigNumber;
  colorRange: VisConfigColorRange;
  sizeScale: VisConfigNumber;
  angleX: VisConfigNumber;
  angleY: VisConfigNumber;
  angleZ: VisConfigNumber;
};

export type ScenegraphLayerColumnsConfig = {
  lat: LayerColumn;
  lng: LayerColumn;
  altitude?: LayerColumn;
};

export type ScenegraphLayerVisConfig = {
  opacity: number;
  colorRange: ColorRange;
  sizeScale: number;
  angleX: number;
  angleY: number;
  angleZ: number;
  scenegraph: string;
};

export type ScenegraphLayerConfig = Merge<
  LayerBaseConfig,
  {columns: ScenegraphLayerColumnsConfig; visConfig: ScenegraphLayerVisConfig}
>;

export type ScenegraphLayerData = {position: number[]; index: number};

export const scenegraphRequiredColumns: ['lat', 'lng'] = ['lat', 'lng'];
export const scenegraphOptionalColumns: ['altitude'] = ['altitude'];

export function fetchGltf(url, {propName, layer}: {propName?: string; layer?: any} = {}) {
  if (propName === 'scenegraph') {
    return load(url, GLTFLoader, layer.getLoadOptions()).then(gltfWithBuffers =>
      postProcessGLTF(gltfWithBuffers)
    );
  }

  return fetchGltf(url).then(response => response.json());
}

export const scenegraphPosAccessor =
  ({lat, lng, altitude}: ScenegraphLayerColumnsConfig) =>
  (dc: DataContainerInterface) =>
  d =>
    [
      dc.valueAt(d.index, lng.fieldIdx),
      dc.valueAt(d.index, lat.fieldIdx),
      altitude && altitude.fieldIdx > -1 ? dc.valueAt(d.index, altitude.fieldIdx) : 0
    ];

export const scenegraphVisConfigs: {
  opacity: 'opacity';
  colorRange: 'colorRange';
  //
  sizeScale: 'sizeScale';
  angleX: VisConfigNumber;
  angleY: VisConfigNumber;
  angleZ: VisConfigNumber;
} = {
  opacity: 'opacity',
  colorRange: 'colorRange',
  //
  sizeScale: 'sizeScale',
  angleX: {
    ...LAYER_VIS_CONFIGS.angle,
    property: 'angleX',
    label: 'angle X'
  },
  angleY: {
    ...LAYER_VIS_CONFIGS.angle,
    property: 'angleY',
    label: 'angle Y'
  },
  angleZ: {
    ...LAYER_VIS_CONFIGS.angle,
    property: 'angleZ',
    defaultValue: 90,
    label: 'angle Z'
  }
};

const DEFAULT_MODEL =
  'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/master/2.0/Duck/glTF-Binary/Duck.glb';
const DEFAULT_TRANSITION: [0, 0, 0] = [0, 0, 0];
const DEFAULT_SCALE: [1, 1, 1] = [1, 1, 1];
const DEFAULT_COLOR: [255, 255, 255, 255] = [255, 255, 255, 255];

export default class ScenegraphLayer extends Layer {
  declare visConfigSettings: ScenegraphLayerVisConfigSettings;
  declare config: ScenegraphLayerConfig;

  _layerInfoModal: () => JSX.Element;

  constructor(props) {
    super(props);

    this.registerVisConfig(scenegraphVisConfigs);
    this.getPositionAccessor = (dataContainer: DataContainerInterface) =>
      scenegraphPosAccessor(this.config.columns)(dataContainer);

    // prepare layer info modal
    this._layerInfoModal = ScenegraphInfoModalFactory();
  }

  get type(): '3D' {
    return '3D';
  }

  get requiredLayerColumns() {
    return scenegraphRequiredColumns;
  }

  get optionalColumns() {
    return scenegraphOptionalColumns;
  }

  get columnPairs() {
    return this.defaultPointColumnPairs;
  }

  get layerIcon() {
    return ScenegraphLayerIcon;
  }

  get layerInfoModal() {
    return {
      id: 'scenegraphInfo',
      template: this._layerInfoModal,
      modalProps: {
        title: 'How to use Scenegraph'
      }
    };
  }

  calculateDataAttribute({filteredIndex}: KeplerTable, getPosition) {
    const data: ScenegraphLayerData[] = [];

    for (let i = 0; i < filteredIndex.length; i++) {
      const index = filteredIndex[i];
      const pos: number[] = getPosition({index});

      // if doesn't have point lat or lng, do not add the point
      // deck.gl can't handle position = null
      if (pos.every(Number.isFinite)) {
        data.push({
          position: pos,
          index
        });
      }
    }
    return data;
  }

  formatLayerData(datasets, oldLayerData) {
    if (this.config.dataId === null) {
      return {};
    }
    const {gpuFilter, dataContainer} = datasets[this.config.dataId];
    const {data} = this.updateData(datasets, oldLayerData);
    const getPosition = this.getPositionAccessor(dataContainer);
    return {
      data,
      getPosition,
      getFilterValue: gpuFilter.filterValueAccessor(dataContainer)()
    };
  }

  updateLayerMeta(dataset: KeplerTable, getPosition) {
    const {dataContainer} = dataset;
    const bounds = this.getPointsBounds(dataContainer, getPosition);
    this.updateMeta({bounds});
  }

  renderLayer(opts) {
    const {data, gpuFilter} = opts;

    const {
      visConfig: {sizeScale = 1, angleX = 0, angleY = 0, angleZ = 90}
    } = this.config;

    return [
      new DeckScenegraphLayer({
        ...this.getDefaultDeckLayerProps(opts),
        // gpu data filtering is not supported at the moment in scenegraphLayer https://github.com/visgl/deck.gl/issues/8099
        extensions: [],
        ...data,
        fetch: fetchGltf,
        scenegraph: this.config.visConfig.scenegraph || DEFAULT_MODEL,
        sizeScale,
        getTranslation: DEFAULT_TRANSITION,
        getScale: DEFAULT_SCALE,
        getOrientation: [angleX, angleY, angleZ],
        getColor: DEFAULT_COLOR,
        // parameters
        parameters: {depthTest: true, blend: false},
        // update triggers
        updateTriggers: {
          getOrientation: {angleX, angleY, angleZ},
          getPosition: this.config.columns,
          getFilterValue: gpuFilter.filterValueUpdateTriggers
        }
      })
    ];
  }
}
