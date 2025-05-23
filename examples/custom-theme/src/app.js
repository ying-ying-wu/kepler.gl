// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import React, {useEffect, useState} from 'react';
import styled from 'styled-components';
import Window from 'global/window';
import {connect} from 'react-redux';
import KeplerGl from '@soft-yyw/kepler.gl-components';

const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const theme = {
  sidePanelBg: '#ffffff',
  titleTextColor: '#000000',
  sidePanelHeaderBg: '#f7f7F7',
  subtextColorActive: '#2473bd',
  tooltipBg: '#1869b5',
  tooltipColor: '#ffffff',
  dropdownListBgd: '#ffffff',
  textColorHl: '#2473bd',
  inputBgd: '#f7f7f7',
  inputBgdHover: '#ffffff',
  inputBgdActive: '#ffffff',
  dropdownListHighlightBg: '#f0f0f0',
  panelBackground: '#f7f7F7',
  panelBackgroundHover: '#f7f7F7',
  secondaryInputBgd: '#f7f7F7',
  secondaryInputBgdActive: '#f7f7F7',
  secondaryInputBgdHover: '#ffffff',
  panelActiveBg: '#f7f7F7'
};

const emptyTheme = {};

const StyleSwitch = styled.div`
  position: absolute;
  bottom: 24px;
  right: 24px;
  background-color: whitesmoke;
  padding: 4px;
  z-index: 1000;
  border-radius: 3px;
  border: 1px solid mediumseagreen;
`;

function App() {
  const [customTheme, setTheme] = useState(false);
  const [windowDimension, setDimension] = useState({
    width: Window.innerWidth,
    height: Window.innerHeight
  });

  useEffect(() => {
    const handleResize = () => {
      setDimension({width: Window.innerWidth, height: Window.innerHeight});
    };
    Window.addEventListener('resize', handleResize);
    return () => Window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div>
      <StyleSwitch>
        <label htmlFor="custom-theme">Custom theme</label>
        <input
          type="checkbox"
          checked={customTheme}
          id="custom-theme"
          onChange={e => setTheme(e.target.checked)}
        />
      </StyleSwitch>
      <KeplerGl
        mapboxApiAccessToken={MAPBOX_TOKEN}
        id="map"
        /*
         * Specify path to keplerGl state, because it is not mount at the root
         */
        getState={state => state.demo.keplerGl}
        width={windowDimension.width}
        height={windowDimension.height}
        theme={customTheme ? theme : emptyTheme}
      />
    </div>
  );
  // }
}

const mapStateToProps = state => state;
const dispatchToProps = dispatch => ({dispatch});

export default connect(mapStateToProps, dispatchToProps)(App);
