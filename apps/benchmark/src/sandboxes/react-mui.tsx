import { useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  Chip,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  LinearProgress,
  MenuItem,
  Select,
  Switch,
  Tab,
  Tabs,
  TextField,
  ThemeProvider,
  Typography,
  createTheme,
} from '@mui/material';

const lightTheme = createTheme({ palette: { mode: 'light' } });
const darkTheme = createTheme({ palette: { mode: 'dark' } });

let activeRoot: Root | null = null;
let setDarkGlobal: ((d: boolean) => void) | null = null;

function unmountActive() {
  if (activeRoot) {
    activeRoot.unmount();
    activeRoot = null;
    setDarkGlobal = null;
  }
}

function ParityApp({ initialDark }: { initialDark: boolean }) {
  const [dark, setDark] = useState(initialDark);
  setDarkGlobal = setDark;
  const [endpoint, setEndpoint] = useState('api.acme.dev/v2');
  const [region, setRegion] = useState('us-west');
  const [autoPromote, setAutoPromote] = useState(true);
  const [auditLog, setAuditLog] = useState(true);
  const [tab, setTab] = useState('canary');
  const [dlgOpen, setDlgOpen] = useState(false);

  return (
    <ThemeProvider theme={dark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    P99 Latency
                  </Typography>
                  <Chip label="Healthy" color="success" size="small" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  11.4 ms
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    Throughput
                  </Typography>
                  <Chip label="+18%" color="info" size="small" />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  48.2k/s
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: '12px !important' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                  <Typography variant="caption" color="text.secondary">
                    On-call
                  </Typography>
                  <Avatar sx={{ width: 22, height: 22, fontSize: 11 }}>JO</Avatar>
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  99.99%
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Alert severity="info" sx={{ py: 0.5 }}>
          <strong>MUI + Emotion CSS-in-JS</strong> — Runtime style serialization &amp; &lt;style data-emotion&gt; tags.
        </Alert>

        <LinearProgress variant="determinate" value={78} sx={{ borderRadius: 1, height: 6 }} />

        <Tabs value={tab} onChange={(_e, v) => setTab(v)} sx={{ minHeight: 36 }}>
          <Tab value="canary" label="Canary Rollout" sx={{ minHeight: 36, py: 0.5 }} />
          <Tab value="policy" label="Traffic Policy" sx={{ minHeight: 36, py: 0.5 }} />
        </Tabs>

        {tab === 'canary' ? (
          <Card variant="outlined">
            <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              <Box>
                <Typography variant="subtitle2">Deployment Rule</Typography>
                <Typography variant="caption" color="text.secondary">
                  Configure canary rollout and instant rollback.
                </Typography>
              </Box>
              <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, sm: 7 }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Service endpoint"
                    value={endpoint}
                    onChange={(e) => setEndpoint(e.target.value)}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 5 }}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Primary region</InputLabel>
                    <Select
                      label="Primary region"
                      value={region}
                      onChange={(e) => setRegion(String(e.target.value))}
                    >
                      <MenuItem value="us-west">US West (Oregon)</MenuItem>
                      <MenuItem value="eu-central">EU Central (Frankfurt)</MenuItem>
                      <MenuItem value="ap-northeast">AP Northeast (Tokyo)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <FormControlLabel
                  control={
                    <Switch
                      size="small"
                      checked={autoPromote}
                      onChange={(e) => setAutoPromote(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Auto canary promotion</Typography>}
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      size="small"
                      checked={auditLog}
                      onChange={(e) => setAuditLog(e.target.checked)}
                    />
                  }
                  label={<Typography variant="body2">Immutable audit log</Typography>}
                />
              </Box>
            </CardContent>
            <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 1.5 }}>
              <Button size="small" variant="outlined" onClick={() => setDlgOpen(true)}>
                Inspect Modal
              </Button>
              <Button size="small" variant="contained" disableElevation>
                Deploy release
              </Button>
            </CardActions>
          </Card>
        ) : (
          <Card variant="outlined">
            <CardContent>Auto-rollback when P99 &gt; 25 ms.</CardContent>
          </Card>
        )}

        <Dialog open={dlgOpen} onClose={() => setDlgOpen(false)}>
          <DialogTitle>Confirm Canary Promotion</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              Traffic will shift from 10% to 100% across 3 availability zones.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button size="small" onClick={() => setDlgOpen(false)}>
              Cancel
            </Button>
            <Button size="small" variant="contained" onClick={() => setDlgOpen(false)}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </ThemeProvider>
  );
}

