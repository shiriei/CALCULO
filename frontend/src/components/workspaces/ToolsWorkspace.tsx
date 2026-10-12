import React, { useEffect, useRef, useState } from 'react';
import styles from './Workspaces.module.css';

interface Point {
  x: number;
  y: number;
}

interface GeomObj {
  t: string;
  p: Point[];
  ghost?: boolean;
}

const TOOL_GROUPS: Record<string, string[]> = {
  Basic: ['Move', 'Point', 'Segment', 'Line', 'Polygon', 'Circle'],
  Edit: ['Select', 'Delete'],
  Construct: ['Midpoint', 'Perpendicular line', 'Perpendicular bisector', 'Parallel line', 'Angle bisector', 'Tangents'],
  Measure: ['Angle', 'Distance', 'Area'],
  Lines: ['Segment', 'Line', 'Ray', 'Vector'],
  Circles: ['Center & point', 'Center & radius', 'Three points', 'Semicircle', 'Arc', 'Sector'],
  Polygons: ['Polygon', 'Regular polygon'],
};

const LIVE_TOOLS = [
  'Move',
  'Point',
  'Segment',
  'Line',
  'Ray',
  'Vector',
  'Circle',
  'Center & point',
  'Polygon',
  'Delete',
  'Midpoint',
  'Distance',
];

const TOOL_HINTS: Record<string, string> = {
  Move: 'Drag a point to move it.',
  Point: 'Click to place a point.',
  Segment: 'Click two points to create a segment.',
  Line: 'Click two points to create an infinite line.',
  Ray: 'Click start point, then direction point.',
  Vector: 'Click tail, then head to draw a vector.',
  Circle: 'Click centre, then a point on the circumference.',
  'Center & point': 'Click centre, then a point on the circumference.',
  Polygon: 'Click vertices; double-click to close.',
  Delete: 'Click a point to delete it.',
  Midpoint: 'Click two points to calculate midpoint.',
  Distance: 'Click two points to measure distance.',
};

