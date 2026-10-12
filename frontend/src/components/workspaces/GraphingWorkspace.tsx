import React, { useState, useEffect, useRef } from 'react';
import styles from './Workspaces.module.css';
import { AngleMode } from '../../types/frontend';
import { GraphingEngine, FunctionDef, PlottedFunction, DetectionResult } from '../../../../src/engine/graphingEngine';
import { getTickValues, formatPiLabel, getDefaultRange, GraphDisplayMode } from '../../../../src/engine/graphingUtils';
import { PillButton } from '../ui/PillButton';

export interface DetectedPoint extends DetectionResult {
  id: string;
  funcColor: string;
  label: string;
}

interface GraphingWorkspaceProps {
  angleMode: AngleMode;
  onSaveHistory?: (expr: string, res: string) => void;
}

const engine = new GraphingEngine();
const PALETTE_COLORS = ['#6b7bd6', '#36806c', '#e67e22', '#9b59b6', '#e74c3c'];

export const GraphingWorkspace: React.FC<GraphingWorkspaceProps> = ({
  angleMode: _angleMode,
  onSaveHistory,
}) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayMode, setDisplayMode] = useState<GraphDisplayMode>('rad');
  const [functions, setFunctions] = useState<FunctionDef[]>([
    { id: '1', expression: 'x^2', color: PALETTE_COLORS[0] },
  ]);
  const [plottedData, setPlottedData] = useState<PlottedFunction[]>([]);

  const [viewport, setViewport] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10,
  });
  const { xMin, xMax, yMin, yMax } = viewport;

  const [evalX, setEvalX] = useState<string>('0');
  const [evalResults, setEvalResults] = useState<string[]>([]);

  const [detectedPoints, setDetectedPoints] = useState<DetectedPoint[]>([]);
  const [intersectF1, setIntersectF1] = useState<string>('');
  const [intersectF2, setIntersectF2] = useState<string>('');
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);

  const graphAreaRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 500 });
  const [panStart, setPanStart] = useState<{ x: number; y: number; pointerId: number } | null>(null);

  // ResizeObserver for responsive SVG dimensions
  useEffect(() => {
    const el = graphAreaRef.current;
    if (!el) return;
    const updateSize = () => {
      const rect = el.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setDimensions({ width: rect.width, height: rect.height });
      }
    };
    updateSize();
    const observer = new ResizeObserver(updateSize);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const getEvalAngleMode = () => (displayMode === 'deg' ? 'deg' : 'rad');

  const plotFunctions = () => {
    const data = functions.map((f) =>
      engine.sampleFunction(f, xMin, xMax, 600, getEvalAngleMode(), yMin, yMax)
    );
    setPlottedData(data);
    evaluateAtX(evalX);
  };

  useEffect(() => {
    plotFunctions();
  }, [functions, viewport, displayMode]);

  const addFunction = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const color = PALETTE_COLORS[functions.length % PALETTE_COLORS.length];
    setFunctions([...functions, { id, expression: '', color }]);
  };

  const updateFunction = (id: string, expression: string) => {
    setFunctions(functions.map((f) => (f.id === id ? { ...f, expression } : f)));
  };

  const removeFunction = (id: string) => {
    setFunctions(functions.filter((f) => f.id !== id));
  };

  const evaluateAtX = (xStr: string) => {
    setEvalX(xStr);
    const xVal = parseFloat(xStr);
    if (isNaN(xVal)) {
      setEvalResults([]);
      return;
    }
    const results = functions.map((f) => {
      if (!f.expression.trim()) return '';
      const res = engine.evaluateSingle(f.expression, xVal, getEvalAngleMode());
      if (res.error) return `${f.expression}: ${res.error}`;
      return `${f.expression}: ${res.value}`;
    });
    setEvalResults(results);
    if (results.length > 0 && !results[0].includes('Error')) {
      onSaveHistory?.('Evaluate graph at x=' + xVal, results.join(', '));
    }
  };

  const mapX = (x: number) => {
    const span = xMax - xMin;
    return span === 0 ? 0 : ((x - xMin) / span) * dimensions.width;
  };

  const mapY = (y: number) => {
    const span = yMax - yMin;
    return span === 0 ? 0 : dimensions.height - ((y - yMin) / span) * dimensions.height;
  };

  // Zoom centered on pointer
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      const zoomFactor = e.deltaY > 0 ? 1.15 : 0.85;

      setViewport((prev) => {
        const xSpan = prev.xMax - prev.xMin;
        const ySpan = prev.yMax - prev.yMin;
        const newXSpan = xSpan * zoomFactor;
        const newYSpan = ySpan * zoomFactor;

        if (newXSpan < 1e-6 || newXSpan > 1e9 || newYSpan < 1e-6 || newYSpan > 1e9) {
          return prev;
        }

        const fracX = Math.max(0, Math.min(1, cursorX / rect.width));
        const fracY = Math.max(0, Math.min(1, (rect.height - cursorY) / rect.height));

        const mathX = prev.xMin + fracX * xSpan;
        const mathY = prev.yMin + fracY * ySpan;

        return {
          xMin: mathX - fracX * newXSpan,
          xMax: mathX + (1 - fracX) * newXSpan,
          yMin: mathY - fracY * newYSpan,
          yMax: mathY + (1 - fracY) * newYSpan,
        };
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanStart({ x: e.clientX, y: e.clientY, pointerId: e.pointerId });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!panStart || panStart.pointerId !== e.pointerId || !svgRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;

    const rect = svgRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    setViewport((prev) => {
      const xSpan = prev.xMax - prev.xMin;
      const ySpan = prev.yMax - prev.yMin;
      const dXData = (dx / rect.width) * xSpan;
      const dYData = (dy / rect.height) * ySpan;
      return {
        xMin: prev.xMin - dXData,
        xMax: prev.xMax - dXData,
        yMin: prev.yMin + dYData,
        yMax: prev.yMax + dYData,
      };
    });

    setPanStart({ x: e.clientX, y: e.clientY, pointerId: e.pointerId });
  };

  const handlePointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (panStart && panStart.pointerId === e.pointerId) {
      e.currentTarget.releasePointerCapture(e.pointerId);
      setPanStart(null);
    }
  };

  const resetViewForMode = (mode: GraphDisplayMode) => {
    const range = getDefaultRange(mode);
    setViewport({
      xMin: range.min,
      xMax: range.max,
      yMin: -10,
      yMax: 10,
    });
  };

  const resetView = () => resetViewForMode(displayMode);

  const handleDisplayModeChange = (mode: GraphDisplayMode) => {
    setDisplayMode(mode);
    resetViewForMode(mode);
    setDetectedPoints([]);
  };

  const handleFindRoots = (fId: string) => {
    const f = functions.find((func) => func.id === fId);
    if (!f) return;

    const roots = engine.findRoots(f, xMin, xMax, getEvalAngleMode(), 500);
    const newPoints = roots.map((r, i) => ({
      ...r,
      id: `root-${fId}-${i}`,
      funcColor: f.color,
      label: `Root of ${f.expression}`,
    }));

    setDetectedPoints(newPoints);
  };

  const handleFindIntersections = () => {
    const f1 = functions.find((func) => func.id === intersectF1);
    const f2 = functions.find((func) => func.id === intersectF2);

    if (!f1 || !f2 || f1.id === f2.id) return;

    const ints = engine.findIntersections(f1, f2, xMin, xMax, getEvalAngleMode(), 500);
    const newPoints = ints.map((r, i) => ({
      ...r,
      id: `int-${f1.id}-${f2.id}-${i}`,
      funcColor: 'var(--text)',
      label: `Intersection: ${f1.expression} & ${f2.expression}`,
    }));

    setDetectedPoints(newPoints);
  };

  useEffect(() => {
    if (functions.length > 0) {
      if (!functions.find((f) => f.id === intersectF1)) setIntersectF1(functions[0].id);
      if (functions.length > 1 && !functions.find((f) => f.id === intersectF2)) setIntersectF2(functions[1].id);
    } else {
      setIntersectF1('');
      setIntersectF2('');
    }
  }, [functions, intersectF1, intersectF2]);

  const xTicks = getTickValues(xMin, xMax, displayMode);
  const yTicks = getTickValues(yMin, yMax, 'rad');

  return (
    <div className={styles.graphContainer}>
      {/* Graph Toolbar */}
      <div className={styles.graphToolbar}>
        <div className={styles.toolGroupLeft}>
          <PillButton
            onClick={() => setSidebarOpen(!sidebarOpen)}
            active={sidebarOpen}
            title={sidebarOpen ? 'Hide function sidebar' : 'Show function sidebar'}
          >
            {sidebarOpen ? '◀ Hide Sidebar' : '▶ Functions'}
          </PillButton>

          <div className={styles.modePillGroup}>
            {(['deg', 'rad', 'pi'] as GraphDisplayMode[]).map((mode) => (
              <button
                key={mode}
                className={`${styles.modePill} ${displayMode === mode ? styles.modePillActive : ''}`}
                onClick={() => handleDisplayModeChange(mode)}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.toolGroupRight}>
          <PillButton
            onClick={() => {
              setViewport((prev) => {
                const xSpan = (prev.xMax - prev.xMin) * 0.8;
                const ySpan = (prev.yMax - prev.yMin) * 0.8;
                const midX = (prev.xMin + prev.xMax) / 2;
                const midY = (prev.yMin + prev.yMax) / 2;
                return { xMin: midX - xSpan / 2, xMax: midX + xSpan / 2, yMin: midY - ySpan / 2, yMax: midY + ySpan / 2 };
              });
            }}
            title="Zoom In"
          >
            + Zoom In
          </PillButton>

          <PillButton
            onClick={() => {
              setViewport((prev) => {
                const xSpan = (prev.xMax - prev.xMin) * 1.25;
                const ySpan = (prev.yMax - prev.yMin) * 1.25;
                const midX = (prev.xMin + prev.xMax) / 2;
                const midY = (prev.yMin + prev.yMax) / 2;
                return { xMin: midX - xSpan / 2, xMax: midX + xSpan / 2, yMin: midY - ySpan / 2, yMax: midY + ySpan / 2 };
              });
            }}
            title="Zoom Out"
          >
            − Zoom Out
          </PillButton>

          <PillButton onClick={resetView} title="Reset view bounds">
            Reset View
          </PillButton>
        </div>
      </div>

      <div className={styles.graphWorkspaceBody}>
        {/* Sidebar */}
        {sidebarOpen && (
          <div className={styles.graphSidebar}>
            <div className={styles.graphSidebarHeader}>
              <strong>Function Definitions</strong>
              <button className={styles.sidebarAddBtn} onClick={addFunction} title="Add function">
                + Add
              </button>
            </div>

            <div className={styles.graphFunctionList}>
              {functions.map((f) => {
                const plotted = plottedData.find((pd) => pd.id === f.id);
                return (
                  <div key={f.id} className={styles.graphFunctionCard}>
                    <div className={styles.functionInputRow}>
                      <span className={styles.colorDot} style={{ backgroundColor: f.color }} />
                      <input
                        type="text"
                        value={f.expression}
                        onChange={(e) => updateFunction(f.id, e.target.value)}
                        placeholder="e.g. sin(x) or x^2 - 4"
                        className={styles.functionField}
                      />
                      <button
                        className={styles.rootDetectBtn}
                        onClick={() => handleFindRoots(f.id)}
                        title="Detect roots within visible range"
                      >
                        Roots
                      </button>
                      <button
                        className={styles.removeFunctionBtn}
                        onClick={() => removeFunction(f.id)}
                        title="Delete function"
                      >
                        ✕
                      </button>
                    </div>
                    {plotted?.error && <div className={styles.functionError}>{plotted.error}</div>}
                  </div>
                );
              })}
            </div>

            {/* Evaluate Point */}
            <div className={styles.graphSidebarSection}>
              <strong>Evaluate at x</strong>
              <div className={styles.evalInputRow}>
                <input
                  type="number"
                  value={evalX}
                  onChange={(e) => evaluateAtX(e.target.value)}
                  className={styles.evalInputField}
                />
              </div>
              <div className={styles.evalResultList}>
                {evalResults.map((r, i) => (
                  <div key={i} className={styles.evalResultItem}>
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Intersection Detector */}
            {functions.length >= 2 && (
              <div className={styles.graphSidebarSection}>
                <strong>Intersection Analysis</strong>
                <div className={styles.intersectSelects}>
                  <select
                    value={intersectF1}
                    onChange={(e) => setIntersectF1(e.target.value)}
                    className={styles.graphSelect}
                  >
                    {functions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.expression || '(Empty)'}
                      </option>
                    ))}
                  </select>
                  <select
                    value={intersectF2}
                    onChange={(e) => setIntersectF2(e.target.value)}
                    className={styles.graphSelect}
                  >
                    {functions.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.expression || '(Empty)'}
                      </option>
                    ))}
                  </select>
                  <PillButton
                    onClick={handleFindIntersections}
                    style={{ padding: '6px 12px', fontSize: '13px' }}
                  >
                    Find Intersections
                  </PillButton>
                </div>
              </div>
            )}

            {/* Detected Points */}
            {detectedPoints.length > 0 && (
              <div className={styles.detectedPointsContainer}>
                <div className={styles.detectedHeader}>
                  <span>Detected Points ({detectedPoints.length})</span>
                  <button onClick={() => setDetectedPoints([])} className={styles.clearDetectedBtn}>
                    Clear
                  </button>
                </div>
                <div className={styles.detectedScroll}>
                  {detectedPoints.map((dp) => (
                    <div
                      key={dp.id}
                      className={`${styles.detectedItem} ${hoveredPointId === dp.id ? styles.detectedItemHovered : ''}`}
                      onMouseEnter={() => setHoveredPointId(dp.id)}
                      onMouseLeave={() => setHoveredPointId(null)}
                    >
                      <strong style={{ color: dp.funcColor }}>
                        {dp.type === 'root' ? 'Root' : 'Intersection'}
                      </strong>
                      <div>
                        x: {dp.x.toFixed(4)}, y: {dp.y.toFixed(4)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* SVG Canvas Area */}
        <div ref={graphAreaRef} className={styles.graphBoard}>
          <svg
            ref={svgRef}
            className={styles.svgBoard}
            width={dimensions.width}
            height={dimensions.height}
            viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            {/* Grid Lines */}
            <g className="grid">
              {xTicks.map((t) => {
                const x = mapX(t);
                return (
                  <line
                    key={`gx-${t}`}
                    x1={x}
                    y1={0}
                    x2={x}
                    y2={dimensions.height}
                    stroke="var(--grid)"
                    strokeWidth="1"
                  />
                );
              })}
              {yTicks.map((t) => {
                const y = mapY(t);
                return (
                  <line
                    key={`gy-${t}`}
                    x1={0}
                    y1={y}
                    x2={dimensions.width}
                    y2={y}
                    stroke="var(--grid)"
                    strokeWidth="1"
                  />
                );
              })}
            </g>

            {/* Axes */}
            <g className="axes">
              {yMin <= 0 && yMax >= 0 && (
                <line
                  x1={0}
                  y1={mapY(0)}
                  x2={dimensions.width}
                  y2={mapY(0)}
                  stroke="var(--mute)"
                  strokeWidth="2"
                />
              )}
              {xMin <= 0 && xMax >= 0 && (
                <line
                  x1={mapX(0)}
                  y1={0}
                  x2={mapX(0)}
                  y2={dimensions.height}
                  stroke="var(--mute)"
                  strokeWidth="2"
                />
              )}
            </g>

            {/* Axis Labels */}
            {xTicks.map((t) => {
              if (Math.abs(t) < 1e-9) return null;
              const x = mapX(t);
              if (x < 15 || x > dimensions.width - 15) return null;
              const yAxisPx = mapY(0);
              const y =
                yMin <= 0 && yMax >= 0
                  ? Math.max(16, Math.min(dimensions.height - 20, yAxisPx))
                  : dimensions.height - 20;
              const label = displayMode === 'pi' ? formatPiLabel(t) : parseFloat(t.toFixed(2)).toString();
              return (
                <text
                  key={`tx-${t}`}
                  x={x}
                  y={y + 14}
                  fill="var(--mute)"
                  fontSize="11"
                  textAnchor="middle"
                  fontFamily="Nunito, sans-serif"
                >
                  {label}
                </text>
              );
            })}
            {yTicks.map((t) => {
              if (Math.abs(t) < 1e-9) return null;
              const y = mapY(t);
              if (y < 12 || y > dimensions.height - 12) return null;
              const xAxisPx = mapX(0);
              const x =
                xMin <= 0 && xMax >= 0
                  ? Math.max(10, Math.min(dimensions.width - 45, xAxisPx))
                  : 10;
              return (
                <text
                  key={`ty-${t}`}
                  x={x + 6}
                  y={y + 4}
                  fill="var(--mute)"
                  fontSize="11"
                  fontFamily="Nunito, sans-serif"
                >
                  {parseFloat(t.toFixed(2))}
                </text>
              );
            })}

            {/* Function Curves */}
            <g className="plots">
              {plottedData.map((pd) => (
                <g key={pd.id}>
                  {pd.segments.map((seg, i) => {
                    const points = seg.map((p) => `${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`).join(' ');
                    return (
                      <polyline
                        key={i}
                        points={points}
                        fill="none"
                        stroke={pd.color}
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    );
                  })}
                </g>
              ))}
            </g>

            {/* Detected Points */}
            <g className="detected-points">
              {detectedPoints.map((dp) => {
                const px = mapX(dp.x);
                const py = mapY(dp.y);
                const isHovered = hoveredPointId === dp.id;

                if (px < -20 || px > dimensions.width + 20 || py < -20 || py > dimensions.height + 20) return null;

                return (
                  <g key={dp.id} transform={`translate(${px}, ${py})`}>
                    <circle
                      cx={0}
                      cy={0}
                      r={isHovered ? 7 : 5}
                      fill={dp.funcColor}
                      stroke="var(--board)"
                      strokeWidth="2"
                      style={{ cursor: 'pointer' }}
                    />
                    {isHovered && (
                      <g>
                        <rect
                          x={10}
                          y={-28}
                          width={140}
                          height={44}
                          fill="var(--panel)"
                          stroke="var(--line)"
                          rx={8}
                        />
                        <text x={18} y={-12} fill="var(--text)" fontSize="11" fontWeight="bold">
                          {dp.label}
                        </text>
                        <text x={18} y={6} fill="var(--mute)" fontSize="10">
                          ({dp.x.toFixed(3)}, {dp.y.toFixed(3)})
                        </text>
                      </g>
                    )}
                  </g>
                );
              })}
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
};
