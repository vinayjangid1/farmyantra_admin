import { useMemo, useState } from 'react'
import {
  alpha,
  Box,
  Chip,
  Collapse,
  Drawer,
  IconButton,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material'
import { Check, ChevronDown, ChevronRight, Copy, Terminal, Trash2, X } from 'lucide-react'
import {
  clearApiLog,
  setApiLogEnabled,
  useApiLogEnabled,
  useApiLogEntries,
} from '@/lib/apiLog'
import { GRAPHQL_ENDPOINT } from '@/core/config/env'

const MONO = '"SFMono-Regular", ui-monospace, Menlo, Consolas, monospace'

const pretty = (value) => {
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return String(value)
  }
}

/** Small copy-to-clipboard icon button with a transient "copied" tick. */
const CopyButton = ({ getText, title }) => {
  const [copied, setCopied] = useState(false)
  const onCopy = async (e) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(getText())
      setCopied(true)
      setTimeout(() => setCopied(false), 1200)
    } catch {
      /* clipboard unavailable */
    }
  }
  return (
    <Tooltip title={copied ? 'Copied!' : title}>
      <IconButton size="small" onClick={onCopy} sx={{ color: copied ? '#9fe870' : '#8ea087', p: 0.4 }}>
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </IconButton>
    </Tooltip>
  )
}

const Section = ({ label, text, copyTitle }) => (
  <Box sx={{ mt: 1 }}>
    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.3 }}>
      <Typography
        sx={{
          fontFamily: MONO,
          fontSize: '0.62rem',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: alpha('#9fe870', 0.75),
        }}
      >
        {label}
      </Typography>
      <CopyButton getText={() => text} title={copyTitle} />
    </Box>
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 1,
        borderRadius: 1,
        bgcolor: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.08)',
        fontFamily: MONO,
        fontSize: '0.68rem',
        lineHeight: 1.5,
        color: '#d7e3cf',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        maxHeight: 240,
        overflow: 'auto',
      }}
    >
      {text}
    </Box>
  </Box>
)

const LogEntry = ({ entry }) => {
  const [open, setOpen] = useState(false)
  const isError = entry.status === 'error'
  const time = new Date(entry.at).toLocaleTimeString([], { hour12: false })
  const accent = isError ? '#ff6b6b' : '#9fe870'

  const headers = {
    endpoint: GRAPHQL_ENDPOINT,
    'content-type': 'application/json',
    authorization: entry.authHeader ? 'Bearer <redacted>' : '(none)',
  }
  const paramsText = pretty(entry.variables)
  const responseText = isError ? pretty(entry.errors) : pretty(entry.response)

  return (
    <Box sx={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
      <Box
        onClick={() => setOpen((o) => !o)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 0.75,
          px: 1.25,
          py: 0.85,
          cursor: 'pointer',
          '&:hover': { bgcolor: 'rgba(255,255,255,0.04)' },
        }}
      >
        {open ? <ChevronDown size={13} color="#8ea087" /> : <ChevronRight size={13} color="#8ea087" />}
        <Typography sx={{ fontFamily: MONO, fontSize: '0.6rem', color: '#8ea087', minWidth: 54 }}>
          {time}
        </Typography>
        <Box
          sx={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            flexShrink: 0,
            bgcolor: accent,
            boxShadow: `0 0 6px ${accent}`,
          }}
        />
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: '0.72rem',
            fontWeight: 700,
            color: '#eaf1e4',
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          <Box component="span" sx={{ color: alpha('#9fe870', 0.8) }}>
            {entry.type}
          </Box>{' '}
          {entry.operationName}
        </Typography>
        <Typography
          sx={{
            fontFamily: MONO,
            fontSize: '0.58rem',
            color: isError ? '#ff9a9a' : '#8ea087',
            flexShrink: 0,
          }}
        >
          {entry.httpStatus ?? (isError ? 'error' : 200)}
        </Typography>
        <Typography sx={{ fontFamily: MONO, fontSize: '0.6rem', color: '#8ea087', minWidth: 40, textAlign: 'right' }}>
          {entry.durationMs}ms
        </Typography>
      </Box>

      <Collapse in={open} unmountOnExit>
        <Box sx={{ px: 1.25, pb: 1.25 }}>
          <Section label="Headers" text={pretty(headers)} copyTitle="Copy headers" />
          <Section label="Params / Variables" text={paramsText} copyTitle="Copy params" />
          <Section
            label={isError ? 'Errors' : 'Response'}
            text={responseText}
            copyTitle={isError ? 'Copy errors' : 'Copy response'}
          />
        </Box>
      </Collapse>
    </Box>
  )
}

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'success', label: 'Success' },
  { key: 'error', label: 'Errors' },
]

