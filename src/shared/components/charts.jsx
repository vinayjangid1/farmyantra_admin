/**
 * Lightweight SVG charts for the admin (no chart library in the bundle).
 *
 *  - AreaTrend  — smooth multi-series area/line chart with a hover guide
 *  - Donut      — proportional ring with a centre total and a clickable legend
 *  - FunnelBars — stepped conversion bars with step-to-step rates
 *  - BarList    — ranked horizontal bars (value + optional secondary value)
 *  - StackBar   — one 100% bar split into parts, with a legend
 *
 * Colours come from the caller so each chart can use the theme palette.
 */
import { useMemo, useRef, useState } from 'react'
import { Link as RouterLink } from 'react-router-dom'
import { alpha, Box, Stack, Typography, useTheme } from '@mui/material'

const fmt = (n) => Number(n || 0).toLocaleString('en-IN')

/* ───────────────────────────── Area trend ───────────────────────────── */

/** Catmull-Rom → cubic Bézier, gives a smooth line through every point. */
const smoothPath = (pts) => {
  if (pts.length < 2) return pts.length ? `M${pts[0][0]},${pts[0][1]}` : ''
  let d = `M${pts[0][0]},${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i += 1) {
    const p0 = pts[i - 1] || pts[i]
    const p1 = pts[i]
    const p2 = pts[i + 1]
    const p3 = pts[i + 2] || p2
    const c1x = p1[0] + (p2[0] - p0[0]) / 6
    const c1y = p1[1] + (p2[1] - p0[1]) / 6
    const c2x = p2[0] - (p3[0] - p1[0]) / 6
    const c2y = p2[1] - (p3[1] - p1[1]) / 6
    d += ` C${c1x},${Math.max(0, c1y)} ${c2x},${Math.max(0, c2y)} ${p2[0]},${p2[1]}`
  }
  return d
}

const niceMax = (v) => {
  if (v <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(v))
  const step = [1, 2, 2.5, 5, 10].find((s) => s * pow * 4 >= v) || 10
  return step * pow * 4
}

export const AreaTrend = ({ rows, series, height = 240, xKey = 'day', formatX = (v) => String(v).slice(5, 10) }) => {
  const theme = useTheme()
  const ref = useRef(null)
  const [hover, setHover] = useState(null)
  const W = 640
  const H = height
  const pad = { t: 12, r: 8, b: 26, l: 8 }

  const { max, paths, xs } = useMemo(() => {
    const top = niceMax(Math.max(1, ...rows.flatMap((r) => series.map((s) => Number(r[s.key]) || 0))))
    const innerW = W - pad.l - pad.r
    const innerH = H - pad.t - pad.b
    const xPos = rows.map((_, i) => pad.l + (rows.length === 1 ? innerW / 2 : (i / (rows.length - 1)) * innerW))
    const build = series.map((s) => {
      const pts = rows.map((r, i) => [xPos[i], pad.t + innerH - ((Number(r[s.key]) || 0) / top) * innerH])
      const line = smoothPath(pts)
      const area = pts.length ? `${line} L${pts[pts.length - 1][0]},${pad.t + innerH} L${pts[0][0]},${pad.t + innerH} Z` : ''
      return { ...s, line, area, pts }
    })
    return { max: top, paths: build, xs: xPos }
  }, [rows, series, H]) // eslint-disable-line react-hooks/exhaustive-deps

  const onMove = (event) => {
    const box = ref.current?.getBoundingClientRect()
    if (!box || !rows.length) return
    const x = ((event.clientX - box.left) / box.width) * W
    let best = 0
    xs.forEach((px, i) => { if (Math.abs(px - x) < Math.abs(xs[best] - x)) best = i })
    setHover(best)
  }

  const grid = [0, 0.25, 0.5, 0.75, 1]
  const innerH = H - pad.t - pad.b
  const labelEvery = Math.max(1, Math.ceil(rows.length / 6))
  const hoverRow = hover !== null ? rows[hover] : null

  return (
    <Box sx={{ position: 'relative' }}>
      <Box
        component="svg"
        ref={ref}
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
        role="img"
        aria-label={`Trend chart, ${rows.length} points`}
        sx={{ width: '100%', height, display: 'block', overflow: 'visible', cursor: 'crosshair' }}
      >
        <defs>
          {paths.map((p) => (
            <linearGradient key={p.key} id={`area-${p.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={p.color} stopOpacity="0.32" />
              <stop offset="100%" stopColor={p.color} stopOpacity="0" />
            </linearGradient>
          ))}
        </defs>
        {grid.map((g) => (
          <line key={g} x1={pad.l} x2={W - pad.r} y1={pad.t + innerH * g} y2={pad.t + innerH * g} stroke={theme.palette.divider} strokeDasharray={g === 1 ? '0' : '3 5'} vectorEffect="non-scaling-stroke" />
        ))}
        {paths.map((p) => (
          <g key={p.key}>
            <path d={p.area} fill={`url(#area-${p.key})`} />
            <path d={p.line} fill="none" stroke={p.color} strokeWidth="2.5" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeDasharray: 2000, strokeDashoffset: 0, animation: 'chart-draw 1.2s cubic-bezier(.22,1,.36,1) both' }} />
          </g>
        ))}
        {hover !== null && (
          <g>
            <line x1={xs[hover]} x2={xs[hover]} y1={pad.t} y2={pad.t + innerH} stroke={alpha(theme.palette.text.primary, 0.25)} vectorEffect="non-scaling-stroke" />
            {paths.map((p) => (
              <circle key={p.key} cx={p.pts[hover][0]} cy={p.pts[hover][1]} r="4.5" fill={theme.palette.background.paper} stroke={p.color} strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
            ))}
          </g>
        )}
      </Box>

      {/* y-axis max label and x labels as HTML so text never stretches */}
      <Typography variant="caption" sx={{ position: 'absolute', top: 0, right: 4, color: 'text.disabled', fontWeight: 700 }}>{fmt(max)}</Typography>
      <Box sx={{ position: 'relative', height: 18, mt: -2.5 }}>
        {rows.map((r, i) => (i % labelEvery === 0 || i === rows.length - 1 ? (
          <Typography key={i} variant="caption" sx={{ position: 'absolute', left: `${(xs[i] / W) * 100}%`, transform: 'translateX(-50%)', color: 'text.disabled', whiteSpace: 'nowrap', fontSize: '0.66rem' }}>
            {formatX(r[xKey])}
          </Typography>
        ) : null))}
      </Box>

      {hoverRow && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            left: `clamp(8px, calc(${(xs[hover] / W) * 100}% - 80px), calc(100% - 168px))`,
            width: 160,
            p: 1.25,
            borderRadius: 2.5,
            bgcolor: 'custom.sidebar',
            color: '#fff',
            boxShadow: 6,
            pointerEvents: 'none',
          }}
        >
          <Typography variant="caption" sx={{ display: 'block', opacity: 0.7, mb: 0.5 }}>{String(hoverRow[xKey]).slice(0, 10)}</Typography>
          {series.map((s) => (
            <Stack key={s.key} direction="row" alignItems="center" spacing={1}>
              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color }} />
              <Typography variant="caption" sx={{ flex: 1 }}>{s.label}</Typography>
              <Typography variant="caption" sx={{ fontWeight: 800 }}>{fmt(hoverRow[s.key])}</Typography>
            </Stack>
          ))}
        </Box>
      )}
    </Box>
  )
}

