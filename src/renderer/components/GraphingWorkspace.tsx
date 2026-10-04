import React, { useState, useEffect, useRef } from 'react';
import styles from './GraphingWorkspace.module.css';
import { AngleMode } from '../../shared/types';
import { GraphingEngine, FunctionDef, PlottedFunction, DetectionResult } from '../engine/graphingEngine';

export interface DetectedPoint extends DetectionResult {
  id: string;
  funcColor: string;
  label: string;
}
import { getTickValues, formatPiLabel, getDefaultRange, convertPixelDeltaToDataDelta, GraphDisplayMode } from './graphingUtils';

interface Props {
  angleMode: AngleMode;
}

const engine = new GraphingEngine();
const COLORS = ['#FF5722', '#2196F3', '#4CAF50', '#9C27B0', '#FFEB3B'];

interface GWProps extends Props { onSaveHistory?: (e: string, r: string) => void; }
export const GraphingWorkspace: React.FC<GWProps> = ({ angleMode, onSaveHistory }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [displayMode, setDisplayMode] = useState<GraphDisplayMode>(angleMode === 'deg' ? 'deg' : 'rad');
  const [functions, setFunctions] = useState<FunctionDef[]>([
    { id: '1', expression: 'x^2', color: COLORS[0] }
  ]);
  const [plottedData, setPlottedData] = useState<PlottedFunction[]>([]);
  
  const initialRange = getDefaultRange(angleMode === 'deg' ? 'deg' : 'rad');
  const [xMin, setXMin] = useState(initialRange.min);
  const [xMax, setXMax] = useState(initialRange.max);
  const [yMin, setYMin] = useState(-10);
  const [yMax, setYMax] = useState(10);
  
  const [evalX, setEvalX] = useState<string>('0');
  const [evalResults, setEvalResults] = useState<string[]>([]);
  
  const [detectedPoints, setDetectedPoints] = useState<DetectedPoint[]>([]);
  const [intersectF1, setIntersectF1] = useState<string>('');
  const [intersectF2, setIntersectF2] = useState<string>('');
  const [hoveredPointId, setHoveredPointId] = useState<string | null>(null);
  
  const svgRef = useRef<SVGSVGElement>(null);
  const [panStart, setPanStart] = useState<{x: number, y: number, pointerId: number} | null>(null);

  const getEvalAngleMode = () => displayMode === 'deg' ? 'deg' : 'rad';

  const plotFunctions = () => {
    const data = functions.map(f => engine.sampleFunction(f, xMin, xMax, 500, getEvalAngleMode()));
    setPlottedData(data);
    evaluateAtX(evalX);
  };

  useEffect(() => {
    plotFunctions();
  }, [functions, xMin, xMax, yMin, yMax, displayMode]);

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

  const mapX = (x: number, width: number) => ((x - xMin) / (xMax - xMin)) * width;
  const mapY = (y: number, height: number) => height - ((y - yMin) / (yMax - yMin)) * height;

  // Use useEffect to add a non-passive wheel event listener to fix app-wide scrolling
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      
      const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
      setXMin(prevMin => {
        setXMax(prevMax => {
          const xRange = (prevMax - prevMin) * zoomFactor;
          const xMid = (prevMax + prevMin) / 2;
          // clamp
          if (xRange < 1e-6 || xRange > 1e9) return prevMax;
          return xMid + xRange / 2;
        });
        const xRange = (xMax - prevMin) * zoomFactor;
        const xMid = (xMax + prevMin) / 2;
        if (xRange < 1e-6 || xRange > 1e9) return prevMin;
        return xMid - xRange / 2;
      });

      setYMin(prevMin => {
        setYMax(prevMax => {
          const yRange = (prevMax - prevMin) * zoomFactor;
          const yMid = (prevMax + prevMin) / 2;
          if (yRange < 1e-6 || yRange > 1e9) return prevMax;
          return yMid + yRange / 2;
        });
        const yRange = (yMax - prevMin) * zoomFactor;
        const yMid = (yMax + prevMin) / 2;
        if (yRange < 1e-6 || yRange > 1e9) return prevMin;
        return yMid - yRange / 2;
      });
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [xMin, xMax, yMin, yMax]); // we need deps to avoid stale state in onWheel, or use functional state updates

  const handlePointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    e.preventDefault(); // prevent native drag
    e.currentTarget.setPointerCapture(e.pointerId);
    setPanStart({ x: e.clientX, y: e.clientY, pointerId: e.pointerId });
  };

  const handlePointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!panStart || panStart.pointerId !== e.pointerId || !svgRef.current) return;
    const dx = e.clientX - panStart.x;
    const dy = e.clientY - panStart.y;
    
    const rect = svgRef.current.getBoundingClientRect();
    const { dXData, dYData } = convertPixelDeltaToDataDelta(dx, dy, rect.width, rect.height, xMax - xMin, yMax - yMin);
    
    setXMin(prev => prev - dXData);
    setXMax(prev => prev - dXData);
    setYMin(prev => prev + dYData);
    setYMax(prev => prev + dYData);
    
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
    setXMin(range.min);
    setXMax(range.max);
    setYMin(-10);
    setYMax(10);
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
      <div className={styles.graphArea}>
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)} 
          className={styles.toggleSidebarBtn}
          title={sidebarOpen ? "Collapse Controls" : "Expand Controls"}
          aria-label="Toggle Graphing Controls"
        >
          {sidebarOpen ? '◀' : '▶'} Controls
        </button>
        <svg ref={svgRef} className={styles.svgGraph} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp}>
          {/* Defs for grid patterns could go here, but doing it manually for axes/ticks */}
          <rect width="100%" height="100%" fill="transparent" />
          
          {/* Grid X Lines */}
          <svg viewBox="0 0 1000 1000" width="100%" height="100%" preserveAspectRatio="none">
            <g className="grid">
              {xTicks.map(t => {
                const x = mapX(t, 1000);
                return <line key={`gx-${t}`} x1={x} y1={0} x2={x} y2={1000} stroke="var(--border-light)" strokeWidth="1" />;
              })}
              {yTicks.map(t => {
                const y = mapY(t, 1000);
                return <line key={`gy-${t}`} x1={0} y1={y} x2={1000} y2={y} stroke="var(--border-light)" strokeWidth="1" />;
              })}
            </g>

            <g className="axes">
              {/* X Axis */}
              {yMin <= 0 && yMax >= 0 && (
                <line x1={0} y1={mapY(0, 1000)} x2={1000} y2={mapY(0, 1000)} stroke="var(--text-muted)" strokeWidth="2" />
              )}
              {/* Y Axis */}
              {xMin <= 0 && xMax >= 0 && (
                <line x1={mapX(0, 1000)} y1={0} x2={mapX(0, 1000)} y2={1000} stroke="var(--text-muted)" strokeWidth="2" />
              )}
            </g>

            {/* Labels - Need to be careful with text scaling in viewBox, so we just render them normally */}
            {xTicks.map(t => {
              if (Math.abs(t) < 1e-9) return null;
              const x = mapX(t, 1000);
              const y = yMin <= 0 && yMax >= 0 ? mapY(0, 1000) : 980;
              const label = displayMode === 'pi' ? formatPiLabel(t) : parseFloat(t.toFixed(2)).toString();
              return <text key={`tx-${t}`} x={x} y={y + 15} fill="var(--text-muted)" fontSize="12" textAnchor="middle">{label}</text>;
            })}
            {yTicks.map(t => {
              if (t === 0) return null;
              const y = mapY(t, 1000);
              const x = xMin <= 0 && xMax >= 0 ? mapX(0, 1000) : 20;
              return <text key={`ty-${t}`} x={x + 5} y={y + 4} fill="var(--text-muted)" fontSize="12">{parseFloat(t.toFixed(2))}</text>;
            })}

            <g className="plots">
              {plottedData.map(pd => (
                <g key={pd.id}>
                  {pd.segments.map((seg, i) => {
                    const points = seg.map(p => `${mapX(p.x, 1000)},${mapY(p.y, 1000)}`).join(' ');
                    return <polyline key={i} points={points} fill="none" stroke={pd.color} strokeWidth="3" vectorEffect="non-scaling-stroke" />;
                  })}
                </g>
              ))}
            </g>

            {/* Detected Points */}
            <g className="detected-points">
              {detectedPoints.map(dp => {
                const px = mapX(dp.x, 1000);
                const py = mapY(dp.y, 1000);
                const isHovered = hoveredPointId === dp.id;
                
                // Hide if way out of bounds
                if (px < -50 || px > 1050 || py < -50 || py > 1050) return null;

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
        </svg>
      </div>
    </div>
  );
};
