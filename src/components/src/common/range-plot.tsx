// SPDX-License-Identifier: MIT
// Copyright contributors to the kepler.gl project

import React, {useCallback, useEffect, useMemo, useRef, useState, CSSProperties} from 'react';
import styled, {withTheme} from 'styled-components';
import RangeBrushFactory, {OnBrush, RangeBrushProps} from './range-brush';
import HistogramPlotFactory from './histogram-plot';
import LineChartFactory, {HoverDP} from './line-chart';
import {hasMobileWidth, isTest} from '@soft-yyw/kepler.gl-utils';
import {PLOT_TYPES} from '@soft-yyw/kepler.gl-constants';
import LoadingSpinner from './loading-spinner';
import {breakPointValues} from '@soft-yyw/kepler.gl-styles';
import {LineChart as LineChartType, Filter, Bins} from '@soft-yyw/kepler.gl-types';
import {Datasets} from '@soft-yyw/kepler.gl-table';

const StyledRangePlot = styled.div`
  margin-bottom: ${props => props.theme.sliderBarHeight}px;
  display: flex;
  position: relative;
`;

interface RangePlotProps {
  onBrush: OnBrush;
  range: number[];
  value: number[];
  width: number;
  plotType: {
    [key: string]: any;
  };
  lineChart?: LineChartType;
  bins?: Bins;

  isEnlarged?: boolean;
  isRanged?: boolean;
  theme: any;
  timeFormat?: string;
  timezone?: string | null;
  playbackControlWidth?: number;

  animationWindow?: string;
  filter?: Filter;
  datasets?: Datasets;

  invertTrendColor?: boolean;

  style: CSSProperties;
}

type WithPlotLoadingProps = RangePlotProps &
  Partial<RangeBrushProps> & {
    setFilterPlot: any;
  };

RangePlotFactory.deps = [RangeBrushFactory, HistogramPlotFactory, LineChartFactory];

const isHistogramPlot = plotType => plotType?.type === PLOT_TYPES.histogram;
const isLineChart = plotType => plotType?.type === PLOT_TYPES.lineChart;
const hasHistogram = (plotType, bins) => isHistogramPlot(plotType) && bins;
const hasLineChart = (plotType, lineChart) => isLineChart(plotType) && lineChart;

const LOADING_SPINNER_CONTAINER_STYLE = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '100%'
};

