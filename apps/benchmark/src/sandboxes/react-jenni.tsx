import { useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Checkbox,
  Col,
  Dialog,
  Field,
  Grid,
  Inline,
  Input,
  Label,
  List,
  ListItem,
  Progress,
  Select,
  Stack,
  Switch,
  Tab,
  TabList,
  TabPanel,
  Tabs,
} from '@jenni/react';

function applyTheme(dark: boolean, density = 'default') {
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
  document.documentElement.dataset.density = density || 'default';
}

const REGIONS = [
  { label: 'US West (Oregon)', value: 'us-west' },
  { label: 'EU Central (Frankfurt)', value: 'eu-central' },
  { label: 'AP Northeast (Tokyo)', value: 'ap-northeast' },
];

let activeRoot: Root | null = null;
function unmountActive() {
  if (activeRoot) {
    activeRoot.unmount();
    activeRoot = null;
  }
}

function ParityApp() {
  const [endpoint, setEndpoint] = useState('api.acme.dev/v2');
  const [region, setRegion] = useState('us-west');
  const [autoPromote, setAutoPromote] = useState(true);
  const [auditLog, setAuditLog] = useState(true);
  const [tab, setTab] = useState('canary');
  const [dlgOpen, setDlgOpen] = useState(false);

  return (
    <Stack gap="field" style={{ padding: '16px' }}>
      <Grid cols={12} gap="item">
        <Col sm={4}>
          <Card size="sm">
            <Stack gap="inline">
              <Inline justify="between">
                <span style={{ fontSize: 'var(--j-text-xs)', color: 'var(--j-fg-muted)' }}>P99 Latency</span>
                <Badge size="sm" variant="soft" tone="success">
                  Healthy
                </Badge>
              </Inline>
              <strong style={{ fontSize: 'var(--j-text-xl)' }}>11.4 ms</strong>
            </Stack>
          </Card>
        </Col>
        <Col sm={4}>
          <Card size="sm">
            <Stack gap="inline">
              <Inline justify="between">
                <span style={{ fontSize: 'var(--j-text-xs)', color: 'var(--j-fg-muted)' }}>Throughput</span>
                <Badge size="sm" variant="soft" tone="info">
                  +18%
                </Badge>
              </Inline>
              <strong style={{ fontSize: 'var(--j-text-xl)' }}>48.2k/s</strong>
            </Stack>
          </Card>
        </Col>
        <Col sm={4}>
          <Card size="sm">
            <Stack gap="inline">
              <Inline justify="between">
                <span style={{ fontSize: 'var(--j-text-xs)', color: 'var(--j-fg-muted)' }}>On-call</span>
                <Avatar name="Platform Ops" size="xs" status="online" />
              </Inline>
              <strong style={{ fontSize: 'var(--j-text-xl)' }}>99.99%</strong>
            </Stack>
          </Card>
        </Col>
      </Grid>

      <Alert
        tone="info"
        variant="soft"
        title="@jenni/react · React 19 native ref & zero CSS-in-JS"
        description="Direct Fiber-to-DOM primitives over @jenni/core @layer CSS + native <dialog>."
      />

      <Progress value={78} max={100} size="sm" label="Canary rollout progress" />

      <Tabs value={tab} onValueChange={setTab} size="sm">
        <TabList aria-label="Rollout tabs">
          <Tab value="canary">Canary Rollout</Tab>
          <Tab value="policy">Traffic Policy</Tab>
        </TabList>
        <TabPanel value="canary">
          <Card
            title="Deployment Rule"
            description="Configure canary rollout and instant rollback."
            footer={
              <Inline justify="between" style={{ width: '100%' }}>
                <Button size="sm" variant="outline" tone="neutral" onClick={() => setDlgOpen(true)}>
                  Inspect Modal
                </Button>
                <Button size="sm">Deploy release</Button>
              </Inline>
            }
          >
            <Stack gap="field">
              <Grid cols={12} gap="item">
                <Col sm={7}>
                  <Field>
                    <Label>Service endpoint</Label>
                    <Input size="sm" value={endpoint} onValueChange={setEndpoint} />
                  </Field>
                </Col>
                <Col sm={5}>
                  <Field>
                    <Label>Primary region</Label>
                    <Select size="sm" options={REGIONS} value={region} onValueChange={setRegion} />
                  </Field>
                </Col>
              </Grid>
              <Inline gap="group">
                <Switch
                  size="sm"
                  checked={autoPromote}
                  onCheckedChange={setAutoPromote}
                  label="Auto canary promotion"
                />
                <Checkbox
                  size="sm"
                  checked={auditLog}
                  onCheckedChange={setAuditLog}
                  label="Immutable audit log"
                />
              </Inline>
            </Stack>
          </Card>
        </TabPanel>
        <TabPanel value="policy">
          <Card size="sm" title="SLO Gate">
            Auto-rollback when P99 &gt; 25 ms.
          </Card>
        </TabPanel>
      </Tabs>

      <Dialog
        open={dlgOpen}
        onOpenChange={setDlgOpen}
        title="Confirm Canary Promotion"
        description="Traffic will shift from 10% to 100% across 3 availability zones."
        footer={({ close }) => (
          <Inline gap="related">
            <Button size="sm" variant="outline" tone="neutral" onClick={close}>
              Cancel
            </Button>
            <Button size="sm" onClick={close}>
              Confirm
            </Button>
          </Inline>
        )}
      >
        Zero z-index portals — rendered in browser native &lt;dialog&gt; top-layer.
      </Dialog>
    </Stack>
  );
}

