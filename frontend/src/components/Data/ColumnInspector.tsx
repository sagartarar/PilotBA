import React, { useState, useMemo } from 'react';
import type { Table, Vector } from 'apache-arrow';
import { clsx } from 'clsx';
import { ColumnInfo } from '../../store/dataStore';
import { Statistics } from '../../data-pipeline/utils/Statistics';

interface ColumnInspectorProps {
  table: Table;
  columns: ColumnInfo[];
}

export const ColumnInspector: React.FC<ColumnInspectorProps> = ({ table, columns }) => {
  const [selectedColumn, setSelectedColumn] = useState<string | null>(
    columns.length > 0 ? columns[0].name : null
  );
  const [searchQuery, setSearchQuery] = useState('');

  const filteredColumns = useMemo(() => {
    if (!searchQuery.trim()) return columns;
    const query = searchQuery.toLowerCase();
    return columns.filter((c) => c.name.toLowerCase().includes(query));
  }, [columns, searchQuery]);

  const selectedColumnInfo = columns.find((c) => c.name === selectedColumn);
  const selectedVector = selectedColumn ? table.getChild(selectedColumn) : null;

  // Compute detailed statistics for selected column
  const detailedStats = useMemo(() => {
    if (!selectedVector) return null;
    return Statistics.computeColumnStats(selectedVector, true, true);
  }, [selectedVector]);

  // Compute histogram or value counts based on column type
  const distribution = useMemo(() => {
    if (!selectedVector || !selectedColumnInfo) return null;

    const isNumeric = ['Int', 'Float', 'Decimal'].some((t) =>
      selectedColumnInfo.type.includes(t)
    );

    if (isNumeric) {
      return {
        type: 'histogram' as const,
        data: Statistics.computeHistogram(selectedVector, 20),
      };
    } else {
      const valueCounts = Statistics.computeValueCounts(selectedVector, 10);
      return {
        type: 'categorical' as const,
        data: Array.from(valueCounts.entries()).map(([key, count]) => ({
          value: JSON.parse(key),
          count,
        })),
      };
    }
  }, [selectedVector, selectedColumnInfo]);

  return (
    <div className="flex h-full gap-4">
      {/* Column List */}
      <div className="w-64 flex-shrink-0 bg-card border border-border rounded-lg overflow-hidden flex flex-col">
        <div className="p-3 border-b border-border">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search columns..."
            className="w-full px-3 py-1.5 text-sm rounded-md border border-border bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredColumns.map((col) => (
            <button
              key={col.name}
              onClick={() => setSelectedColumn(col.name)}
              className={clsx(
                'w-full px-3 py-2 text-left text-sm border-b border-border/50 transition-colors',
                selectedColumn === col.name
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent'
              )}
            >
              <div className="font-medium truncate">{col.name}</div>
              <div
                className={clsx(
                  'text-xs mt-0.5',
                  selectedColumn === col.name
                    ? 'text-primary-foreground/70'
                    : 'text-muted-foreground'
                )}
              >
                {formatType(col.type)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Column Details */}
      <div className="flex-1 overflow-y-auto">
        {selectedColumnInfo && selectedVector && detailedStats ? (
          <div className="space-y-4">
            {/* Header */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">
                    {selectedColumnInfo.name}
                  </h2>
                  <div className="flex items-center gap-3 mt-1">
                    <TypeBadge type={selectedColumnInfo.type} />
                    {selectedColumnInfo.nullable && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                        Nullable
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <StatBox label="Total Values" value={selectedVector.length.toLocaleString()} />
              <StatBox
                label="Non-Null"
                value={(selectedVector.length - detailedStats.nullCount).toLocaleString()}
              />
              <StatBox label="Null Count" value={detailedStats.nullCount.toLocaleString()} />
              <StatBox
                label="Distinct"
                value={detailedStats.distinctCount?.toLocaleString() || 'N/A'}
              />
            </div>

            {/* Numeric Stats (if applicable) */}
            {detailedStats.mean !== undefined && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">Numeric Statistics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <div className="text-xs text-muted-foreground">Min</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatNumber(detailedStats.min)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Max</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatNumber(detailedStats.max)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Mean</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatNumber(detailedStats.mean)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Median</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatNumber(detailedStats.median)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Std Dev</div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatNumber(detailedStats.stddev)}
                    </div>
                  </div>
                  {detailedStats.quartiles && (
                    <>
                      <div>
                        <div className="text-xs text-muted-foreground">Q1 (25%)</div>
                        <div className="text-lg font-semibold text-foreground">
                          {formatNumber(detailedStats.quartiles[0])}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Q2 (50%)</div>
                        <div className="text-lg font-semibold text-foreground">
                          {formatNumber(detailedStats.quartiles[1])}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Q3 (75%)</div>
                        <div className="text-lg font-semibold text-foreground">
                          {formatNumber(detailedStats.quartiles[2])}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Distribution */}
            {distribution && (
              <div className="bg-card border border-border rounded-lg p-4">
                <h3 className="font-semibold text-foreground mb-3">
                  {distribution.type === 'histogram' ? 'Distribution' : 'Top Values'}
                </h3>
                {distribution.type === 'histogram' ? (
                  <HistogramChart data={distribution.data} />
                ) : (
                  <ValueCountsChart data={distribution.data} total={selectedVector.length} />
                )}
              </div>
            )}

            {/* Sample Values */}
            <div className="bg-card border border-border rounded-lg p-4">
              <h3 className="font-semibold text-foreground mb-3">Sample Values</h3>
              <SampleValues vector={selectedVector} />
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-muted-foreground">
            Select a column to view details
          </div>
        )}
      </div>
    </div>
  );
};

// Helper components
const StatBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-card border border-border rounded-lg p-3">
    <div className="text-xs text-muted-foreground">{label}</div>
    <div className="text-lg font-semibold text-foreground">{value}</div>
  </div>
);

const TypeBadge: React.FC<{ type: string }> = ({ type }) => {
  const formattedType = formatType(type);
  const colorClass = getTypeColor(type);

  return (
    <span className={clsx('text-xs px-2 py-0.5 rounded font-medium', colorClass)}>
      {formattedType}
    </span>
  );
};

const HistogramChart: React.FC<{ data: { bins: number[]; counts: number[] } }> = ({ data }) => {
  const maxCount = Math.max(...data.counts, 1);

  if (data.bins.length === 0) {
    return <div className="text-sm text-muted-foreground">No numeric data available</div>;
  }

  return (
    <div className="space-y-1">
      {data.counts.map((count, i) => {
        const percentage = (count / maxCount) * 100;
        const rangeStart = data.bins[i];
        const rangeEnd = data.bins[i + 1];

        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-24 text-xs text-muted-foreground text-right truncate">
              {formatNumber(rangeStart)} - {formatNumber(rangeEnd)}
            </div>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-16 text-xs text-muted-foreground">{count.toLocaleString()}</div>
          </div>
        );
      })}
    </div>
  );
};

const ValueCountsChart: React.FC<{
  data: Array<{ value: unknown; count: number }>;
  total: number;
}> = ({ data, total }) => {
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  if (data.length === 0) {
    return <div className="text-sm text-muted-foreground">No data available</div>;
  }

  return (
    <div className="space-y-2">
      {data.map((item, i) => {
        const percentage = (item.count / maxCount) * 100;
        const percentOfTotal = ((item.count / total) * 100).toFixed(1);

        return (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div className="w-32 truncate text-foreground font-medium" title={String(item.value)}>
              {item.value === null ? (
                <span className="text-muted-foreground italic">null</span>
              ) : (
                String(item.value)
              )}
            </div>
            <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
              <div
                className="h-full bg-primary transition-all"
                style={{ width: `${percentage}%` }}
              />
            </div>
            <div className="w-20 text-xs text-muted-foreground text-right">
              {item.count.toLocaleString()} ({percentOfTotal}%)
            </div>
          </div>
        );
      })}
    </div>
  );
};

const SampleValues: React.FC<{ vector: Vector }> = ({ vector }) => {
  const samples = useMemo(() => {
    const result: Array<{ index: number; value: unknown }> = [];
    const sampleCount = Math.min(10, vector.length);

    // Get evenly distributed samples
    for (let i = 0; i < sampleCount; i++) {
      const index = Math.floor((i / sampleCount) * vector.length);
      result.push({ index, value: vector.get(index) });
    }

    return result;
  }, [vector]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
      {samples.map(({ index, value }) => (
        <div key={index} className="p-2 bg-muted/50 rounded text-sm">
          <div className="text-xs text-muted-foreground mb-1">Row {index}</div>
          <div className="font-mono text-foreground truncate" title={String(value)}>
            {value === null ? (
              <span className="text-muted-foreground italic">null</span>
            ) : (
              String(value)
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Utility functions
function formatType(type: string): string {
  // Clean up Arrow type string
  return type
    .replace(/</g, '')
    .replace(/>/g, '')
    .replace(/,.*$/, '')
    .replace('Utf8', 'String')
    .replace('Float64', 'Float')
    .replace('Int64', 'Integer')
    .replace('Int32', 'Integer')
    .replace('Bool', 'Boolean');
}

function getTypeColor(type: string): string {
  if (type.includes('Int') || type.includes('Float') || type.includes('Decimal')) {
    return 'bg-blue-500/10 text-blue-500';
  }
  if (type.includes('Utf8') || type.includes('String')) {
    return 'bg-green-500/10 text-green-500';
  }
  if (type.includes('Date') || type.includes('Timestamp')) {
    return 'bg-purple-500/10 text-purple-500';
  }
  if (type.includes('Bool')) {
    return 'bg-yellow-500/10 text-yellow-500';
  }
  return 'bg-gray-500/10 text-gray-500';
}

function formatNumber(value: unknown): string {
  if (value === null || value === undefined) return 'N/A';
  if (typeof value !== 'number') return String(value);
  if (Number.isInteger(value)) return value.toLocaleString();
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