(window as any).__benchAdapter = {
  mode: 'component',

  setTheme(dark: boolean) {
    if (setDarkGlobal) {
      flushSync(() => setDarkGlobal?.(dark));
    }
  },

  async mountParity(stage: HTMLElement, opts?: { dark?: boolean }) {
    unmountActive();
    stage.innerHTML = '';
    const root = createRoot(stage);
    activeRoot = root;
    flushSync(() => {
      root.render(<ParityApp initialDark={!!opts?.dark} />);
    });
    return unmountActive;
  },

  mountRows(stage: HTMLElement, count: number) {
    unmountActive();
    stage.innerHTML = '';
    const indices = Array.from({ length: count }, (_, i) => i);
    let setStepExt: ((n: number) => void) | null = null;
    let setDarkExt: ((d: boolean) => void) | null = null;

    function RowsApp() {
      const [step, setStep] = useState(0);
      const [dark, setDark] = useState(false);
      setStepExt = setStep;
      setDarkExt = setDark;
      setDarkGlobal = setDark;
      return (
        <ThemeProvider theme={dark ? darkTheme : lightTheme}>
          <CssBaseline />
          <Box>
            {indices.map((i) => {
              const active = (i + step) % 2 === 0;
              return (
                <Box
                  key={i}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.25,
                    px: 1.5,
                    py: 0.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }}>
                      Service Node {i}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      us-west-2 · gen-{step}
                    </Typography>
                  </Box>
                  <Chip label={active ? 'Live' : 'Idle'} color={active ? 'success' : 'default'} size="small" />
                  <Switch size="small" checked={active} />
                  <Button size="small" variant="outlined">
                    Edit
                  </Button>
                  <Button size="small" variant="contained" disableElevation>
                    Deploy
                  </Button>
                </Box>
              );
            })}
          </Box>
        </ThemeProvider>
      );
    }

    const root = createRoot(stage);
    activeRoot = root;
    flushSync(() => {
      root.render(<RowsApp />);
    });

    return {
      updateState(next: number) {
        flushSync(() => {
          setStepExt?.(next);
        });
      },
      setTheme(dark: boolean) {
        flushSync(() => {
          setDarkExt?.(dark);
        });
      },
      unmount() {
        root.unmount();
        if (activeRoot === root) {
          activeRoot = null;
          setDarkGlobal = null;
        }
        stage.innerHTML = '';
      },
    };
  },

  mountGrid(stage: HTMLElement, cards = 48) {
    unmountActive();
    stage.innerHTML = '';
    const indices = Array.from({ length: cards }, (_, i) => i);

    const root = createRoot(stage);
    activeRoot = root;
    flushSync(() => {
      root.render(
        <ThemeProvider theme={lightTheme}>
          <Grid container spacing={1.5}>
            {indices.map((i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
                <Card variant="outlined">
                  <CardContent sx={{ p: '10px !important', display: 'flex', justifyContent: 'space-between' }}>
                    <Chip label={`M-${i}`} size="small" />
                    <strong>99.{i % 99}%</strong>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </ThemeProvider>,
      );
    });

    return {
      unmount() {
        root.unmount();
        if (activeRoot === root) activeRoot = null;
        stage.innerHTML = '';
      },
    };
  },

  async cycleOverlay(stage: HTMLElement, iterations = 20) {
    unmountActive();
    stage.innerHTML = '';
    let setStExt: ((s: { open: boolean; tab: string }) => void) | null = null;

    function OverlayApp() {
      const [st, setSt] = useState({ open: false, tab: 'a' });
      setStExt = setSt;
      return (
        <ThemeProvider theme={lightTheme}>
          <Tabs value={st.tab} onChange={(_e, v) => setSt((p) => ({ ...p, tab: v }))}>
            <Tab value="a" label="Alpha" />
            <Tab value="b" label="Beta" />
          </Tabs>
          <Dialog open={st.open} transitionDuration={0} disablePortal>
            <DialogContent>Dialog payload</DialogContent>
          </Dialog>
        </ThemeProvider>
      );
    }

    const root = createRoot(stage);
    flushSync(() => {
      root.render(<OverlayApp />);
    });

    for (let i = 0; i < iterations; i++) {
      flushSync(() => {
        setStExt?.({ open: true, tab: i % 2 === 0 ? 'b' : 'a' });
      });
      void stage.offsetHeight;
      flushSync(() => {
        setStExt?.({ open: false, tab: i % 2 === 0 ? 'b' : 'a' });
      });
      void stage.offsetHeight;
    }

    root.unmount();
    stage.innerHTML = '';
  },
};
