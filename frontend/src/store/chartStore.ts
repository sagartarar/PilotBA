import { create } from 'zustand';

export type ChartType = 'scatter' | 'bar' | 'line' | 'heatmap';

export interface ChartEncoding {
  x: string;
  y: string;
  color?: string;
  size?: string;
  label?: string;
}

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  datasetId: string;
  encoding: ChartEncoding;
  filters?: FilterConfig[];
  aggregation?: AggregationConfig;
  options: ChartOptions;
}

export interface FilterConfig {
  column: string;
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'contains' | 'between';
  value: unknown;
  value2?: unknown; // For 'between' operator
}

export interface AggregationConfig {
  groupBy: string[];
  measures: {
    column: string;
    function: 'sum' | 'avg' | 'min' | 'max' | 'count';
    alias?: string;
  }[];
}

export interface ChartOptions {
  showGrid: boolean;
  showLegend: boolean;
  showTooltip: boolean;
  showAxes: boolean;
  animate: boolean;
  colorScheme: string;
  opacity: number;
  pointSize?: number;
  lineWidth?: number;
}

interface ChartState {
  charts: Map<string, ChartConfig>;
  activeChartId: string | null;
}

interface ChartActions {
  addChart: (config: Omit<ChartConfig, 'id'>) => string;
  updateChart: (id: string, config: Partial<ChartConfig>) => void;
  removeChart: (id: string) => void;
  setActiveChart: (id: string | null) => void;
  getChart: (id: string) => ChartConfig | null;
  getActiveChart: () => ChartConfig | null;
  duplicateChart: (id: string) => string | null;
  clearCharts: () => void;
}

type ChartStore = ChartState & ChartActions;

function generateChartId(): string {
  return `chart_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

const defaultOptions: ChartOptions = {
  showGrid: true,
  showLegend: true,
  showTooltip: true,
  showAxes: true,
  animate: true,
  colorScheme: 'default',
  opacity: 0.8,
  pointSize: 6,
  lineWidth: 2,
};

export const useChartStore = create<ChartStore>((set, get) => ({
  charts: new Map(),
  activeChartId: null,

  addChart: (config) => {
    const id = generateChartId();
    const fullConfig: ChartConfig = {
      ...config,
      id,
      options: { ...defaultOptions, ...config.options },
    };

    const { charts } = get();
    const newCharts = new Map(charts);
    newCharts.set(id, fullConfig);

    set({ charts: newCharts, activeChartId: id });
    return id;
  },

  updateChart: (id, config) => {
    const { charts } = get();
    const existingChart = charts.get(id);
    if (!existingChart) return;

    const updatedChart: ChartConfig = {
      ...existingChart,
      ...config,
      options: { ...existingChart.options, ...config.options },
    };

    const newCharts = new Map(charts);
    newCharts.set(id, updatedChart);
    set({ charts: newCharts });
  },

  removeChart: (id) => {
    const { charts, activeChartId } = get();
    const newCharts = new Map(charts);
    newCharts.delete(id);

    set({
      charts: newCharts,
      activeChartId: activeChartId === id ? null : activeChartId,
    });
  },

  setActiveChart: (id) => {
    set({ activeChartId: id });
  },

  getChart: (id) => {
    return get().charts.get(id) || null;
  },

  getActiveChart: () => {
    const { charts, activeChartId } = get();
    return activeChartId ? charts.get(activeChartId) || null : null;
  },

  duplicateChart: (id) => {
    const { charts } = get();
    const original = charts.get(id);
    if (!original) return null;

    const newId = generateChartId();
    const duplicate: ChartConfig = {
      ...original,
      id: newId,
      title: `${original.title} (Copy)`,
    };

    const newCharts = new Map(charts);
    newCharts.set(newId, duplicate);
    set({ charts: newCharts, activeChartId: newId });
    return newId;
  },

  clearCharts: () => {
    set({ charts: new Map(), activeChartId: null });
  },
}));

