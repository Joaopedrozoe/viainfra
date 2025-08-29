
import { Agent } from "@/types/agent";
import { mockAgents } from "../mockData";

// Memoization cache to avoid redundant calculations
let metricsCache: any = null;
let chartDataCache: any = null;
let lastCalcTimestamp = 0;
const CACHE_TTL = 30000; // 30 seconds TTL for cache

// Consolidate agent metrics with caching
export const consolidateAgentMetrics = () => {
  const now = Date.now();
  
  // Return cached results if valid
  if (metricsCache && now - lastCalcTimestamp < CACHE_TTL) {
    return metricsCache;
  }
  
  // Calculate metrics only if cache is invalid
  const totalConversations = mockAgents.reduce((sum, agent) => sum + agent.metrics.conversations, 0);
  const averageSuccessRate = mockAgents.reduce((sum, agent) => sum + agent.metrics.successRate, 0) / mockAgents.length;
  const totalHumanTransfers = mockAgents.reduce((sum, agent) => sum + agent.metrics.humanTransfers, 0);
  
  // Count agents by status
  const statusCounts = mockAgents.reduce((acc, agent) => {
    acc[agent.status] = (acc[agent.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count agents by function
  const functionCounts = mockAgents.reduce((acc, agent) => {
    acc[agent.function] = (acc[agent.function] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  // Count conversations by channel - optimized to reduce iterations
  const channelCounts: Record<string, number> = {};
  mockAgents.forEach(agent => {
    const conversationsPerChannel = agent.metrics.conversations / agent.channels.length;
    agent.channels.forEach(channel => {
      channelCounts[channel] = (channelCounts[channel] || 0) + conversationsPerChannel;
    });
  });

  // Agent conversation distribution - optimized with single pass
  const agentConversationCounts = mockAgents.map(agent => ({
    name: agent.name.length > 15 ? agent.name.substring(0, 15) + '...' : agent.name,
    fullName: agent.name, // Store full name for tooltips
    value: agent.metrics.conversations
  }));
  
  // Update cache
  metricsCache = {
    totalConversations,
    averageSuccessRate,
    totalHumanTransfers,
    humanTransferRate: (totalHumanTransfers / totalConversations) * 100,
    statusCounts,
    functionCounts,
    channelCounts,
    agentConversationCounts
  };
  
  lastCalcTimestamp = now;
  return metricsCache;
};

// Prepare data for charts - with caching
export const prepareChartData = () => {
  const now = Date.now();
  
  // Return cached results if valid
  if (chartDataCache && now - lastCalcTimestamp < CACHE_TTL) {
    return chartDataCache;
  }
  
  const metrics = consolidateAgentMetrics();
  
  const statusData = Object.entries(metrics.statusCounts).map(([name, value]) => ({
    name,
    value: value as number // Explicitly cast to number to fix the type error
  }));
  
  const functionData = Object.entries(metrics.functionCounts).map(([name, value]) => ({
    name,
    value: value as number // Explicitly cast to number to fix the type error
  }));
  
  const channelData = Object.entries(metrics.channelCounts).map(([name, value]) => ({
    name,
    value: Math.round(value as number) // Explicitly cast to number to fix the type error
  }));

  // Agent activation data (conversations by agent)
  const agentActivationData = metrics.agentConversationCounts;
  
  // Example performance trend data - in a real app, this would come from historical data
  const performanceTrendData = [
    { name: 'Seg', successRate: 75, humanTransfers: 12 },
    { name: 'Ter', successRate: 78, humanTransfers: 10 },
    { name: 'Qua', successRate: 82, humanTransfers: 8 },
    { name: 'Qui', successRate: 79, humanTransfers: 9 },
    { name: 'Sex', successRate: 85, humanTransfers: 7 },
    { name: 'Sáb', successRate: 80, humanTransfers: 8 },
    { name: 'Dom', successRate: 76, humanTransfers: 11 },
  ];
  
  // Example agent comparison data - optimize by limiting data points
  const agentComparisonData = mockAgents.map(agent => ({
    name: agent.name.length > 10 ? agent.name.substring(0, 10) + '...' : agent.name,
    fullName: agent.name, // Store full name for tooltips
    successRate: agent.metrics.successRate,
    conversations: agent.metrics.conversations
  }));

  // Update cache
  chartDataCache = {
    statusData,
    functionData,
    channelData,
    agentActivationData,
    performanceTrendData,
    agentComparisonData
  };
  
  lastCalcTimestamp = now;
  return chartDataCache;
};

// Colors for charts - updated with better contrast
export const CHART_COLORS = [
  '#9b87f5', '#7E69AB', '#F97316', '#0EA5E9', '#D946EF', 
  '#B10B28', '#33C3F0', '#0FA0CE', '#D6BCFA', '#6E59A5'
];