/* ───────────────────────────── Donut ───────────────────────────── */

export const Donut = ({ segments, size = 168, thickness = 22, centerLabel = 'Total', emptyLabel = 'All clear' }) => {
  const theme = useTheme()
  const [active, setActive] = useState(null)
  const total = segments.reduce((sum, s) => sum + (Number(s.value) || 0), 0)
  const r = (size - thickness) / 2
  const c = 2 * Math.PI * r
  let offset = 0
  const shown = active !== null ? segments[active] : null

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2.5} alignItems="center">
      <Box sx={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${centerLabel}: ${total}`}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={alpha(theme.palette.text.primary, 0.06)} strokeWidth={thickness} />
          {total > 0 && segments.map((s, i) => {
            const len = ((Number(s.value) || 0) / total) * c
            const gap = segments.filter((x) => x.value > 0).length > 1 ? 3 : 0
            const el = (
              <circle
                key={s.label}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={active === i ? thickness + 6 : thickness}
                strokeDasharray={`${Math.max(0, len - gap)} ${c}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
                style={{ transition: 'stroke-width 200ms ease', cursor: 'pointer' }}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
              />
            )
            offset += len
            return s.value > 0 ? el : null
          })}
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', textAlign: 'center', pointerEvents: 'none' }}>
          <Box>
            <Typography sx={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: '2rem', lineHeight: 1, letterSpacing: '-0.04em' }}>
              {fmt(shown ? shown.value : total)}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: size - thickness * 2 - 12, mx: 'auto', lineHeight: 1.3 }}>
              {shown ? shown.label : total ? centerLabel : emptyLabel}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0, width: '100%' }}>
        {segments.map((s, i) => (
          <Box
            key={s.label}
            component={s.to ? RouterLink : 'div'}
            to={s.to}
            onMouseEnter={() => setActive(i)}
            onMouseLeave={() => setActive(null)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.25,
              px: 1.25,
              py: 0.8,
              borderRadius: 2,
              color: 'text.primary',
              textDecoration: 'none',
              opacity: s.value ? 1 : 0.5,
              bgcolor: active === i ? alpha(s.color, 0.1) : 'transparent',
              transition: 'background-color 160ms ease',
            }}
          >
            <Box sx={{ width: 10, height: 10, borderRadius: '3px', bgcolor: s.color, flexShrink: 0 }} />
            <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>{s.label}</Typography>
            <Typography variant="body2" sx={{ fontWeight: 800 }}>{fmt(s.value)}</Typography>
          </Box>
        ))}
      </Stack>
    </Stack>
  )
}

/* ───────────────────────────── Funnel ───────────────────────────── */