(window as any).__benchAdapter = {
  mode: 'component',

  setTheme(dark: boolean, density = 'default') {
    applyTheme(dark, density);
  },

  async mountParity(stage: HTMLElement, opts?: { dark?: boolean; density?: string }) {
    unmountActive();
    stage.innerHTML = '';
    if (opts?.dark != null) applyTheme(opts.dark, opts.density);
    const root = createRoot(stage);
    activeRoot = root;
    flushSync(() => {
      root.render(<ParityApp />);
    });
    return unmountActive;
  },

  mountRows(stage: HTMLElement, count: number) {
    unmountActive();
    stage.innerHTML = '';
    const indices = Array.from({ length: count }, (_, i) => i);
    let setStepExt: ((n: number) => void) | null = null;

    function RowsApp() {
      const [step, setStep] = useState(0);
      setStepExt = setStep;
      return (
        <List variant="divided">
          {indices.map((i) => {
            const active = (i + step) % 2 === 0;
            return (
              <ListItem
                key={i}
                title={`Service Node ${i}`}
                description={`us-west-2 · gen-${step}`}
                trailing={
                  <>
                    <Badge size="sm" tone={active ? 'success' : 'neutral'}>
                      {active ? 'Live' : 'Idle'}
                    </Badge>
                    <Switch size="sm" checked={active} onChange={() => {}} aria-label="Active" />
                    <Button size="sm" variant="outline" tone="neutral">
                      Edit
                    </Button>
                    <Button size="sm">Deploy</Button>
                  </>
                }
              />
            );
          })}
        </List>
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
      setTheme(dark: boolean, density = 'default') {
        applyTheme(dark, density);
      },
      unmount() {
        root.unmount();
        if (activeRoot === root) activeRoot = null;
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
        <Grid cols={12} gap="item">
          {indices.map((i) => (
            <Col key={i} sm={6} md={4} lg={3}>
              <Card size="sm">
                <Inline justify="between">
                  <Badge size="sm" variant="soft">
                    M-{i}
                  </Badge>
                  <strong>99.{i % 99}%</strong>
                </Inline>
              </Card>
            </Col>
          ))}
        </Grid>,
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
    let setStateExt: ((s: { open: boolean; tab: string }) => void) | null = null;

    function OverlayApp() {
      const [st, setSt] = useState({ open: false, tab: 'a' });
      setStateExt = setSt;
      return (
        <div>
          <Tabs value={st.tab} onValueChange={(v) => setSt((p) => ({ ...p, tab: v }))}>
            <TabList aria-label="Bench tabs">
              <Tab value="a">Alpha</Tab>
              <Tab value="b">Beta</Tab>
            </TabList>
            <TabPanel value="a">Panel A</TabPanel>
            <TabPanel value="b">Panel B</TabPanel>
          </Tabs>
          <Dialog open={st.open} onOpenChange={(o) => setSt((p) => ({ ...p, open: o }))} title="Bench Dialog">
            Dialog payload
          </Dialog>
        </div>
      );
    }

    const root = createRoot(stage);
    flushSync(() => {
      root.render(<OverlayApp />);
    });

    for (let i = 0; i < iterations; i++) {
      flushSync(() => {
        setStateExt?.({ open: true, tab: i % 2 === 0 ? 'b' : 'a' });
      });
      void stage.offsetHeight;
      flushSync(() => {
        setStateExt?.({ open: false, tab: i % 2 === 0 ? 'b' : 'a' });
      });
      void stage.offsetHeight;
    }

    root.unmount();
    stage.innerHTML = '';
  },
};
