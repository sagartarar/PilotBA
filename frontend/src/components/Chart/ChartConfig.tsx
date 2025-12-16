import React, { useMemo } from 'react';
import { clsx } from 'clsx';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select, SelectOption } from '../common/Select';
import { ChartType, ChartConfig, ChartEncoding, useChartStore } from '../../store/chartStore';
import { ColumnInfo } from '../../store/dataStore';

export interface ChartConfigPanelProps {
  config: ChartConfig;
  columns: ColumnInfo[];
  onUpdate: (config: Partial<ChartConfig>) => void;
  className?: string;
}

const chartTypeOptions: SelectOption[] = [
  { value: 'scatter', label: 'Scatter Plot' },
  { value: 'bar', label: 'Bar Chart' },
  { value: 'line', label: 'Line Chart' },
  { value: 'heatmap', label: 'Heatmap' },
];

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = ({
  config,
  columns,
  onUpdate,
  className,
}) => {
  const columnOptions = useMemo<SelectOption[]>(() => {
    return columns.map((col) => ({
      value: col.name,
      label: `${col.name} (${col.type})`,
    }));
  }, [columns]);

  const numericColumns = useMemo<SelectOption[]>(() => {
    return columns
      .filter((col) => col.type.includes('Int') || col.type.includes('Float'))
      .map((col) => ({
        value: col.name,
        label: `${col.name} (${col.type})`,
      }));
  }, [columns]);

  const handleEncodingChange = (key: keyof ChartEncoding, value: string) => {
    onUpdate({
      encoding: {
        ...config.encoding,
        [key]: value || undefined,
      },
    });
  };

  return (
    <div className={clsx('space-y-6', className)}>
      {/* Chart Type */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Chart Type</h3>
        <div className="grid grid-cols-2 gap-2">
          {chartTypeOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => onUpdate({ type: option.value as ChartType })}
              className={clsx(
                'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors',
                config.type === option.value
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <ChartTypeIcon type={option.value as ChartType} />
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <Input
          label="Chart Title"
          value={config.title}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Enter chart title..."
        />
      </div>

      {/* Encodings */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Data Mapping</h3>
        <div className="space-y-3">
          <Select
            label="X Axis"
            options={columnOptions}
            value={config.encoding.x}
            onChange={(value) => handleEncodingChange('x', value)}
            placeholder="Select column..."
          />
          <Select
            label="Y Axis"
            options={numericColumns}
            value={config.encoding.y}
            onChange={(value) => handleEncodingChange('y', value)}
            placeholder="Select column..."
          />
          
          {(config.type === 'scatter' || config.type === 'heatmap') && (
            <Select
              label="Color"
              options={[{ value: '', label: 'None' }, ...numericColumns]}
              value={config.encoding.color || ''}
              onChange={(value) => handleEncodingChange('color', value)}
            />
          )}
          
          {config.type === 'scatter' && (
            <Select
              label="Size"
              options={[{ value: '', label: 'None' }, ...numericColumns]}
              value={config.encoding.size || ''}
              onChange={(value) => handleEncodingChange('size', value)}
            />
          )}
        </div>
      </div>

      {/* Options */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Options</h3>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.options.showGrid}
              onChange={(e) => onUpdate({ options: { ...config.options, showGrid: e.target.checked } })}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Show Grid</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.options.showLegend}
              onChange={(e) => onUpdate({ options: { ...config.options, showLegend: e.target.checked } })}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Show Legend</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.options.showTooltip}
              onChange={(e) => onUpdate({ options: { ...config.options, showTooltip: e.target.checked } })}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Show Tooltip</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.options.animate}
              onChange={(e) => onUpdate({ options: { ...config.options, animate: e.target.checked } })}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Animate</span>
          </label>
        </div>
      </div>

      {/* Opacity slider */}
      <div>
        <label className="block text-sm font-medium text-foreground mb-2">
          Opacity: {Math.round(config.options.opacity * 100)}%
        </label>
        <input
          type="range"
          min="0"
          max="100"
          value={config.options.opacity * 100}
          onChange={(e) => onUpdate({ options: { ...config.options, opacity: Number(e.target.value) / 100 } })}
          className="w-full"
        />
      </div>

      {/* Point size for scatter */}
      {config.type === 'scatter' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Point Size: {config.options.pointSize}px
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={config.options.pointSize || 6}
            onChange={(e) => onUpdate({ options: { ...config.options, pointSize: Number(e.target.value) } })}
            className="w-full"
          />
        </div>
      )}

      {/* Line width for line chart */}
      {config.type === 'line' && (
        <div>
          <label className="block text-sm font-medium text-foreground mb-2">
            Line Width: {config.options.lineWidth}px
          </label>
          <input
            type="range"
            min="1"
            max="10"
            value={config.options.lineWidth || 2}
            onChange={(e) => onUpdate({ options: { ...config.options, lineWidth: Number(e.target.value) } })}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
};

// Chart type icons
const ChartTypeIcon: React.FC<{ type: ChartType }> = ({ type }) => {
  switch (type) {
    case 'scatter':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7.5" cy="7.5" r="1.5"/><circle cx="18.5" cy="5.5" r="1.5"/><circle cx="11.5" cy="11.5" r="1.5"/><circle cx="7.5" cy="16.5" r="1.5"/><circle cx="17.5" cy="14.5" r="1.5"/>
        </svg>
      );
    case 'bar':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/>
        </svg>
      );
    case 'line':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
        </svg>
      );
    case 'heatmap':
      return (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/>
        </svg>
      );
  }
};

// Quick chart creation component
export interface QuickChartCreatorProps {
  datasetId: string;
  columns: ColumnInfo[];
  onCreateChart: (config: Omit<ChartConfig, 'id'>) => void;
  className?: string;
}

export const QuickChartCreator: React.FC<QuickChartCreatorProps> = ({
  datasetId,
  columns,
  onCreateChart,
  className,
}) => {
  const numericColumns = columns.filter(
    (col) => col.type.includes('Int') || col.type.includes('Float')
  );

  if (numericColumns.length < 2) {
    return (
      <div className={clsx('p-4 text-center text-muted-foreground', className)}>
        Need at least 2 numeric columns to create a chart
      </div>
    );
  }

  const handleQuickCreate = (type: ChartType) => {
    const xCol = columns[0].name;
    const yCol = numericColumns[0].name;

    onCreateChart({
      type,
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
      datasetId,
      encoding: {
        x: xCol,
        y: yCol,
      },
      options: {
        showGrid: true,
        showLegend: true,
        showTooltip: true,
        showAxes: true,
        animate: true,
        colorScheme: 'default',
        opacity: 0.8,
        pointSize: 6,
        lineWidth: 2,
      },
    });
  };

  return (
    <div className={clsx('space-y-4', className)}>
      <h3 className="text-sm font-semibold text-foreground">Quick Create</h3>
      <div className="grid grid-cols-2 gap-2">
        {chartTypeOptions.map((option) => (
          <Button
            key={option.value}
            variant="outline"
            size="sm"
            onClick={() => handleQuickCreate(option.value as ChartType)}
            className="justify-start"
          >
            <ChartTypeIcon type={option.value as ChartType} />
            {option.label}
          </Button>
        ))}
      </div>
    </div>
  );
};

