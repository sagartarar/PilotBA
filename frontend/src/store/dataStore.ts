import { create } from 'zustand';
import { Table } from 'apache-arrow';
import { DataLoader } from '../data-pipeline/DataLoader';

export interface DatasetMetadata {
  id: string;
  name: string;
  rowCount: number;
  columnCount: number;
  columns: ColumnInfo[];
  sizeBytes: number;
  uploadedAt: Date;
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  distinctCount?: number;
  nullCount?: number;
  min?: number | string;
  max?: number | string;
}

interface DataState {
  tables: Map<string, Table>;
  metadata: Map<string, DatasetMetadata>;
  currentTableId: string | null;
  isLoading: boolean;
  error: string | null;
  uploadProgress: number;
}

interface DataActions {
  uploadFile: (file: File) => Promise<string>;
  deleteTable: (id: string) => void;
  setCurrentTable: (id: string | null) => void;
  getCurrentTable: () => Table | null;
  getCurrentMetadata: () => DatasetMetadata | null;
  getTableById: (id: string) => Table | null;
  clearError: () => void;
}

type DataStore = DataState & DataActions;

const dataLoader = new DataLoader();

function generateId(): string {
  return `dataset_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function inferColumnInfo(table: Table): ColumnInfo[] {
  return table.schema.fields.map((field) => {
    const column = table.getChild(field.name);
    let nullCount = 0;
    const distinctValues = new Set<unknown>();

    if (column) {
      for (let i = 0; i < column.length; i++) {
        const value = column.get(i);
        if (value === null || value === undefined) {
          nullCount++;
        } else {
          distinctValues.add(value);
        }
      }
    }

    return {
      name: field.name,
      type: field.type.toString(),
      nullable: field.nullable,
      distinctCount: distinctValues.size,
      nullCount,
    };
  });
}

export const useDataStore = create<DataStore>((set, get) => ({
  tables: new Map(),
  metadata: new Map(),
  currentTableId: null,
  isLoading: false,
  error: null,
  uploadProgress: 0,

  uploadFile: async (file: File) => {
    const id = generateId();
    set({ isLoading: true, error: null, uploadProgress: 0 });

    try {
      const text = await file.text();
      set({ uploadProgress: 30 });

      let table: Table;
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith('.csv')) {
        table = await dataLoader.load({ type: 'csv', data: text });
      } else if (fileName.endsWith('.json')) {
        const jsonData = JSON.parse(text);
        const dataArray = Array.isArray(jsonData) ? jsonData : [jsonData];
        table = await dataLoader.load({ type: 'json', data: dataArray });
      } else {
        throw new Error('Unsupported file format. Please upload CSV or JSON files.');
      }

      set({ uploadProgress: 70 });

      const columns = inferColumnInfo(table);

      const metadata: DatasetMetadata = {
        id,
        name: file.name,
        rowCount: table.numRows,
        columnCount: table.numCols,
        columns,
        sizeBytes: file.size,
        uploadedAt: new Date(),
      };

      set({ uploadProgress: 90 });

      const { tables, metadata: metadataMap } = get();
      const newTables = new Map(tables);
      const newMetadata = new Map(metadataMap);
      newTables.set(id, table);
      newMetadata.set(id, metadata);

      set({
        tables: newTables,
        metadata: newMetadata,
        currentTableId: id,
        isLoading: false,
        uploadProgress: 100,
      });

      return id;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload file';
      set({ isLoading: false, error: message, uploadProgress: 0 });
      throw error;
    }
  },

  deleteTable: (id: string) => {
    const { tables, metadata, currentTableId } = get();
    const newTables = new Map(tables);
    const newMetadata = new Map(metadata);
    newTables.delete(id);
    newMetadata.delete(id);

    set({
      tables: newTables,
      metadata: newMetadata,
      currentTableId: currentTableId === id ? null : currentTableId,
    });
  },

  setCurrentTable: (id: string | null) => {
    set({ currentTableId: id });
  },

  getCurrentTable: () => {
    const { tables, currentTableId } = get();
    return currentTableId ? tables.get(currentTableId) || null : null;
  },

  getCurrentMetadata: () => {
    const { metadata, currentTableId } = get();
    return currentTableId ? metadata.get(currentTableId) || null : null;
  },

  getTableById: (id: string) => {
    return get().tables.get(id) || null;
  },

  clearError: () => {
    set({ error: null });
  },
}));

