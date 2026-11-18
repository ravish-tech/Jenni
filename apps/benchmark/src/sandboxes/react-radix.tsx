import '@radix-ui/themes/styles.css';
import { useState } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Callout,
  Card,
  Checkbox,
  Dialog,
  Flex,
  Grid,
  Progress,
  Select,
  Switch,
  Tabs,
  Text,
  TextField,
  Theme,
} from '@radix-ui/themes';

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
    <Theme appearance={dark ? 'dark' : 'light'} accentColor="indigo" grayColor="slate" radius="medium">
      <Flex direction="column" gap="3" p="4">
        <Grid columns={{ initial: '1', sm: '3' }} gap="3">
          <Card size="1">
            <Flex justify="between" align="center" mb="1">
              <Text size="1" color="gray">
                P99 Latency
              </Text>
              <Badge color="green" size="1">
                Healthy
              </Badge>
            </Flex>
            <Text size="5" weight="bold">
              11.4 ms
            </Text>
          </Card>
          <Card size="1">
            <Flex justify="between" align="center" mb="1">
              <Text size="1" color="gray">
                Throughput
              </Text>
              <Badge color="blue" size="1">
                +18%
              </Badge>
            </Flex>
            <Text size="5" weight="bold">
              48.2k/s
            </Text>
          </Card>
          <Card size="1">
            <Flex justify="between" align="center" mb="1">
              <Text size="1" color="gray">
                On-call
              </Text>
              <Avatar fallback="JO" size="1" radius="full" />
            </Flex>
            <Text size="5" weight="bold">
              99.99%
            </Text>
          </Card>
        </Grid>

        <Callout.Root color="blue" size="1">
          <Callout.Text>
            <strong>Radix Themes 3</strong> — Radix Primitives + 30-scale token CSS + React Portal overlays.
          </Callout.Text>
        </Callout.Root>

        <Progress value={78} size="1" />

        <Tabs.Root value={tab} onValueChange={setTab}>
          <Tabs.List size="1">
            <Tabs.Trigger value="canary">Canary Rollout</Tabs.Trigger>
            <Tabs.Trigger value="policy">Traffic Policy</Tabs.Trigger>
          </Tabs.List>
          <Box pt="3">
            <Tabs.Content value="canary">
              <Card size="2">
                <Flex direction="column" gap="3">
                  <Box>
                    <Text as="div" size="2" weight="bold">
                      Deployment Rule
                    </Text>
                    <Text as="div" size="1" color="gray">
                      Configure canary rollout and instant rollback.
                    </Text>
                  </Box>
                  <Grid columns={{ initial: '1', sm: '2' }} gap="3">
                    <Box>
                      <Text as="label" size="1" weight="medium" mb="1">
                        Service endpoint
                      </Text>
                      <TextField.Root
                        size="2"
                        value={endpoint}
                        onChange={(e) => setEndpoint(e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text as="label" size="1" weight="medium" mb="1">
                        Primary region
                      </Text>
                      <Select.Root size="2" value={region} onValueChange={setRegion}>
                        <Select.Trigger style={{ width: '100%' }} />
                        <Select.Content>
                          <Select.Item value="us-west">US West (Oregon)</Select.Item>
                          <Select.Item value="eu-central">EU Central (Frankfurt)</Select.Item>
                          <Select.Item value="ap-northeast">AP Northeast (Tokyo)</Select.Item>
                        </Select.Content>
                      </Select.Root>
                    </Box>
                  </Grid>
                  <Flex gap="4" wrap="wrap" align="center">
                    <Text as="label" size="2">
                      <Flex gap="2" align="center">
                        <Switch size="1" checked={autoPromote} onCheckedChange={setAutoPromote} />
                        Auto canary promotion
                      </Flex>
                    </Text>
                    <Text as="label" size="2">
                      <Flex gap="2" align="center">
                        <Checkbox size="1" checked={auditLog} onCheckedChange={(v) => setAuditLog(!!v)} />
                        Immutable audit log
                      </Flex>
                    </Text>
                  </Flex>
                  <Flex justify="between" align="center" pt="2">
                    <Button size="1" variant="outline" onClick={() => setDlgOpen(true)}>
                      Inspect Modal
                    </Button>
                    <Button size="1">Deploy release</Button>
                  </Flex>
                </Flex>
              </Card>
            </Tabs.Content>
            <Tabs.Content value="policy">
              <Card size="1">Auto-rollback when P99 &gt; 25 ms.</Card>
            </Tabs.Content>
          </Box>
        </Tabs.Root>

        <Dialog.Root open={dlgOpen} onOpenChange={setDlgOpen}>
          <Dialog.Content maxWidth="400px">
            <Dialog.Title size="3">Confirm Canary Promotion</Dialog.Title>
            <Dialog.Description size="2" mb="3">
              Traffic will shift from 10% to 100% across 3 availability zones.
            </Dialog.Description>
            <Flex gap="2" justify="end">
              <Button size="1" variant="soft" color="gray" onClick={() => setDlgOpen(false)}>
                Cancel
              </Button>
              <Button size="1" onClick={() => setDlgOpen(false)}>
                Confirm
              </Button>
            </Flex>
          </Dialog.Content>
        </Dialog.Root>
      </Flex>
    </Theme>
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
        <Theme appearance={dark ? 'dark' : 'light'} accentColor="indigo" grayColor="slate">
          <Box>
            {indices.map((i) => {
              const active = (i + step) % 2 === 0;
              return (
                <Flex
                  key={i}
                  align="center"
                  gap="3"
                  px="3"
                  py="2"
                  style={{ borderBottom: '1px solid var(--gray-a5)' }}
                >
                  <Box style={{ flex: 1, minWidth: 0 }}>
                    <Text as="div" size="2" weight="medium">
                      Service Node {i}
                    </Text>
                    <Text as="div" size="1" color="gray">
                      us-west-2 · gen-{step}
                    </Text>
                  </Box>
                  <Badge color={active ? 'green' : 'gray'} size="1">
                    {active ? 'Live' : 'Idle'}
                  </Badge>
                  <Switch size="1" checked={active} />
                  <Button size="1" variant="outline">
                    Edit
                  </Button>
                  <Button size="1">Deploy</Button>
                </Flex>
              );
            })}
          </Box>
        </Theme>
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
        <Theme appearance="light" accentColor="indigo" grayColor="slate">
          <Grid columns={{ initial: '1', xs: '2', sm: '3', md: '4' }} gap="2">
            {indices.map((i) => (
              <Card key={i} size="1">
                <Flex justify="between" align="center">
                  <Badge color="gray" size="1">
                    M-{i}
                  </Badge>
                  <Text size="2" weight="bold">
                    99.{i % 99}%
                  </Text>
                </Flex>
              </Card>
            ))}
          </Grid>
        </Theme>,
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
        <Theme appearance="light" accentColor="indigo" grayColor="slate">
          <Tabs.Root value={st.tab} onValueChange={(v) => setSt((p) => ({ ...p, tab: v }))}>
            <Tabs.List size="1">
              <Tabs.Trigger value="a">Alpha</Tabs.Trigger>
              <Tabs.Trigger value="b">Beta</Tabs.Trigger>
            </Tabs.List>
            <Tabs.Content value="a">Panel A</Tabs.Content>
            <Tabs.Content value="b">Panel B</Tabs.Content>
          </Tabs.Root>
          <Dialog.Root open={st.open} onOpenChange={(o) => setSt((p) => ({ ...p, open: o }))}>
            <Dialog.Content>
              <Dialog.Title>Bench Dialog</Dialog.Title>
              <Dialog.Description>Dialog payload</Dialog.Description>
            </Dialog.Content>
          </Dialog.Root>
        </Theme>
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
