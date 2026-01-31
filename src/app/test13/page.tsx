'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  Grid,
  Text,
  Title,
  TabList,
  Tab,
  TabGroup,
  TabPanels,
  TabPanel,
  Badge,
  BadgeDelta,
  BarChart,
  AreaChart,
  DonutChart,
  Table,
  TableHead,
  TableRow,
  TableHeaderCell,
  TableBody,
  TableCell,
  ProgressBar,
  Flex,
  Icon,
  Button,
  Tracker,
  Callout,
  type Color,
} from '@tremor/react';
import {
  UsersIcon,
  ClockIcon,
  ChartBarIcon,
  CursorArrowRaysIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ArrowRightIcon,
  MoonIcon,
  SunIcon,
  EllipsisHorizontalIcon,
  LightBulbIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PlayIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';

// --- Dummy Data ---

const kpiData = [
  {
    title: 'Total Active Users',
    value: '142',
    delta: '12%',
    deltaType: 'moderateIncrease',
    icon: UsersIcon,
  },
  {
    title: 'Avg. Productivity',
    value: '84.2%',
    delta: '4.3%',
    deltaType: 'moderateIncrease',
    icon: ChartBarIcon,
  },
  {
    title: 'Total Hours Tracked',
    value: '12,482',
    delta: '8%',
    deltaType: 'moderateIncrease',
    icon: ClockIcon,
  },
  {
    title: 'Security Alerts',
    value: '2',
    delta: '90%',
    deltaType: 'moderateDecrease',
    icon: ShieldCheckIcon,
  },
];

const teamData = [
  {
    name: 'Sarah Chen',
    role: 'Senior Engineer',
    efficiency: 92,
    status: 'Active',
    lastActive: '2 mins ago',
    hoursToday: '6.5h',
    apps: ['VS Code', 'Slack', 'GitHub'],
  },
  {
    name: 'Alex Rivera',
    role: 'UI Designer',
    efficiency: 88,
    status: 'Idle',
    lastActive: '14 mins ago',
    hoursToday: '4.2h',
    apps: ['Figma', 'Slack', 'Linear'],
  },
  {
    name: 'Marcus Wright',
    role: 'Backend Developer',
    efficiency: 74,
    status: 'Offline',
    lastActive: '2 hours ago',
    hoursToday: '8.0h',
    apps: ['IntelliJ', 'Docker', 'Postman'],
  },
  {
    name: 'Elena Gilbert',
    role: 'Product Manager',
    efficiency: 95,
    status: 'Active',
    lastActive: 'Just now',
    hoursToday: '5.8h',
    apps: ['Notion', 'Slack', 'Google Meet'],
  },
];

const productivityData = [
  { date: 'Jan 23', 'Productive Time': 2890, 'Neutral Time': 1400, 'Distracting Time': 490 },
  { date: 'Jan 24', 'Productive Time': 1890, 'Neutral Time': 1200, 'Distracting Time': 300 },
  { date: 'Jan 25', 'Productive Time': 2400, 'Neutral Time': 1100, 'Distracting Time': 200 },
  { date: 'Jan 26', 'Productive Time': 3490, 'Neutral Time': 1908, 'Distracting Time': 600 },
  { date: 'Jan 27', 'Productive Time': 2500, 'Neutral Time': 1300, 'Distracting Time': 400 },
  { date: 'Jan 28', 'Productive Time': 3100, 'Neutral Time': 1500, 'Distracting Time': 500 },
  { date: 'Jan 29', 'Productive Time': 3800, 'Neutral Time': 1700, 'Distracting Time': 550 },
];

const appDistribution = [
  { name: 'Development', value: 4560 },
  { name: 'Communication', value: 2340 },
  { name: 'Design', value: 1200 },
  { name: 'Social/Other', value: 450 },
];

const trackerData: { color: Color; tooltip: string }[] = Array.from({ length: 40 }, (_, i) => ({
  color: i % 7 === 0 ? 'rose' : i % 5 === 0 ? 'yellow' : i % 10 === 0 ? 'gray' : 'emerald',
  tooltip: `${i % 7 === 0 ? 'Low' : 'High'} Activity Segment`,
}));

const screenshots = [
  { id: 1, user: 'Sarah Chen', app: 'VS Code', time: '10:45 AM', url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=400&h=250&fit=crop' },
  { id: 2, user: 'Sarah Chen', app: 'Terminal', time: '10:42 AM', url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=400&h=250&fit=crop' },
  { id: 3, user: 'Alex Rivera', app: 'Figma', time: '10:30 AM', url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&h=250&fit=crop' },
  { id: 4, user: 'Elena Gilbert', app: 'Notion', time: '10:15 AM', url: 'https://images.unsplash.com/photo-1512486130939-2c4f79935e4f?w=400&h=250&fit=crop' },
];

// --- Sub-components ---

const SectionHeader = ({ title, description, icon }: { title: string, description: string, icon?: any }) => (
  <div className="mb-6">
    <Flex justifyContent="start" className="space-x-2">
      {icon && <Icon icon={icon} variant="simple" color="blue" />}
      <Title>{title}</Title>
    </Flex>
    <Text>{description}</Text>
  </div>
);

const ThemeToggle = () => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return <div className="w-10 h-10" />;

  return (
    <Button
      variant="light"
      icon={theme === 'dark' ? SunIcon : MoonIcon}
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      className="p-2 rounded-full border border-gray-200 dark:border-gray-800"
    />
  );
};

const AIInsights = () => (
  <Card className="mt-6 border-l-4 border-l-purple-500 overflow-hidden relative">
    <div className="absolute top-0 right-0 p-4 opacity-10">
      <SparklesIcon className="w-24 h-24 text-purple-600" />
    </div>
    <Flex justifyContent="start" className="space-x-2 mb-4">
      <Icon icon={SparklesIcon} variant="light" color="purple" />
      <Title className="text-purple-600 dark:text-purple-400">AI Behavioral Analysis</Title>
    </Flex>
    <Grid numItemsLg={3} className="gap-6">
      <div className="space-y-4">
        <Callout title="Productivity Surge" color="emerald" icon={LightBulbIcon}>
          The Engineering team is showing a 15% increase in deep work sessions compared to last week. Most productive hours: 9 AM - 11 AM.
        </Callout>
        <Callout title="Burnout Risk Detected" color="rose" icon={ExclamationTriangleIcon}>
          3 members of the Backend team have worked over 10 hours for 4 consecutive days. Immediate break intervention recommended.
        </Callout>
      </div>
      <div className="lg:col-span-2">
        <Text className="font-medium mb-2">Automated Optimization Suggestions:</Text>
        <div className="space-y-2">
          {[
            'Move "Weekly Sync" to Tuesday to preserve Monday deep-work blocks.',
            'Encourage Slack "Do Not Disturb" during morning hours for the Design team.',
            'Allocate 20% more time to "Internal Tooling" to reduce friction reported by Frontend devs.'
          ].map((suggestion, idx) => (
            <div key={idx} className="flex items-center space-x-2 text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded-lg border border-gray-100 dark:border-gray-800">
              <Badge color="purple" size="xs">{idx + 1}</Badge>
              <Text>{suggestion}</Text>
            </div>
          ))}
        </div>
      </div>
    </Grid>
  </Card>
);

const ScreenshotGrid = () => (
  <div className="mt-6">
    <SectionHeader 
      title="Recent Evidence" 
      description="Randomized automated captures for quality assurance and proof of work."
      icon={EyeIcon}
    />
    <Grid numItemsSm={2} numItemsLg={4} className="gap-4">
      {screenshots.map((s) => (
        <motion.div
          key={s.id}
          whileHover={{ y: -5 }}
          className="group relative"
        >
          <Card className="p-0 overflow-hidden border-none shadow-lg">
            <div className="relative aspect-video overflow-hidden bg-gray-100">
              <img src={s.url} alt={s.app} className="object-cover w-full h-full transition-transform group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Button size="xs" variant="primary" icon={PlayIcon}>View Replay</Button>
              </div>
            </div>
            <div className="p-3">
              <Flex>
                <Text className="font-bold truncate">{s.user}</Text>
                <Badge size="xs" color="blue">{s.app}</Badge>
              </Flex>
              <Text className="text-xs mt-1">{s.time}</Text>
            </div>
          </Card>
        </motion.div>
      ))}
    </Grid>
  </div>
);

const KPICards = () => (
  <Grid numItemsSm={2} numItemsLg={4} className="gap-6">
    {kpiData.map((item, idx) => (
      <motion.div
        key={item.title}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: idx * 0.1 }}
      >
        <Card decoration="top" decorationColor="blue" className="hover:shadow-md transition-shadow">
          <Flex alignItems="start">
            <div>
              <Text className="font-medium text-gray-500 dark:text-gray-400">{item.title}</Text>
              <Title className="mt-1 text-2xl">{item.value}</Title>
            </div>
            <BadgeDelta deltaType={item.deltaType as any}>{item.delta}</BadgeDelta>
          </Flex>
          <Flex className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
            <Flex justifyContent="start" className="space-x-2">
              <Icon icon={item.icon} variant="light" size="sm" color="blue" />
              <Text className="truncate text-xs">Real-time sync active</Text>
            </Flex>
            <Button variant="light" icon={ArrowRightIcon} iconPosition="right" size="xs">
              Details
            </Button>
          </Flex>
        </Card>
      </motion.div>
    ))}
  </Grid>
);

// --- Main Page ---

const LiveEventFeed = () => (
  <Card className="mt-6 h-full">
    <SectionHeader 
      title="Live Event Feed" 
      description="Raw telemetry stream from active nodes."
    />
    <div className="space-y-4 mt-4 h-[400px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-200">
      {[
        { user: 'Sarah Chen', event: 'Started Debugging Session', time: 'Just now', icon: PlayIcon, color: 'emerald' },
        { user: 'Alex Rivera', event: 'Switched to Figma: "Landing Page V2"', time: '2m ago', icon: CursorArrowRaysIcon, color: 'blue' },
        { user: 'Elena Gilbert', event: 'Joined "Product Sync" on Google Meet', time: '5m ago', icon: UsersIcon, color: 'purple' },
        { user: 'System', event: 'Automated Snapshot Captured: Alex Rivera', time: '8m ago', icon: EyeIcon, color: 'gray' },
        { user: 'Marcus Wright', event: 'Idle Timeout Detected', time: '12m ago', icon: ClockIcon, color: 'yellow' },
        { user: 'Sarah Chen', event: 'Git Push: feature/dashboard-api', time: '15m ago', icon: ChartBarIcon, color: 'emerald' },
        { user: 'System', event: 'Daily Backup Completed', time: '1h ago', icon: ShieldCheckIcon, color: 'blue' },
      ].map((item, idx) => (
        <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm transition-all hover:translate-x-1">
          <Icon icon={item.icon} variant="light" color={item.color as any} size="sm" />
          <div className="flex-1 min-w-0">
            <Flex>
              <Text className="font-bold text-xs truncate">{item.user}</Text>
              <Text className="text-[10px] text-gray-400">{item.time}</Text>
            </Flex>
            <Text className="text-sm truncate mt-0.5">{item.event}</Text>
          </div>
        </div>
      ))}
    </div>
    <Button variant="light" className="w-full mt-4" size="xs">View Full Audit Log</Button>
  </Card>
);

export default function Test13Page() {
  const [selectedTab, setSelectedTab] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#09090b] transition-colors duration-300">
      <div className="p-4 md:p-10 mx-auto max-w-7xl">
        <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Badge color="blue" className="mb-2">Enterprise Plan</Badge>
            <Title className="text-4xl font-extrabold tracking-tight">Workforce <span className="text-blue-600">OS</span></Title>
            <Text className="text-lg text-gray-500 dark:text-gray-400">Advanced performance telemetry & behavioral analytics.</Text>
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center space-x-3 bg-white dark:bg-gray-900 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800"
          >
            <div className="hidden md:block px-3 border-r border-gray-100 dark:border-gray-800 mr-2">
              <Text className="text-xs font-bold uppercase tracking-wider text-gray-400">System Status</Text>
              <Flex className="space-x-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <Text className="text-xs font-medium text-emerald-500">Live Telemetry</Text>
              </Flex>
            </div>
            <ThemeToggle />
            <Button size="sm" variant="secondary" className="rounded-xl">Settings</Button>
            <Button size="sm" icon={SparklesIcon} className="rounded-xl shadow-lg shadow-blue-500/20">Ask AI</Button>
          </motion.div>
        </header>

        <TabGroup index={selectedTab} onIndexChange={setSelectedTab}>
          <TabList variant="line" className="mb-8 overflow-x-auto">
            <Tab icon={ComputerDesktopIcon}>Organization Overview</Tab>
            <Tab icon={UsersIcon}>Team Performance</Tab>
            <Tab icon={CursorArrowRaysIcon}>Activity Live Stream</Tab>
            <Tab icon={ShieldCheckIcon}>Security & Compliance</Tab>
          </TabList>

          <AnimatePresence mode="wait">
            <motion.div
              key={selectedTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <TabPanels>
                <TabPanel>
                  <KPICards />
                  
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                    <div className="lg:col-span-2 space-y-6">
                      <Card className="p-6">
                        <SectionHeader 
                          title="Productivity Momentum" 
                          description="Comparison of focused work hours vs. collaborative sessions."
                        />
                        <AreaChart
                          className="h-80 mt-8"
                          data={productivityData}
                          index="date"
                          categories={['Productive Time', 'Neutral Time', 'Distracting Time']}
                          colors={['emerald', 'blue', 'rose']}
                          valueFormatter={(number: number) => `${Intl.NumberFormat('us').format(number).toString()}m`}
                          yAxisWidth={60}
                          showAnimation={true}
                          curveType="monotone"
                        />
                      </Card>
                      
                      <Card>
                        <SectionHeader 
                          title="Team Member Status" 
                          description="Real-time visibility into current focus and activity."
                        />
                        <Table className="mt-6">
                          <TableHead>
                            <TableRow>
                              <TableHeaderCell>Employee</TableHeaderCell>
                              <TableHeaderCell>Status</TableHeaderCell>
                              <TableHeaderCell>Efficiency</TableHeaderCell>
                              <TableHeaderCell>Top Stack</TableHeaderCell>
                              <TableHeaderCell className="text-right">Action</TableHeaderCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {teamData.map((item) => (
                              <TableRow key={item.name}>
                                <TableCell>
                                  <div className="flex items-center space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                      {item.name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div>
                                      <Text className="font-bold">{item.name}</Text>
                                      <Text className="text-xs text-gray-500">{item.role}</Text>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge color={item.status === 'Active' ? 'emerald' : item.status === 'Idle' ? 'yellow' : 'gray'}>
                                    {item.status}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="w-24">
                                    <Flex className="space-x-2">
                                      <ProgressBar value={item.efficiency} color={item.efficiency > 85 ? 'emerald' : 'yellow'} className="mt-0" />
                                      <Text className="text-xs">{item.efficiency}%</Text>
                                    </Flex>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <div className="flex -space-x-1">
                                    {item.apps.slice(0, 2).map((app) => (
                                      <div key={app} className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-[10px] font-medium">
                                        {app}
                                      </div>
                                    ))}
                                    {item.apps.length > 2 && (
                                      <div className="px-2 py-0.5 rounded border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-[10px] text-gray-500">
                                        +{item.apps.length - 2}
                                      </div>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-right">
                                  <Button size="xs" variant="light" icon={ArrowRightIcon} iconPosition="right">Inspect</Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Card>
                    </div>

                    <div className="space-y-6">
                      <Card>
                        <Title>Resource Allocation</Title>
                        <Text className="mb-4">Time by Department</Text>
                        <DonutChart
                          className="h-64 mt-6"
                          data={appDistribution}
                          category="value"
                          index="name"
                          colors={['emerald', 'blue', 'orange', 'rose']}
                          valueFormatter={(number: number) => `${number}m`}
                          showAnimation={true}
                        />
                        <div className="mt-6 space-y-2">
                          {appDistribution.map((item, i) => (
                            <Flex key={item.name} className="text-sm">
                              <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full bg-${['emerald', 'blue', 'orange', 'rose'][i]}-500`} />
                                <Text>{item.name}</Text>
                              </div>
                              <Text className="font-medium">{Math.round((item.value / 8550) * 100)}%</Text>
                            </Flex>
                          ))}
                        </div>
                      </Card>

                      <LiveEventFeed />
                    </div>
                  </div>

                  <AIInsights />

                  <ScreenshotGrid />
                  
                  <Card className="mt-6">
                    <SectionHeader 
                      title="Micro-Activity Tracker" 
                      description="Individual keyboard/mouse event frequency mapped over 15-minute segments."
                    />
                    <Tracker data={trackerData} className="mt-2" />
                    <Flex className="mt-4 border-t border-gray-100 dark:border-gray-800 pt-4">
                      <Text className="text-xs">08:00 AM</Text>
                      <Text className="text-xs">12:00 PM</Text>
                      <Text className="text-xs">04:00 PM</Text>
                      <Text className="text-xs">08:00 PM</Text>
                    </Flex>
                  </Card>
                </TabPanel>

                <TabPanel>
                  <Grid numItemsLg={2} className="gap-6">
                    <Card>
                      <Title>Engagement Matrix</Title>
                      <BarChart
                        className="h-80 mt-6"
                        data={teamData}
                        index="name"
                        categories={['efficiency']}
                        colors={['blue']}
                        yAxisWidth={48}
                      />
                    </Card>
                    <Card>
                      <Title>Weekly Hours Distribution</Title>
                      <AreaChart
                        className="h-80 mt-6"
                        data={productivityData}
                        index="date"
                        categories={['Productive Time']}
                        colors={['emerald']}
                      />
                    </Card>
                  </Grid>
                </TabPanel>

                <TabPanel>
                  <div className="flex items-center justify-center h-[60vh] border-2 border-dashed rounded-3xl border-gray-200 dark:border-gray-800">
                    <div className="text-center">
                      <Icon icon={CursorArrowRaysIcon} size="xl" color="gray" variant="light" />
                      <Title className="mt-4">Live Activity Stream</Title>
                      <Text>Connecting to workforce telemetry nodes...</Text>
                      <ProgressBar value={45} className="mt-6 w-64 mx-auto" color="blue" />
                    </div>
                  </div>
                </TabPanel>

                <TabPanel>
                  <Card>
                    <Title>Security Posture</Title>
                    <Text>Automated threat detection and data exfiltration monitoring.</Text>
                    <Table className="mt-6">
                      <TableHead>
                        <TableRow>
                          <TableHeaderCell>Node</TableHeaderCell>
                          <TableHeaderCell>Detection</TableHeaderCell>
                          <TableHeaderCell>Severity</TableHeaderCell>
                          <TableHeaderCell>Status</TableHeaderCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>US-EAST-WORKSTATION-42</TableCell>
                          <TableCell>Mass file export to external drive</TableCell>
                          <TableCell><Badge color="rose">Critical</Badge></TableCell>
                          <TableCell><Badge color="gray">Isolated</Badge></TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>EU-WEST-LAPTOP-09</TableCell>
                          <TableCell>Sensitive keyword in clipboard</TableCell>
                          <TableCell><Badge color="yellow">Warning</Badge></TableCell>
                          <TableCell><Badge color="emerald">Resolved</Badge></TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Card>
                </TabPanel>
              </TabPanels>
            </motion.div>
          </AnimatePresence>
        </TabGroup>
      </div>
    </div>
  );
}
