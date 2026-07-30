import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Activity, TrendingDown, TrendingUp, Maximize2, Zap } from 'lucide-react';

export interface GasHistoryDataPoint {
  timestamp: Date;
  minuteAgo: number; // 0 (now), -5, -10... up to -60
  gwei: number;
  lowGwei: number;
  highGwei: number;
}

interface GasPriceD3ChartProps {
  currentGwei: number;
  selectedTier: 'low' | 'medium' | 'high';
  isUpdating?: boolean;
}

// Generate realistic 60-minute historical gas price series ending at currentGwei
function generateInitialGasHistory(baseGwei: number): GasHistoryDataPoint[] {
  const points: GasHistoryDataPoint[] = [];
  const now = new Date();
  
  // 60 minutes, data point every minute or 2 minutes (30 points total)
  let prevGwei = baseGwei + (Math.random() - 0.5) * 8;
  prevGwei = Math.max(10, Math.min(45, prevGwei));

  for (let i = 60; i >= 0; i -= 2) {
    const t = new Date(now.getTime() - i * 60 * 1000);
    // Smooth random walk towards baseGwei as i approaches 0
    const pullFactor = (60 - i) / 60;
    const noise = (Math.random() - 0.48) * 3;
    let gweiVal = prevGwei * (1 - pullFactor * 0.15) + baseGwei * (pullFactor * 0.15) + noise;
    gweiVal = Math.max(10, Math.min(50, parseFloat(gweiVal.toFixed(1))));
    if (i === 0) gweiVal = baseGwei;
    prevGwei = gweiVal;

    points.push({
      timestamp: t,
      minuteAgo: i,
      gwei: gweiVal,
      lowGwei: Math.max(8, parseFloat((gweiVal * 0.75).toFixed(1))),
      highGwei: parseFloat((gweiVal * 1.45).toFixed(1)),
    });
  }

  return points;
}

