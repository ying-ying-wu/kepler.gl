// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import React, {
  CSSProperties,
  ChangeEventHandler,
  Component,
  MouseEventHandler,
  TouchEventHandler
} from 'react';
import styled from 'styled-components';

import {ActionHandler, MapStateActions, VisStateActions, toggleModal} from '@soft-yyw/kepler.gl-actions';
import {dataTestIds} from '@soft-yyw/kepler.gl-constants';
import {Layer, LayerBaseConfig} from '@soft-yyw/kepler.gl-layers';
import {Datasets} from '@soft-yyw/kepler.gl-table';
import {ColorUI, LayerVisConfig, NestedPartial, SplitMap} from '@soft-yyw/kepler.gl-types';
import LayerConfiguratorFactory from './layer-configurator';
import LayerPanelHeaderFactory from './layer-panel-header';

type LayerPanelProps = {
  className?: string;
  style?: CSSProperties;
  onMouseDown?: MouseEventHandler;
  onTouchStart?: TouchEventHandler;
  layer: Layer;
  datasets: Datasets;
  layerTypeOptions: {
    id: string;
    label: string;
    icon: any; //
    requireData: any; //
  }[];
  isDraggable?: boolean;
  idx: number;
  openModal: ActionHandler<typeof toggleModal>;
  layerColorUIChange: ActionHandler<typeof VisStateActions.layerColorUIChange>;
  layerConfigChange: ActionHandler<typeof VisStateActions.layerConfigChange>;
  layerVisualChannelConfigChange: ActionHandler<
    typeof VisStateActions.layerVisualChannelConfigChange
  >;
  layerSetIsValid: ActionHandler<typeof VisStateActions.layerSetIsValid>;
  layerTypeChange: ActionHandler<typeof VisStateActions.layerTypeChange>;
  layerVisConfigChange: ActionHandler<typeof VisStateActions.layerVisConfigChange>;
  layerTextLabelChange: ActionHandler<typeof VisStateActions.layerTextLabelChange>;
  removeLayer: ActionHandler<typeof VisStateActions.removeLayer>;
  zoomToLayer: ActionHandler<typeof MapStateActions.fitBounds>;
  duplicateLayer: ActionHandler<typeof VisStateActions.duplicateLayer>;
  listeners?: React.ElementType;
  layerToggleVisibility: ActionHandler<typeof VisStateActions.layerToggleVisibility>;
  splitMap?: SplitMap;
};

const PanelWrapper = styled.div`
  font-size: 12px;
  border-radius: 1px;
  z-index: 1000;
  &.dragging {
    cursor: move;
  }
`;

LayerPanelFactory.deps = [LayerConfiguratorFactory, LayerPanelHeaderFactory];

function LayerPanelFactory(
  LayerConfigurator: ReturnType<typeof LayerConfiguratorFactory>,
  LayerPanelHeader: ReturnType<typeof LayerPanelHeaderFactory>
): React.ComponentType<LayerPanelProps> {
  class LayerPanel extends Component<LayerPanelProps> {
    updateLayerConfig = (newProp: Partial<LayerBaseConfig>) => {
      this.props.layerConfigChange(this.props.layer, newProp);
    };

    updateLayerType = (newType: string) => {
      this.props.layerTypeChange(this.props.layer, newType);
    };

    updateLayerVisConfig = (newVisConfig: Partial<LayerVisConfig>) => {
      this.props.layerVisConfigChange(this.props.layer, newVisConfig);
    };

    updateLayerColorUI = (...args: [string, NestedPartial<ColorUI>]) => {
      this.props.layerColorUIChange(this.props.layer, ...args);
    };

    updateLayerTextLabel = (...args: [number | 'all', string, any]) => {
      this.props.layerTextLabelChange(this.props.layer, ...args);
    };

    updateLayerVisualChannelConfig = (
      newConfig: Partial<LayerBaseConfig>,
      channel: string,
      newVisConfig?: Partial<LayerVisConfig>
    ) => {
      this.props.layerVisualChannelConfigChange(this.props.layer, newConfig, channel, newVisConfig);
    };

    _updateLayerLabel: ChangeEventHandler<HTMLInputElement> = ({target: {value}}) => {
      this.updateLayerConfig({label: value});
    };

    _toggleVisibility: MouseEventHandler = e => {
      e.stopPropagation();
      const isVisible = !this.props.layer.config.isVisible;
      this.props.layerToggleVisibility(this.props.layer.id, isVisible);
    };

    _resetIsValid: MouseEventHandler = e => {
      e?.stopPropagation();
      // Make the layer valid and visible again after an error
      this.props.layerSetIsValid(this.props.layer, true);
    };

    _toggleEnableConfig: MouseEventHandler = e => {
      e?.stopPropagation();
      const {
        layer: {
          config: {isConfigActive}
        }
      } = this.props;
      this.updateLayerConfig({isConfigActive: !isConfigActive});
    };

    _removeLayer: MouseEventHandler = e => {
      e?.stopPropagation();
      this.props.removeLayer(this.props.layer.id);
    };

    _zoomToLayer: MouseEventHandler = e => {
      e?.stopPropagation();
      const bounds = this.props.layer?.meta?.bounds;
      bounds && this.props.zoomToLayer(bounds);
    };

    _duplicateLayer: MouseEventHandler = e => {
      e?.stopPropagation();
      this.props.duplicateLayer(this.props.layer.id);
    };

    render() {
      const {layer, datasets, isDraggable, layerTypeOptions, listeners, splitMap} = this.props;
      const {config, isValid} = layer;
      const {isConfigActive} = config;
      const allowDuplicate =
        typeof layer.isValidToSave === 'function' && layer.isValidToSave() && isValid;
      const layerVisInSplitMap = splitMap?.layers?.[layer.id];

      return (
        <PanelWrapper
          className={`layer-panel ${this.props.className}`}
          data-testid={dataTestIds.layerPanel}
          style={this.props.style}
          onMouseDown={this.props.onMouseDown}
          onTouchStart={this.props.onTouchStart}
        >
          <LayerPanelHeader
            isConfigActive={isConfigActive}
            layerId={layer.id}
            isVisible={layerVisInSplitMap ?? config.isVisible}
            isValid={isValid}
            label={config.label}
            labelRCGColorValues={config.dataId ? datasets[config.dataId].color : null}
            layerType={layer.type}
            allowDuplicate={allowDuplicate}
            onToggleEnableConfig={this._toggleEnableConfig}
            onToggleVisibility={this._toggleVisibility}
            onResetIsValid={this._resetIsValid}
            onUpdateLayerLabel={this._updateLayerLabel}
            onRemoveLayer={this._removeLayer}
            onZoomToLayer={this._zoomToLayer}
            onDuplicateLayer={this._duplicateLayer}
            isDragNDropEnabled={isDraggable}
            listeners={listeners}
          />
          {isConfigActive && (
            <LayerConfigurator
              layer={layer}
              datasets={datasets}
              layerTypeOptions={layerTypeOptions}
              openModal={this.props.openModal}
              updateLayerColorUI={this.updateLayerColorUI}
              updateLayerConfig={this.updateLayerConfig}
              updateLayerVisualChannelConfig={this.updateLayerVisualChannelConfig}
              updateLayerType={this.updateLayerType}
              updateLayerTextLabel={this.updateLayerTextLabel}
              updateLayerVisConfig={this.updateLayerVisConfig}
            />
          )}
        </PanelWrapper>
      );
    }
  }

  return LayerPanel;
}

export default LayerPanelFactory;