export const ToolsWorkspace: React.FC = () => {
  const [tool, setTool] = useState<string>('Move');
  const [openGroup, setOpenGroup] = useState<string | null>(null);
  const [info, setInfo] = useState<string>('');
  const [canUndo, setCanUndo] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ptsRef = useRef<Point[]>([]);
  const objsRef = useRef<GeomObj[]>([]);
  const tmpRef = useRef<Point[]>([]);
  const curRef = useRef<Point | null>(null);
  const dragRef = useRef<Point | null>(null);
  const undoStackRef = useRef<Array<{ p: Point[]; o: Array<{ t: string; i: number[] }> }>>([]);

  const snap = () => {
    const pts = ptsRef.current;
    const objs = objsRef.current;
    undoStackRef.current.push({
      p: pts.map((q) => ({ x: q.x, y: q.y })),
      o: objs.map((o) => ({ t: o.t, i: o.p.map((q) => pts.indexOf(q)) })),
    });
    if (undoStackRef.current.length > 100) undoStackRef.current.shift();
    setCanUndo(undoStackRef.current.length > 0);
  };

  const handleUndo = () => {
    const s = undoStackRef.current.pop();
    if (!s) return;
    ptsRef.current = s.p;
    objsRef.current = s.o.map((o) => ({ t: o.t, p: o.i.map((i) => ptsRef.current[i]) }));
    tmpRef.current = [];
    setInfo('');
    setCanUndo(undoStackRef.current.length > 0);
    draw();
  };

  const near = (p: Point): Point | undefined => {
    return ptsRef.current.find((q) => Math.hypot(q.x - p.x, q.y - p.y) < 14);
  };

  const getPt = (p: Point): Point => {
    let q = near(p);
    if (!q) {
      q = { x: p.x, y: p.y };
      ptsRef.current.push(q);
    }
    return q;
  };

  const ext = (a: Point, b: Point, k: number): [number, number, number, number] => {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const l = Math.hypot(dx, dy) || 1;
    return [a.x - (dx / l) * k, a.y - (dy / l) * k, b.x + (dx / l) * k, b.y + (dy / l) * k];
  };

  const draw = () => {
    const cv = canvasRef.current;
    if (!cv) return;
    const c = cv.getContext('2d');
    if (!c) return;

    const w = cv.clientWidth;
    const h = cv.clientHeight;
    c.clearRect(0, 0, w, h);

    const style = getComputedStyle(document.documentElement);
    const gridColor = style.getPropertyValue('--grid').trim() || '#e8eaf6';
    const objColor = style.getPropertyValue('--obj').trim() || '#7d8be0';
    const fillColor = style.getPropertyValue('--fill').trim() || 'rgba(185,196,245,.35)';
    const inkColor = style.getPropertyValue('--ink').trim() || '#6b7bd6';
    const boardColor = style.getPropertyValue('--board').trim() || '#fcfcff';

    // Grid
    c.strokeStyle = gridColor;
    c.lineWidth = 1;
    c.beginPath();
    for (let x = 0; x < w; x += 40) {
      c.moveTo(x, 0);
      c.lineTo(x, h);
    }
    for (let y = 0; y < h; y += 40) {
      c.moveTo(0, y);
      c.lineTo(w, y);
    }
    c.stroke();

    // Geometric Objects
    c.strokeStyle = objColor;
    c.fillStyle = fillColor;
    c.lineWidth = 2.2;

    const tmp = tmpRef.current;
    const cur = curRef.current;
    const all = objsRef.current.concat(
      tmp.length && cur && LIVE_TOOLS.includes(tool)
        ? [{ t: tool === 'Polygon' ? 'Polygon' : tool, p: tmp.concat([cur]), ghost: true }]
        : []
    );

    all.forEach((o) => {
      const [a, b] = o.p;
      if (!a) return;
      c.globalAlpha = o.ghost ? 0.5 : 1;
      c.beginPath();

      if (o.t === 'Segment' || o.t === 'Distance' || o.t === 'Midpoint' || o.t === 'Vector') {
        if (b) {
          c.moveTo(a.x, a.y);
          c.lineTo(b.x, b.y);
          c.stroke();
          if (o.t === 'Vector') {
            const angle = Math.atan2(b.y - a.y, b.x - a.x);
            c.beginPath();
            c.moveTo(b.x, b.y);
            c.lineTo(b.x - 12 * Math.cos(angle - 0.4), b.y - 12 * Math.sin(angle - 0.4));
            c.lineTo(b.x - 12 * Math.cos(angle + 0.4), b.y - 12 * Math.sin(angle + 0.4));
            c.closePath();
            c.fillStyle = objColor;
            c.fill();
            c.fillStyle = fillColor;
          }
        }
      } else if (o.t === 'Line') {
        if (b) {
          const e = ext(a, b, 3000);
          c.moveTo(e[0], e[1]);
          c.lineTo(e[2], e[3]);
          c.stroke();
        }
      } else if (o.t === 'Ray') {
        if (b) {
          const e = ext(a, b, 3000);
          c.moveTo(a.x, a.y);
          c.lineTo(e[2], e[3]);
          c.stroke();
        }
      } else if (o.t === 'Circle' || o.t === 'Center & point') {
        if (b) {
          const radius = Math.hypot(b.x - a.x, b.y - a.y);
          c.arc(a.x, a.y, radius, 0, Math.PI * 2);
          c.fill();
          c.stroke();
        }
      } else if (o.t === 'Polygon') {
        o.p.forEach((pt, i) => (i ? c.lineTo(pt.x, pt.y) : c.moveTo(pt.x, pt.y)));
        if (!o.ghost) c.closePath();
        if (!o.ghost) c.fill();
        c.stroke();
      }
      c.globalAlpha = 1;
    });

    // Control Points
    ptsRef.current.forEach((p) => {
      c.beginPath();
      c.arc(p.x, p.y, 5, 0, Math.PI * 2);
      c.fillStyle = inkColor;
      c.fill();
      c.strokeStyle = boardColor;
      c.lineWidth = 2;
      c.stroke();
    });
  };

  const resize = () => {
    const cv = canvasRef.current;
    if (!cv || !cv.parentElement) return;
    const r = cv.parentElement.getBoundingClientRect();
    const d = window.devicePixelRatio || 1;
    cv.width = r.width * d;
    cv.height = r.height * d;
    const c = cv.getContext('2d');
    if (c) c.setTransform(d, 0, 0, d, 0, 0);
    draw();
  };

  useEffect(() => {
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  const getPos = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const cv = canvasRef.current;
    if (!cv) return { x: 0, y: 0 };
    const r = cv.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const p = getPos(e);
    if (!LIVE_TOOLS.includes(tool)) return;
    if (tool !== 'Move') snap();

    if (tool === 'Move') {
      dragRef.current = near(p) || null;
      if (dragRef.current) snap();
      return;
    }

    if (tool === 'Delete') {
      const q = near(p);
      if (q) {
        ptsRef.current = ptsRef.current.filter((x) => x !== q);
        objsRef.current = objsRef.current.filter((o) => !o.p.includes(q));
      }
      draw();
      return;
    }

    if (tool === 'Point') {
      getPt(p);
      draw();
      return;
    }

    const q = getPt(p);
    tmpRef.current.push(q);

    const need: Record<string, number> = {
      Segment: 2,
      Line: 2,
      Ray: 2,
      Vector: 2,
      Circle: 2,
      'Center & point': 2,
      Midpoint: 2,
      Distance: 2,
    };

    const targetCount = need[tool];
    if (targetCount && tmpRef.current.length === targetCount) {
      const [a, b] = tmpRef.current;
      if (tool === 'Midpoint') {
        ptsRef.current.push({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
      } else {
        objsRef.current.push({ t: tool === 'Center & point' ? 'Circle' : tool, p: [a, b] });
        if (tool === 'Distance') {
          setInfo('Distance: ' + (Math.hypot(a.x - b.x, a.y - b.y) / 40).toFixed(2) + ' units');
        }
      }
      tmpRef.current = [];
    }
    draw();
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    curRef.current = getPos(e);
    if (dragRef.current) {
      dragRef.current.x = curRef.current.x;
      dragRef.current.y = curRef.current.y;
    }
    draw();
  };

  const handlePointerUp = () => {
    dragRef.current = null;
  };

  const handleDoubleClick = () => {
    if (tool === 'Polygon' && tmpRef.current.length > 2) {
      objsRef.current.push({ t: 'Polygon', p: tmpRef.current.slice(0, -1) });
      tmpRef.current = [];
      draw();
    }
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const onDocClick = () => setOpenGroup(null);
    document.addEventListener('click', onDocClick);
    return () => document.removeEventListener('click', onDocClick);
  }, []);

  return (
    <div className={styles.toolsContainer}>
      <div className={styles.toolsBar}>
        {Object.entries(TOOL_GROUPS).map(([g, items]) => {
          const isOpen = openGroup === g;
          const isGroupActive = items.includes(tool);
          return (
            <div key={g} className={styles.grpContainer} onClick={(e) => e.stopPropagation()}>
              <button
                className={`${styles.grpBtn} ${isOpen || isGroupActive ? styles.grpBtnActive : ''}`}
                onClick={() => setOpenGroup(isOpen ? null : g)}
              >
                {g} &#9662;
              </button>

              {isOpen && (
                <div className={styles.dropdownMenu}>
                  {items.map((tName) => {
                    const isLive = LIVE_TOOLS.includes(tName);
                    return (
                      <button
                        key={tName}
                        className={`${styles.dropdownItem} ${tool === tName ? styles.dropdownItemActive : ''}`}
                        onClick={() => {
                          setTool(tName);
                          tmpRef.current = [];
                          setOpenGroup(null);
                          draw();
                        }}
                      >
                        {tName} {!isLive && <small className={styles.subText}>(soon)</small>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}

        <button
          className={styles.toolPillBtn}
          onClick={handleUndo}
          disabled={!canUndo}
          title="Undo last action (Ctrl+Z)"
        >
          &#8630; Undo
        </button>
      </div>

      <div className={styles.boardWrapper}>
        <canvas
          ref={canvasRef}
          className={styles.boardCanvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onDoubleClick={handleDoubleClick}
        />
      </div>

      <div className={styles.toolStatus}>
        <span>{LIVE_TOOLS.includes(tool) ? TOOL_HINTS[tool] || '' : `${tool} is coming soon.`}</span>
        <span>{info}</span>
      </div>
    </div>
  );
};
