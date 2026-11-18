import { useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Checkbox,
  Col,
  ConfigProvider,
  Input,
  Modal,
  Progress,
  Row,
  Select,
  Switch,
  Tabs,
  Tag,
  theme,
} from 'antd';

const REGIONS = [
  { label: 'US West (Oregon)', value: 'us-west' },
  { label: 'EU Central (Frankfurt)', value: 'eu-central' },
  { label: 'AP Northeast (Tokyo)', value: 'ap-northeast' },
];

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
    <ConfigProvider
      theme={{
        algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      <div
        style={{
          padding: 16,
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: dark ? '#141414' : '#ffffff',
          color: dark ? '#ffffffd9' : '#000000e0',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        <Row gutter={[10, 10]}>
          <Col xs={24} sm={8}>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>P99 Latency</span>
                <Tag color="success" style={{ margin: 0 }}>
                  Healthy
                </Tag>
              </div>
              <strong style={{ fontSize: 18 }}>11.4 ms</strong>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>Throughput</span>
                <Tag color="processing" style={{ margin: 0 }}>
                  +18%
                </Tag>
              </div>
              <strong style={{ fontSize: 18 }}>48.2k/s</strong>
            </Card>
          </Col>
          <Col xs={24} sm={8}>
            <Card size="small">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, opacity: 0.7 }}>On-call</span>
                <Avatar size="small">JO</Avatar>
              </div>
              <strong style={{ fontSize: 18 }}>99.99%</strong>
            </Card>
          </Col>
        </Row>

        <Alert
          type="info"
          showIcon
          title="Ant Design + @ant-design/cssinjs"
          description="Runtime JS design-token hashing + rc-* component primitives."
        />

        <Progress percent={78} showInfo={false} size="small" />

        <Tabs
          activeKey={tab}
          onChange={setTab}
          size="small"
          items={[
            {
              key: 'canary',
              label: 'Canary Rollout',
              children: (
                <Card
                  size="small"
                  title="Deployment Rule"
                  actions={[
                    <div
                      key="f"
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '0 12px',
                      }}
                    >
                      <Button size="small" onClick={() => setDlgOpen(true)}>
                        Inspect Modal
                      </Button>
                      <Button size="small" type="primary">
                        Deploy release
                      </Button>
                    </div>,
                  ]}
                >
                  <Row gutter={[12, 12]}>
                    <Col xs={24} sm={14}>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Service endpoint</div>
                      <Input
                        size="small"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                      />
                    </Col>
                    <Col xs={24} sm={10}>
                      <div style={{ fontSize: 12, marginBottom: 4 }}>Primary region</div>
                      <Select
                        size="small"
                        style={{ width: '100%' }}
                        options={REGIONS}
                        value={region}
                        onChange={(v) => setRegion(v)}
                      />
                    </Col>
                  </Row>
                  <div style={{ display: 'flex', gap: 18, marginTop: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 }}>
                      <Switch size="small" checked={autoPromote} onChange={setAutoPromote} />
                      Auto canary promotion
                    </label>
                    <Checkbox checked={auditLog} onChange={(e) => setAuditLog(e.target.checked)}>
                      Immutable audit log
                    </Checkbox>
                  </div>
                </Card>
              ),
            },
            {
              key: 'policy',
              label: 'Traffic Policy',
              children: <Card size="small">Auto-rollback when P99 &gt; 25 ms.</Card>,
            },
          ]}
        />

        <Modal
          title="Confirm Canary Promotion"
          open={dlgOpen}
          onOk={() => setDlgOpen(false)}
          onCancel={() => setDlgOpen(false)}
          width={400}
        >
          Traffic will shift from 10% to 100% across 3 availability zones.
        </Modal>
      </div>
    </ConfigProvider>
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
        <ConfigProvider theme={{ algorithm: dark ? theme.darkAlgorithm : theme.defaultAlgorithm }}>
          <div style={{ background: dark ? '#141414' : '#fff', color: dark ? '#fff' : '#000' }}>
            {indices.map((i) => {
              const active = (i + step) % 2 === 0;
              return (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 12px',
                    borderBottom: '1px solid rgba(128,128,128,0.2)',
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>Service Node {i}</div>
                    <div style={{ fontSize: 11, opacity: 0.65 }}>us-west-2 · gen-{step}</div>
                  </div>
                  <Tag color={active ? 'success' : 'default'} style={{ margin: 0 }}>
                    {active ? 'Live' : 'Idle'}
                  </Tag>
                  <Switch size="small" checked={active} />
                  <Button size="small">Edit</Button>
                  <Button size="small" type="primary">
                    Deploy
                  </Button>
                </div>
              );
            })}
          </div>
        </ConfigProvider>
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
        <ConfigProvider>
          <Row gutter={[10, 10]}>
            {indices.map((i) => (
              <Col key={i} xs={24} sm={12} md={8} lg={6}>
                <Card size="small">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Tag style={{ margin: 0 }}>M-{i}</Tag>
                    <strong>99.{i % 99}%</strong>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        </ConfigProvider>,
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
        <ConfigProvider theme={{ token: { motion: false } }}>
          <Tabs
            activeKey={st.tab}
            items={[
              { key: 'a', label: 'Alpha', children: 'Panel A' },
              { key: 'b', label: 'Beta', children: 'Panel B' },
            ]}
          />
          <Modal open={st.open} title="Bench Dialog" getContainer={false}>
            Dialog payload
          </Modal>
        </ConfigProvider>
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
