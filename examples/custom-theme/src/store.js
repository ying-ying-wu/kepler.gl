// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import Window from 'global/window';
import {combineReducers, createStore, applyMiddleware, compose} from 'redux';
import {enhanceReduxMiddleware} from '@soft-yyw/kepler.gl-reducers';

import demoReducer from './reducers/index';

const reducers = combineReducers({
  demo: demoReducer
});

const middlewares = enhanceReduxMiddleware([]);

export const enhancers = [applyMiddleware(...middlewares)];

const initialState = {};

// add redux devtools
const composeEnhancers = Window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;

export default createStore(reducers, initialState, composeEnhancers(...enhancers));
