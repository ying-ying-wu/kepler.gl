// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import React from 'react';
import {IntlWrapper, mountWithTheme} from 'test/helpers/component-utils';
import {Provider} from 'react-redux';
import configureStore from 'redux-mock-store';

import sinon from 'sinon';
import test from 'tape';
import {
  appInjector,
  MapContainerFactory,
  mapFieldsSelector,
  MapViewStateContextProvider
} from '@soft-yyw/kepler.gl-components';
import {mockKeplerProps} from '../../helpers/mock-state';

const MapContainer = appInjector.get(MapContainerFactory);
const initialProps = mapFieldsSelector(mockKeplerProps);

const initialState = {mapState: {latitude: 0, longitude: 0}};
const mockStore = configureStore();

test('MapContainerFactory - display all options', t => {
  const onMapStyleLoaded = sinon.spy();
  const onLayerClick = sinon.spy();
  const store = mockStore(initialState);

  const props = {
    ...initialProps,
    mapStyle: {
      bottomMapStyle: {layers: [], name: 'foo'},
      visibleLayerGroups: {}
    },
    onMapStyleLoaded,
    visStateActions: {
      ...initialProps.visStateActions,
      onLayerClick
    }
  };
  let wrapper;
  t.doesNotThrow(() => {
    wrapper = mountWithTheme(
      <Provider store={store}>
        <IntlWrapper>
          <MapViewStateContextProvider mapState={props.mapState}>
            <MapContainer {...props} />
          </MapViewStateContextProvider>
        </IntlWrapper>
      </Provider>
    );
  }, 'MapContainer should not fail without props');

  t.equal(wrapper.find('MapControl').length, 1, 'Should display 1 MapControl');

  t.equal(wrapper.find('Map').length, 1, 'Should display 1 Map');

  // Editor
  t.equal(wrapper.find('DeckGl').length, 1, 'Should display 1 DeckGl');

  const instance = wrapper.find(MapContainer).instance();

  instance._onMapboxStyleUpdate();

  t.equal(onMapStyleLoaded.called, true, 'Should be calling onMapStyleLoaded');

  instance._onCloseMapPopover();
  t.equal(onLayerClick.called, true, 'Should be calling onLayerClick');

  t.end();
});
