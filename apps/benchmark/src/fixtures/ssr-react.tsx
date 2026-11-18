import { renderToString } from 'react-dom/server';
import {
  Badge as JBadge,
  Button as JButton,
  Card as JCard,
  Col as JCol,
  Grid as JGrid,
  List as JList,
  ListItem as JListItem,
  Switch as JSwitch,
} from '@jenni/react';
import {
  Box as MBox,
  Button as MButton,
  Card as MCard,
  CardContent as MCardContent,
  Chip as MChip,
  Grid as MGrid,
  Switch as MSwitch,
  ThemeProvider,
  createTheme,
} from '@mui/material';
import {
  Button as AButton,
  Card as ACard,
  Col as ACol,
  ConfigProvider,
  Row as ARow,
  Switch as ASwitch,
  Tag as ATag,
} from 'antd';
import {
  Badge as RBadge,
  Button as RButton,
  Card as RCard,
  Flex as RFlex,
  Grid as RGrid,
  Switch as RSwitch,
  Theme as RTheme,
} from '@radix-ui/themes';

export function renderReactPayloads(rows = 200, cards = 24): Record<string, string> {
  const rowIdx = Array.from({ length: rows }, (_, i) => i);
  const cardIdx = Array.from({ length: cards }, (_, i) => i);
  const muiTheme = createTheme();

  const jenni = renderToString(
    <div>
      <JList variant="divided">
        {rowIdx.map((i) => (
          <JListItem
            key={i}
            title={`Service Node ${i}`}
            description="us-west-2 · replica-set"
            trailing={
              <>
                <JBadge size="sm" tone="success">
                  Live
                </JBadge>
                <JSwitch size="sm" defaultChecked={i % 2 === 0} aria-label="Active" />
                <JButton size="sm" variant="outline">
                  Edit
                </JButton>
                <JButton size="sm">Deploy</JButton>
              </>
            }
          />
        ))}
      </JList>
      <JGrid cols={12} gap="item">
        {cardIdx.map((i) => (
          <JCol key={i} sm={6} md={4} lg={3}>
            <JCard size="sm">
              <JBadge size="sm" variant="soft">
                M-{i}
              </JBadge>
              <strong>99.{i % 99}%</strong>
            </JCard>
          </JCol>
        ))}
      </JGrid>
    </div>,
  );

  const mui = renderToString(
    <ThemeProvider theme={muiTheme}>
      <div>
        <div>
          {rowIdx.map((i) => (
            <MBox key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
              <div>
                <div>Service Node {i}</div>
                <div>us-west-2 · replica-set</div>
              </div>
              <MChip label="Live" color="success" size="small" />
              <MSwitch defaultChecked={i % 2 === 0} size="small" />
              <MButton size="small" variant="outlined">
                Edit
              </MButton>
              <MButton size="small" variant="contained">
                Deploy
              </MButton>
            </MBox>
          ))}
        </div>
        <MGrid container spacing={1}>
          {cardIdx.map((i) => (
            <MGrid key={i} size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
              <MCard variant="outlined">
                <MCardContent>
                  <MChip label={`M-${i}`} size="small" />
                  <strong>99.{i % 99}%</strong>
                </MCardContent>
              </MCard>
            </MGrid>
          ))}
        </MGrid>
      </div>
    </ThemeProvider>,
  );

  const antd = renderToString(
    <ConfigProvider>
      <div>
        <div>
          {rowIdx.map((i) => (
            <div key={i}>
              <div>
                <div>Service Node {i}</div>
                <div>us-west-2 · replica-set</div>
              </div>
              <ATag color="success">Live</ATag>
              <ASwitch defaultChecked={i % 2 === 0} size="small" />
              <AButton size="small">Edit</AButton>
              <AButton size="small" type="primary">
                Deploy
              </AButton>
            </div>
          ))}
        </div>
        <ARow gutter={[8, 8]}>
          {cardIdx.map((i) => (
            <ACol key={i} xs={24} sm={12} md={8} lg={6}>
              <ACard size="small">
                <ATag>M-{i}</ATag>
                <strong>99.{i % 99}%</strong>
              </ACard>
            </ACol>
          ))}
        </ARow>
      </div>
    </ConfigProvider>,
  );

  const radix = renderToString(
    <RTheme appearance="light" accentColor="indigo" grayColor="slate">
      <div>
        <div>
          {rowIdx.map((i) => (
            <RFlex key={i} align="center" gap="2">
              <div>
                <div>Service Node {i}</div>
                <div>us-west-2 · replica-set</div>
              </div>
              <RBadge color="green" size="1">
                Live
              </RBadge>
              <RSwitch defaultChecked={i % 2 === 0} size="1" />
              <RButton size="1" variant="outline">
                Edit
              </RButton>
              <RButton size="1">Deploy</RButton>
            </RFlex>
          ))}
        </div>
        <RGrid columns={{ initial: '1', sm: '2', md: '4' }} gap="2">
          {cardIdx.map((i) => (
            <RCard key={i} size="1">
              <RBadge size="1">M-{i}</RBadge>
              <strong>99.{i % 99}%</strong>
            </RCard>
          ))}
        </RGrid>
      </div>
    </RTheme>,
  );

  return { jenni, mui, antd, radix };
}