export const FunnelBars = ({ steps, color }) => {
  const theme = useTheme()
  const base = Number(steps[0]?.value) || 0
  const tint = color || theme.palette.primary.main
  return (
    <Stack spacing={1.25}>
      {steps.map((s, i) => {
        const v = Number(s.value) || 0
        const width = base ? Math.max(6, (v / base) * 100) : 6
        const prev = i > 0 ? Number(steps[i - 1].value) || 0 : null
        return (
          <Box key={s.label}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline" sx={{ mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 700 }}>{s.label}</Typography>
              <Typography variant="body2">
                <strong>{fmt(v)}</strong>
                {prev !== null && (
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 0.75 }}>
                    {prev ? `${Math.round((v / prev) * 100)}%` : '—'}
                  </Typography>
                )}
              </Typography>
            </Stack>
            <Box sx={{ height: 14, borderRadius: 999, bgcolor: alpha(tint, 0.08), overflow: 'hidden' }}>
              <Box
                sx={{
                  height: '100%',
                  width: `${width}%`,
                  borderRadius: 999,
                  background: `linear-gradient(90deg, ${alpha(tint, 0.55 + i * 0.15)}, ${tint})`,
                  animation: 'bar-grow 900ms cubic-bezier(.22,1,.36,1) both',
                  animationDelay: `${i * 90}ms`,
                  transformOrigin: 'left',
                }}
              />
            </Box>
          </Box>
        )
      })}
    </Stack>
  )
}

/* ───────────────────────────── Bar list ───────────────────────────── */

export const BarList = ({ items, color, secondaryColor, valueLabel = '', secondaryLabel = '' }) => {
  const theme = useTheme()
  const tint = color || theme.palette.primary.main
  const tint2 = secondaryColor || theme.palette.custom.accent
  const max = Math.max(1, ...items.map((i) => Math.max(Number(i.value) || 0, Number(i.secondary) || 0)))
  return (
    <Stack spacing={1.5}>
      {items.map((item, idx) => (
        <Box key={item.key || item.label} component={item.to ? RouterLink : 'div'} to={item.to} sx={{ color: 'text.primary', textDecoration: 'none', display: 'block', '&:hover .bar-label': { color: 'primary.main' } }}>
          <Stack direction="row" justifyContent="space-between" spacing={1} sx={{ mb: 0.5 }}>
            <Typography className="bar-label" variant="body2" noWrap sx={{ fontWeight: 650, minWidth: 0, transition: 'color 160ms' }}>{item.label}</Typography>
            <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
              <strong style={{ color: theme.palette.text.primary }}>{fmt(item.value)}</strong> {valueLabel}
              {item.secondary !== undefined && <> · {fmt(item.secondary)} {secondaryLabel}</>}
            </Typography>
          </Stack>
          <Box sx={{ position: 'relative', height: 8, borderRadius: 999, bgcolor: alpha(theme.palette.text.primary, 0.05) }}>
            {item.secondary !== undefined && (
              <Box sx={{ position: 'absolute', inset: 0, width: `${((Number(item.secondary) || 0) / max) * 100}%`, borderRadius: 999, bgcolor: alpha(tint2, 0.45), animation: 'bar-grow 900ms cubic-bezier(.22,1,.36,1) both', animationDelay: `${idx * 70}ms`, transformOrigin: 'left' }} />
            )}
            <Box sx={{ position: 'absolute', inset: 0, width: `${((Number(item.value) || 0) / max) * 100}%`, borderRadius: 999, bgcolor: tint, animation: 'bar-grow 900ms cubic-bezier(.22,1,.36,1) both', animationDelay: `${idx * 70 + 60}ms`, transformOrigin: 'left' }} />
          </Box>
        </Box>
      ))}
    </Stack>
  )
}

/* ───────────────────────────── Stacked bar ───────────────────────────── */

export const StackBar = ({ parts, height = 14 }) => {
  const total = parts.reduce((s, p) => s + (Number(p.value) || 0), 0)
  return (
    <Box>
      <Box sx={{ display: 'flex', gap: '3px', height, borderRadius: 999, overflow: 'hidden', bgcolor: 'action.hover' }}>
        {total > 0 && parts.filter((p) => p.value > 0).map((p, i) => (
          <Box key={p.label} title={`${p.label}: ${p.value}`} sx={{ flex: `${p.value} 0 0`, bgcolor: p.color, animation: 'bar-grow 900ms cubic-bezier(.22,1,.36,1) both', animationDelay: `${i * 80}ms`, transformOrigin: 'left' }} />
        ))}
      </Box>
      <Stack direction="row" flexWrap="wrap" sx={{ mt: 1.25, columnGap: 2, rowGap: 0.5 }}>
        {parts.map((p) => (
          <Stack key={p.label} direction="row" alignItems="center" spacing={0.75}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color }} />
            <Typography variant="caption" color="text.secondary">{p.label}</Typography>
            <Typography variant="caption" sx={{ fontWeight: 800 }}>{fmt(p.value)}</Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  )
}

export default { AreaTrend, Donut, FunnelBars, BarList, StackBar }
