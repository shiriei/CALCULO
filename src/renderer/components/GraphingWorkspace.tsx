import React, { useState, useEffect, useRef } from 'react';
import styles from './GraphingWorkspace.module.css';
import { AngleMode } from '../../shared/types';
import { GraphingEngine, FunctionDef, PlottedFunction, DetectionResult } from '../engine/graphingEngine';

export interface DetectedPoint extends DetectionResult {
  id: string;
  funcColor: string;
  label: string;
}
import { getTickValues, formatPiLabel, getDefaultRange, GraphDisplayMode } from './graphingUtils';

interface Props {
  angleMode: AngleMode;
}

const engine = new GraphingEngine();
const COLORS = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FFEB3B'];

interface GWProps extends Props { onSaveHistory?: (e: string, r: string) => void; }
export const GraphingWorkspace: React.FC<GWProps> = ({ angleMode: _angleMode, onSaveHistory }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayMode, setDisplayMode] = useState<GraphDisplayMode>('rad');
  const [functions, setFunctions] = useState<FunctionDef[]>([
    { id: '1', expression: 'x^2', color: COLORS[0] }
  ]);
  const [plottedData, setPlottedData] = useState<PlottedFunction[]>([]);
  
  const [viewport, setViewport] = useState({
    xMin: -10,
    xMax: 10,
    yMin: -10,
    yMax: 10
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
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 800, height: 600 });
  const [panStart, setPanStart] = useState<{ x: number; y: number; pointerId: number } | null>(null);

  // Measure actual plot area dimensions dynamically via ResizeObserver
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

  const getEvalAngleMode = () => displayMode === 'deg' ? 'deg' : 'rad';

  const plotFunctions = () => {
    const data = functions.map(f => engine.sampleFunction(f, xMin, xMax, 600, getEvalAngleMode(), yMin, yMax));
    setPlottedData(data);
    evaluateAtX(evalX);
  };

  useEffect(() => {
    plotFunctions();
  }, [functions, viewport, displayMode]);

  const addFunction = () => {
    const id = Math.random().toString(36).substr(2, 9);
    const color = COLORS[functions.length % COLORS.length];
    setFunctions([...functions, { id, expression: '', color }]);
  };

  const updateFunction = (id: string, expression: string) => {
    setFunctions(functions.map(f => f.id === id ? { ...f, expression } : f));
  };

  const removeFunction = (id: string) => {
    setFunctions(functions.filter(f => f.id !== id));
  };

  const evaluateAtX = (xStr: string) => {
    setEvalX(xStr);
    const xVal = parseFloat(xStr);
    if (isNaN(xVal)) {
      setEvalResults([]);
      return;
    }
    const results = functions.map(f => {
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

  // Zoom centered on pointer position with robust atomic state updates
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

      setViewport(prev => {
        const xSpan = prev.xMax - prev.xMin;
        const ySpan = prev.yMax - prev.yMin;
        const newXSpan = xSpan * zoomFactor;
        const newYSpan = ySpan * zoomFactor;

        // Clamp to prevent numerical explosion or collapse
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
          yMax: mathY + (1 - fracY) * newYSpan
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

    setViewport(prev => {
      const xSpan = prev.xMax - prev.xMin;
      const ySpan = prev.yMax - prev.yMin;
      const dXData = (dx / rect.width) * xSpan;
      const dYData = (dy / rect.height) * ySpan;
      return {
        xMin: prev.xMin - dXData,
        xMax: prev.xMax - dXData,
        yMin: prev.yMin + dYData,
        yMax: prev.yMax + dYData
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
      yMax: 10
    });
  };

  const resetView = () => resetViewForMode(displayMode);

  const handleDisplayModeChange = (mode: GraphDisplayMode) => {
    setDisplayMode(mode);
    resetViewForMode(mode);
    setDetectedPoints([]);
  };

  const handleFindRoots = (fId: string) => {
    const f = functions.find(func => func.id === fId);
    if (!f) return;
    
    const roots = engine.findRoots(f, xMin, xMax, getEvalAngleMode(), 500);
    const newPoints = roots.map((r, i) => ({
      ...r,
      id: `root-${fId}-${i}`,
      funcColor: f.color,
      label: `Root of ${f.expression}`
    }));
    
    setDetectedPoints(newPoints);
  };

  const handleFindIntersections = () => {
    const f1 = functions.find(func => func.id === intersectF1);
    const f2 = functions.find(func => func.id === intersectF2);
    
    if (!f1 || !f2) {
      alert('Please select two valid functions to find intersections.');
      return;
    }
    if (f1.id === f2.id) {
      alert('Please select two different functions.');
      return;
    }

    const ints = engine.findIntersections(f1, f2, xMin, xMax, getEvalAngleMode(), 500);
    const newPoints = ints.map((r, i) => ({
      ...r,
      id: `int-${f1.id}-${f2.id}-${i}`,
      funcColor: 'var(--text-primary)',
      label: `Intersection: ${f1.expression} & ${f2.expression}`
    }));
    
    setDetectedPoints(newPoints);
  };

  // Helper to sync selections if functions are deleted
  useEffect(() => {
    if (functions.length > 0) {
      if (!functions.find(f => f.id === intersectF1)) setIntersectF1(functions[0].id);
      if (functions.length > 1 && !functions.find(f => f.id === intersectF2)) setIntersectF2(functions[1].id);
    } else {
      setIntersectF1('');
      setIntersectF2('');
    }
  }, [functions, intersectF1, intersectF2]);

  const xTicks = getTickValues(xMin, xMax, displayMode);
  const yTicks = getTickValues(yMin, yMax, 'rad'); // y is always standard decimal

  return (
    <div className={styles.container}>
      {sidebarOpen && (
      <div className={styles.sidebar}>
        <h3>Functions</h3>
        <div className={styles.functionList}>
          {functions.map(f => {
            const plotted = plottedData.find(pd => pd.id === f.id);
            return (
              <div key={f.id} className={styles.functionItem}>
                <div className={styles.functionHeader}>
                  <div className={styles.swatch} style={{backgroundColor: f.color}} />
                  <input 
                    type="text" 
                    value={f.expression} 
                    onChange={e => updateFunction(f.id, e.target.value)} 
                    placeholder="e.g. sin(x)"
                    className={styles.functionInput}
                  />
                  <button onClick={() => handleFindRoots(f.id)} className={styles.rootBtn} style={{background: 'var(--border-color)', color: 'var(--text-primary)', border: '1px solid var(--border-input)', padding: '2px 6px', fontSize: '0.75rem', borderRadius: '3px', cursor: 'pointer'}} title="Find visible roots">Roots</button>
                  <button onClick={() => removeFunction(f.id)} className={styles.removeBtn}>✕</button>
                </div>
                {plotted?.error && <div className={styles.errorText}>{plotted.error}</div>}
              </div>
            );
          })}
        </div>
        <button className={styles.addBtn} onClick={addFunction}>+ Add Function</button>

        <div className={styles.evalSection}>
          <h4>Evaluate</h4>
          <div className={styles.evalInput}>
            <label>x = </label>
            <input type="number" value={evalX} onChange={e => evaluateAtX(e.target.value)} />
          </div>
          <div className={styles.evalResults}>
            {evalResults.map((r, i) => <div key={i}>{r}</div>)}
          </div>
        </div>

        <div className={styles.analysisSection} style={{marginTop: '10px', borderTop: '1px solid var(--border-light)', paddingTop: '5px'}}>
          <h4>Analysis</h4>
          
          <div style={{marginBottom: '5px'}}>
            <label style={{fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'block'}}>Find Intersections:</label>
            {functions.length < 2 ? (
              <div style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Need ≥2 functions.</div>
            ) : (
              <div style={{display: 'flex', flexDirection: 'column', gap: '3px', marginTop: '3px'}}>
                <select value={intersectF1} onChange={e => setIntersectF1(e.target.value)} style={{background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '2px 4px', fontSize: '0.85rem'}}>
                  {functions.map(f => <option key={f.id} value={f.id}>{f.expression || 'Empty'}</option>)}
                </select>
                <select value={intersectF2} onChange={e => setIntersectF2(e.target.value)} style={{background: 'var(--bg-input)', color: 'var(--text-primary)', padding: '2px 4px', fontSize: '0.85rem'}}>
                  {functions.map(f => <option key={f.id} value={f.id}>{f.expression || 'Empty'}</option>)}
                </select>
                <button onClick={handleFindIntersections} style={{padding: '3px', fontSize: '0.85rem'}}>Find Intersections</button>
              </div>
            )}
          </div>

          {detectedPoints.length > 0 && (
            <div className={styles.detectedPointsList} style={{maxHeight: '100px', overflowY: 'auto', background: 'var(--bg-input)', padding: '4px', borderRadius: '4px', marginTop: '5px'}}>
              <div style={{fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '3px'}}>Detected ({detectedPoints.length}):</div>
              {detectedPoints.map(dp => (
                <div 
                  key={dp.id} 
                  style={{fontSize: '0.75rem', padding: '4px', borderBottom: '1px solid var(--border-color)', cursor: 'pointer', background: hoveredPointId === dp.id ? 'var(--border-color)' : 'transparent'}}
                  onMouseEnter={() => setHoveredPointId(dp.id)}
                  onMouseLeave={() => setHoveredPointId(null)}
                >
                  <strong style={{color: dp.funcColor}}>{dp.type === 'root' ? 'Root' : 'Intersect'}</strong><br/>
                  x: {dp.x.toFixed(4)}, y: {dp.y.toFixed(4)}<br/>
                  <span style={{color: 'var(--text-muted)'}}>err: {dp.residual.toExponential(2)}</span>
                </div>
              ))}
              <button onClick={() => setDetectedPoints([])} style={{width: '100%', marginTop: '3px', fontSize: '0.75rem', padding: '2px'}}>Clear</button>
            </div>
          )}
        </div>

        <div className={styles.viewSection}>
          <h4>View Settings</h4>
          <div className={styles.displayModeSelector} style={{display: 'flex', gap: '3px', marginBottom: '8px'}}>
            <button 
              onClick={() => handleDisplayModeChange('deg')} 
              style={{flex: 1, padding: '4px', fontSize: '0.85rem', fontWeight: displayMode === 'deg' ? 'bold' : 'normal', backgroundColor: displayMode === 'deg' ? 'var(--border-input)' : ''}}
            >
              Deg
            </button>
            <button 
              onClick={() => handleDisplayModeChange('rad')}
              style={{flex: 1, padding: '4px', fontSize: '0.85rem', fontWeight: displayMode === 'rad' ? 'bold' : 'normal', backgroundColor: displayMode === 'rad' ? 'var(--border-input)' : ''}}
            >
              Rad
            </button>
            <button 
              onClick={() => handleDisplayModeChange('pi')}
              style={{flex: 1, padding: '4px', fontSize: '0.85rem', fontWeight: displayMode === 'pi' ? 'bold' : 'normal', backgroundColor: displayMode === 'pi' ? 'var(--border-input)' : ''}}
            >
              π
            </button>
          </div>
          <button onClick={resetView}>Reset View</button>
          <p className={styles.helpText}>Scroll to zoom, drag to pan.</p>
        </div>
      </div>

      )}
      <div ref={graphAreaRef} className={styles.graphArea}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={styles.toggleSidebarBtn}
          title={sidebarOpen ? "Collapse Controls" : "Expand Controls"}
          aria-label="Toggle Graphing Controls"
        >
          {sidebarOpen ? '◀' : '▶'} Controls
        </button>
        <svg 
          ref={svgRef} 
          className={styles.svgGraph} 
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          onPointerDown={handlePointerDown} 
          onPointerMove={handlePointerMove} 
          onPointerUp={handlePointerUp}
        >
          <rect width="100%" height="100%" fill="transparent" />
          
          <g className="grid">
            {xTicks.map(t => {
              const x = mapX(t);
              return <line key={`gx-${t}`} x1={x} y1={0} x2={x} y2={dimensions.height} stroke="var(--border-light)" strokeWidth="1" />;
            })}
            {yTicks.map(t => {
              const y = mapY(t);
              return <line key={`gy-${t}`} x1={0} y1={y} x2={dimensions.width} y2={y} stroke="var(--border-light)" strokeWidth="1" />;
            })}
          </g>

          <g className="axes">
            {/* X Axis */}
            {yMin <= 0 && yMax >= 0 && (
              <line x1={0} y1={mapY(0)} x2={dimensions.width} y2={mapY(0)} stroke="var(--text-muted)" strokeWidth="2" />
            )}
            {/* Y Axis */}
            {xMin <= 0 && xMax >= 0 && (
              <line x1={mapX(0)} y1={0} x2={mapX(0)} y2={dimensions.height} stroke="var(--text-muted)" strokeWidth="2" />
            )}
          </g>

          {/* Labels */}
          {xTicks.map(t => {
            if (Math.abs(t) < 1e-9) return null;
            const x = mapX(t);
            if (x < 15 || x > dimensions.width - 15) return null;
            const yAxisPx = mapY(0);
            const y = (yMin <= 0 && yMax >= 0) 
              ? Math.max(16, Math.min(dimensions.height - 20, yAxisPx)) 
              : dimensions.height - 20;
            const label = displayMode === 'pi' ? formatPiLabel(t) : parseFloat(t.toFixed(2)).toString();
            return <text key={`tx-${t}`} x={x} y={y + 14} fill="var(--text-muted)" fontSize="11" textAnchor="middle">{label}</text>;
          })}
          {yTicks.map(t => {
            if (Math.abs(t) < 1e-9) return null;
            const y = mapY(t);
            if (y < 12 || y > dimensions.height - 12) return null;
            const xAxisPx = mapX(0);
            const x = (xMin <= 0 && xMax >= 0) 
              ? Math.max(10, Math.min(dimensions.width - 45, xAxisPx)) 
              : 10;
            return <text key={`ty-${t}`} x={x + 6} y={y + 4} fill="var(--text-muted)" fontSize="11">{parseFloat(t.toFixed(2))}</text>;
          })}

          <g className="plots">
            {plottedData.map(pd => (
              <g key={pd.id}>
                {pd.segments.map((seg, i) => {
                  const points = seg.map(p => `${mapX(p.x).toFixed(1)},${mapY(p.y).toFixed(1)}`).join(' ');
                  return <polyline key={i} points={points} fill="none" stroke={pd.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />;
                })}
              </g>
            ))}
          </g>

          {/* Detected Points */}
          <g className="detected-points">
            {detectedPoints.map(dp => {
              const px = mapX(dp.x);
              const py = mapY(dp.y);
              const isHovered = hoveredPointId === dp.id;
              
              if (px < -20 || px > dimensions.width + 20 || py < -20 || py > dimensions.height + 20) return null;

              return (
                <g key={dp.id} transform={`translate(${px}, ${py})`}>
                  <circle 
                    cx={0} cy={0} r={isHovered ? 6 : 4} 
                    fill={dp.funcColor} stroke="var(--text-primary)" strokeWidth="2" 
                    style={{transition: 'all 0.1s'}}
                  />
                  {isHovered && (
                    <g>
                      <rect x={10} y={-25} width={120} height={40} fill="var(--bg-surface-elevated)" stroke="var(--border-input)" rx={4} />
                      <text x={15} y={-10} fill="var(--text-primary)" fontSize="10">{dp.label}</text>
                      <text x={15} y={5} fill="var(--text-muted)" fontSize="10">({dp.x.toFixed(3)}, {dp.y.toFixed(3)})</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>
        </svg>
      </div>
    </div>
  );
};