/**
 * Right-side terminal-style API log drawer (dev/testing). Shows every GraphQL
 * operation the app fires — headers summary, params, and response/errors — with
 * timing and HTTP status. Captures successes AND network/400 errors. Fed by the
 * Apollo recording link via the apiLog store.
 */
const ApiLogDrawer = ({ open, onClose }) => {
  const entries = useApiLogEntries()
  const enabled = useApiLogEnabled()
  const [tab, setTab] = useState('all')

  const counts = useMemo(
    () => ({
      all: entries.length,
      success: entries.filter((e) => e.status !== 'error').length,
      error: entries.filter((e) => e.status === 'error').length,
    }),
    [entries],
  )

  const filtered = useMemo(() => {
    if (tab === 'success') return entries.filter((e) => e.status !== 'error')
    if (tab === 'error') return entries.filter((e) => e.status === 'error')
    return entries
  }, [entries, tab])

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      variant="temporary"
      ModalProps={{ keepMounted: true }}
      PaperProps={{
        sx: {
          width: { xs: '100%', sm: 460 },
          bgcolor: '#0c0f0a',
          backgroundImage: 'none',
          color: '#eaf1e4',
          borderLeft: '1px solid rgba(159,232,112,0.15)',
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 1.5,
          py: 1.25,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <Terminal size={16} color="#9fe870" />
        <Typography sx={{ fontFamily: MONO, fontSize: '0.8rem', fontWeight: 800, flex: 1 }}>
          API Log
        </Typography>
        <Tooltip title={enabled ? 'Recording on' : 'Recording off'}>
          <Switch size="small" checked={enabled} onChange={(e) => setApiLogEnabled(e.target.checked)} />
        </Tooltip>
        <Tooltip title="Clear">
          <IconButton size="small" onClick={clearApiLog} sx={{ color: '#8ea087' }}>
            <Trash2 size={15} />
          </IconButton>
        </Tooltip>
        <IconButton size="small" onClick={onClose} sx={{ color: '#8ea087' }}>
          <X size={16} />
        </IconButton>
      </Box>

      {/* Tabs */}
      <Box sx={{ display: 'flex', gap: 0.75, px: 1.5, py: 1, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        {TABS.map((t) => {
          const activeTab = tab === t.key
          const isErr = t.key === 'error'
          return (
            <Chip
              key={t.key}
              size="small"
              onClick={() => setTab(t.key)}
              label={`${t.label} ${counts[t.key]}`}
              sx={{
                fontFamily: MONO,
                fontSize: '0.64rem',
                fontWeight: 700,
                cursor: 'pointer',
                color: activeTab ? '#0c0f0a' : isErr ? '#ff9a9a' : '#c9d4c1',
                bgcolor: activeTab
                  ? isErr
                    ? '#ff6b6b'
                    : '#9fe870'
                  : 'rgba(255,255,255,0.06)',
                '&:hover': { bgcolor: activeTab ? undefined : 'rgba(255,255,255,0.12)' },
              }}
            />
          )
        })}
      </Box>

      {!enabled && (
        <Box sx={{ px: 1.5, py: 1 }}>
          <Chip
            size="small"
            label="Recording is off — flip the switch to capture API calls"
            sx={{ bgcolor: 'rgba(255,255,255,0.06)', color: '#c9d4c1', fontSize: '0.62rem' }}
          />
        </Box>
      )}

      {/* Entries */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        {filtered.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <Terminal size={30} color="#2f3a28" />
            <Typography sx={{ fontFamily: MONO, fontSize: '0.72rem', color: '#6b7a62', mt: 1 }}>
              {entries.length === 0 ? 'Waiting for API calls…' : 'No calls in this filter'}
            </Typography>
          </Box>
        ) : (
          filtered.map((entry) => <LogEntry key={entry.id} entry={entry} />)
        )}
      </Box>
    </Drawer>
  )
}

export default ApiLogDrawer