export const GasPriceD3Chart: React.FC<GasPriceD3ChartProps> = ({
  currentGwei,
  selectedTier,
  isUpdating = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const [history, setHistory] = useState<GasHistoryDataPoint[]>(() =>
    generateInitialGasHistory(currentGwei)
  );
  const [hoveredPoint, setHoveredPoint] = useState<GasHistoryDataPoint | null>(null);

  // Append real-time updates when currentGwei changes
  useEffect(() => {
    setHistory((prev) => {
      const now = new Date();
      const newPoint: GasHistoryDataPoint = {
        timestamp: now,
        minuteAgo: 0,
        gwei: currentGwei,
        lowGwei: Math.max(8, parseFloat((currentGwei * 0.75).toFixed(1))),
        highGwei: parseFloat((currentGwei * 1.45).toFixed(1)),
      };
      
      const filtered = prev
        .map((p) => ({
          ...p,
          minuteAgo: Math.round((now.getTime() - p.timestamp.getTime()) / (60 * 1000)),
        }))
        .filter((p) => p.minuteAgo <= 60);

      return [...filtered, newPoint];
    });
  }, [currentGwei]);

  // Statistics
  const gweiValues: number[] = history.map((d) =>
    selectedTier === 'low' ? d.lowGwei : selectedTier === 'high' ? d.highGwei : d.gwei
  );
  const minGwei: number = (d3.min(gweiValues) ?? 10);
  const maxGwei: number = (d3.max(gweiValues) ?? 50);
  const avgGwei: number = Math.round(d3.mean(gweiValues) ?? currentGwei);
  const latestVal: number = gweiValues[gweiValues.length - 1] ?? currentGwei;
  const firstVal: number = gweiValues[0] ?? latestVal;
  const priceChangePct = (((latestVal - firstVal) / firstVal) * 100).toFixed(1);
  const isUp = parseFloat(priceChangePct) >= 0;

  // Render D3 Chart
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || history.length < 2) return;

    const width = containerRef.current.clientWidth || 400;
    const height = 150;
    const margin = { top: 15, right: 15, bottom: 25, left: 35 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // Clear previous drawing

    svg.attr('width', width).attr('height', height).attr('viewBox', `0 0 ${width} ${height}`);

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // Color theme based on selected tier
    const primaryColor =
      selectedTier === 'low' ? '#10b981' : selectedTier === 'high' ? '#f59e0b' : '#06b6d4';
    const gradientId = `gas-d3-gradient-${selectedTier}`;

    // Define Gradient
    const defs = svg.append('defs');
    const linearGradient = defs
      .append('linearGradient')
      .attr('id', gradientId)
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');

    linearGradient.append('stop').attr('offset', '0%').attr('stop-color', primaryColor).attr('stop-opacity', 0.35);
    linearGradient.append('stop').attr('offset', '100%').attr('stop-color', primaryColor).attr('stop-opacity', 0.0);

    // X Scale (Time)
    const timeDomain = d3.extent(history, (d: GasHistoryDataPoint) => d.timestamp) as [Date, Date];
    const xScale = d3
      .scaleTime()
      .domain(timeDomain[0] && timeDomain[1] ? timeDomain : [new Date(), new Date()])
      .range([0, innerWidth]);

    // Y Scale (Gwei)
    const yMin = Math.max(0, Math.floor(minGwei * 0.85));
    const yMax = Math.ceil(maxGwei * 1.15);
    const yScale = d3.scaleLinear().domain([yMin, yMax]).range([innerHeight, 0]);

    // Gridlines
    const yTicks = yScale.ticks(4);
    g.append('g')
      .attr('class', 'grid-lines')
      .selectAll('line')
      .data(yTicks)
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', (d) => yScale(d))
      .attr('y2', (d) => yScale(d))
      .attr('stroke', '#1e293b')
      .attr('stroke-dasharray', '3,3')
      .attr('stroke-width', 1);

    // Area Generator
    const area = d3
      .area<GasHistoryDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y0(innerHeight)
      .y1((d) => {
        const val = selectedTier === 'low' ? d.lowGwei : selectedTier === 'high' ? d.highGwei : d.gwei;
        return yScale(val);
      })
      .curve(d3.curveMonotoneX);

    g.append('path')
      .datum(history)
      .attr('fill', `url(#${gradientId})`)
      .attr('d', area);

    // Line Generator
    const line = d3
      .line<GasHistoryDataPoint>()
      .x((d) => xScale(d.timestamp))
      .y((d) => {
        const val = selectedTier === 'low' ? d.lowGwei : selectedTier === 'high' ? d.highGwei : d.gwei;
        return yScale(val);
      })
      .curve(d3.curveMonotoneX);

    const path = g
      .append('path')
      .datum(history)
      .attr('fill', 'none')
      .attr('stroke', primaryColor)
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Animated path drawing effect
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // X Axis (Time - past 60m)
    const xAxis = d3
      .axisBottom<Date>(xScale)
      .ticks(4)
      .tickFormat(d3.timeFormat('%H:%M'))
      .tickSize(0)
      .tickPadding(8);

    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis)
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Y Axis (Gwei)
    const yAxis = d3
      .axisLeft<number>(yScale)
      .ticks(4)
      .tickFormat((d) => `${d}G`)
      .tickSize(0)
      .tickPadding(6);

    g.append('g')
      .call(yAxis)
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace');

    // Current latest point pulsing circle
    const lastPoint = history[history.length - 1];
    if (lastPoint) {
      const lastVal = selectedTier === 'low' ? lastPoint.lowGwei : selectedTier === 'high' ? lastPoint.highGwei : lastPoint.gwei;
      const cx = xScale(lastPoint.timestamp);
      const cy = yScale(lastVal);

      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 6)
        .attr('fill', primaryColor)
        .attr('opacity', 0.4)
        .append('animate')
        .attr('attributeName', 'r')
        .attr('values', '4;9;4')
        .attr('dur', '2s')
        .attr('repeatCount', 'indefinite');

      g.append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', 4)
        .attr('fill', primaryColor)
        .attr('stroke', '#0f172a')
        .attr('stroke-width', 1.5);
    }

    // Overlay SVG transparent rect for mouse hover crosshair
    const focusG = g.append('g').style('display', 'none');
    focusG.append('line').attr('class', 'crosshair-x').attr('stroke', '#475569').attr('stroke-dasharray', '2,2').attr('y1', 0).attr('y2', innerHeight);
    focusG.append('line').attr('class', 'crosshair-y').attr('stroke', '#475569').attr('stroke-dasharray', '2,2').attr('x1', 0).attr('x2', innerWidth);
    focusG.append('circle').attr('r', 4.5).attr('fill', '#ffffff').attr('stroke', primaryColor).attr('stroke-width', 2);

    const bisectDate = d3.bisector<GasHistoryDataPoint, Date>((d) => d.timestamp).left;

    svg.append('rect')
      .attr('width', width)
      .attr('height', height)
      .attr('fill', 'none')
      .attr('pointer-events', 'all')
      .on('mouseover', () => focusG.style('display', null))
      .on('mouseout', () => {
        focusG.style('display', 'none');
        setHoveredPoint(null);
      })
      .on('mousemove', (event) => {
        const [mx] = d3.pointer(event, g.node());
        const x0 = xScale.invert(mx);
        const i = bisectDate(history, x0, 1);
        const d0 = history[i - 1];
        const d1 = history[i];
        let d = d0;
        if (d1 && d0) {
          d = x0.getTime() - d0.timestamp.getTime() > d1.timestamp.getTime() - x0.getTime() ? d1 : d0;
        }
        if (d) {
          const val = selectedTier === 'low' ? d.lowGwei : selectedTier === 'high' ? d.highGwei : d.gwei;
          const cx = xScale(d.timestamp);
          const cy = yScale(val);

          focusG.select('.crosshair-x').attr('x1', cx).attr('x2', cx);
          focusG.select('.crosshair-y').attr('y1', cy).attr('y2', cy);
          focusG.select('circle').attr('cx', cx).attr('cy', cy);

          setHoveredPoint(d);
        }
      });
  }, [history, selectedTier, minGwei, maxGwei]);

  return (
    <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
      {/* Chart Top Stats & Controls */}
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-cyan-400" />
          <span className="font-bold text-slate-200">60-Min Gas Price Trend (D3.js)</span>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
            Real-Time Feed
          </span>
        </div>

        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span className="text-slate-400">
            Avg: <span className="text-slate-200 font-bold">{avgGwei} Gwei</span>
          </span>
          <span className="text-slate-400">
            Min/Max: <span className="text-emerald-400 font-bold">{minGwei}</span>/
            <span className="text-amber-400 font-bold">{maxGwei} Gwei</span>
          </span>
          <span className={`font-bold flex items-center gap-0.5 ${isUp ? 'text-amber-400' : 'text-emerald-400'}`}>
            {isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            {isUp ? `+${priceChangePct}%` : `${priceChangePct}%`}
          </span>
        </div>
      </div>

      {/* D3 SVG Line Canvas */}
      <div ref={containerRef} className="w-full relative overflow-hidden rounded-xl bg-slate-900/60 border border-slate-800/60 p-1">
        <svg ref={svgRef} className="w-full h-auto block" />

        {/* Hover Floating Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-2 right-3 pointer-events-none bg-slate-900/90 border border-cyan-500/40 rounded-lg px-2.5 py-1 text-[10px] font-mono shadow-xl backdrop-blur-md flex items-center gap-2">
            <span className="text-slate-400">
              {hoveredPoint.minuteAgo === 0 ? 'Now' : `${hoveredPoint.minuteAgo}m ago`} (
              {d3.timeFormat('%H:%M')(hoveredPoint.timestamp)})
            </span>
            <span className="font-bold text-cyan-300">
              {selectedTier === 'low'
                ? hoveredPoint.lowGwei
                : selectedTier === 'high'
                ? hoveredPoint.highGwei
                : hoveredPoint.gwei}{' '}
              Gwei
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