export default function RangePlotFactory(
  RangeBrush: ReturnType<typeof RangeBrushFactory>,
  HistogramPlot: ReturnType<typeof HistogramPlotFactory>,
  LineChartPlot: ReturnType<typeof LineChartFactory>
) {
  const RangePlot = ({
    bins,
    onBrush,
    range,
    value,
    width,
    plotType,
    lineChart,
    isEnlarged,
    isRanged,
    theme,
    ...chartProps
  }: RangePlotProps & Partial<RangeBrushProps>) => {
    const groupColors = useMemo(() => {
      const dataIds = bins ? Object.keys(bins) : [];
      return plotType.colorsByDataId
        ? dataIds.reduce((acc, dataId) => {
            acc[dataId] = plotType.colorsByDataId[dataId];
            return acc;
          }, {})
        : null;
    }, [bins, plotType.colorsByDataId]);

    const [brushing, setBrushing] = useState(false);
    const [hoveredDP, onMouseMove] = useState<HoverDP | null>(null);
    const [enableChartHover, setEnableChartHover] = useState(false);
    const height = isEnlarged
      ? hasMobileWidth(breakPointValues)
        ? theme.rangePlotHLargePalm
        : theme.rangePlotHLarge
      : theme.rangePlotH;

    const onBrushStart = useCallback(() => {
      setBrushing(true);
      onMouseMove(null);
      setEnableChartHover(false);
    }, [setBrushing, onMouseMove, setEnableChartHover]);

    const onBrushEnd = useCallback(() => {
      setBrushing(false);
      setEnableChartHover(true);
    }, [setBrushing, setEnableChartHover]);

    const onMouseoverHandle = useCallback(() => {
      onMouseMove(null);
      setEnableChartHover(false);
    }, [onMouseMove, setEnableChartHover]);

    const onMouseoutHandle = useCallback(() => {
      setEnableChartHover(true);
    }, [setEnableChartHover]);

    // JsDom have limited support for SVG, d3 will fail
    const brushComponent = isTest() ? null : (
      <RangeBrush
        onBrush={onBrush}
        onBrushStart={onBrushStart}
        onBrushEnd={onBrushEnd}
        range={range}
        value={value}
        width={width}
        height={height}
        isRanged={isRanged}
        onMouseoverHandle={onMouseoverHandle}
        onMouseoutHandle={onMouseoutHandle}
        {...chartProps}
      />
    );

    const commonProps = {
      width,
      value,
      height,
      margin: isEnlarged ? theme.rangePlotMarginLarge : theme.rangePlotMargin,
      brushComponent,
      brushing,
      isEnlarged,
      enableChartHover,
      onMouseMove,
      hoveredDP,
      isRanged,
      onBrush,
      ...chartProps
    };

    return isLineChart(plotType) && lineChart ? (
      <LineChartPlot lineChart={lineChart} {...commonProps} />
    ) : (
      <HistogramPlot
        histogramsByGroup={bins}
        colorsByGroup={groupColors}
        range={range}
        {...commonProps}
      />
    );
  };

  const RangePlotWithTheme = withTheme(RangePlot) as React.FC<
    RangePlotProps & Partial<RangeBrushProps>
  >;

  // a container to render spinner or message when the data is too big
  // to generate a plot
  const WithPlotLoading = ({
    lineChart,
    plotType,
    bins,
    setFilterPlot,
    isEnlarged,
    theme,
    ...otherProps
  }: WithPlotLoadingProps) => {
    const [isLoading, setIsLoading] = useState(false);
    const isChangingRef = useRef(false);

    useEffect(() => {
      if (isChangingRef.current) {
        if (hasHistogram(plotType, bins)) {
          // Bins are loaded
          isChangingRef.current = false;
        }
      } else {
        if (!plotType || (isHistogramPlot(plotType) && !bins)) {
          // load histogram
          setIsLoading(true);
          setFilterPlot({plotType: {type: PLOT_TYPES.histogram}});
          isChangingRef.current = true;
        }
      }
    }, [bins, plotType, setFilterPlot]);

    useEffect(() => {
      if (isChangingRef.current) {
        if (hasLineChart(plotType, lineChart)) {
          // Line chart is loaded
          isChangingRef.current = false;
        }
      } else {
        if (isLineChart(plotType) && !lineChart) {
          // load line chart
          setIsLoading(true);
          setFilterPlot({plotType: {type: PLOT_TYPES.lineChart}});
          isChangingRef.current = true;
        }
      }
    }, [lineChart, plotType, setFilterPlot]);

    const rangePlotStyle = useMemo(
      () => ({
        height: `${
          isEnlarged
            ? hasMobileWidth(breakPointValues)
              ? theme.rangePlotContainerHLargePalm
              : theme.rangePlotContainerHLarge
            : theme.rangePlotContainerH
        }px`
      }),
      [isEnlarged, theme]
    );

    return (
      <StyledRangePlot style={rangePlotStyle} className="kg-range-slider__plot">
        {isLoading ? (
          <div style={LOADING_SPINNER_CONTAINER_STYLE}>
            <LoadingSpinner borderColor="transparent" size={40} />
          </div>
        ) : (
          <RangePlotWithTheme
            lineChart={lineChart}
            bins={bins}
            plotType={plotType}
            isEnlarged={isEnlarged}
            theme={theme}
            {...otherProps}
          />
        )}
      </StyledRangePlot>
    );
  };

  return withTheme(WithPlotLoading) as React.FC<Omit<WithPlotLoadingProps, 'theme'>>;
}
