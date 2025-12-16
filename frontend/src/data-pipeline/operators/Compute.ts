/**
 * Compute operator for derived columns.
 * 
 * Adds computed/derived columns to Arrow Tables based on expressions.
 */

import { Table, Vector, tableFromArrays } from 'apache-arrow';

export type ComputeFunction = (row: any, rowIndex: number) => any;

export interface ComputeExpression {
  column: string;        // Name for the new column
  expression: string | ComputeFunction;  // Expression or function
  type?: 'number' | 'string' | 'boolean' | 'date';
}

/**
 * Compute operator class.
 */
export class ComputeOperator {
  /**
   * Adds computed column to table.
   * 
   * @param table - Input table
   * @param compute - Compute expression
   * @returns Table with new column
   */
  static apply(table: Table, compute: ComputeExpression): Table {
    const computeFn = typeof compute.expression === 'function'
      ? compute.expression
      : this.parseExpression(compute.expression);

    // Compute values for new column
    const newColumnData: any[] = [];

    for (let i = 0; i < table.numRows; i++) {
      const row = this.tableRowToObject(table, i);
      const value = computeFn(row, i);
      newColumnData.push(value);
    }

    // Create result table with new column
    const resultColumns: Record<string, any[]> = {};

    // Copy existing columns
    table.schema.fields.forEach(field => {
      const column = table.getChild(field.name)!;
      const data: any[] = [];
      for (let i = 0; i < column.length; i++) {
        data.push(column.get(i));
      }
      resultColumns[field.name] = data;
    });

    // Add new column
    resultColumns[compute.column] = newColumnData;

    return tableFromArrays(resultColumns);
  }

  /**
   * Adds multiple computed columns to table.
   */
  static applyMultiple(table: Table, computations: ComputeExpression[]): Table {
    let result = table;

    for (const compute of computations) {
      result = this.apply(result, compute);
    }

    return result;
  }

  /**
   * Converts table row to object for expression evaluation.
   */
  private static tableRowToObject(table: Table, rowIndex: number): any {
    const row: any = {};

    table.schema.fields.forEach(field => {
      const column = table.getChild(field.name)!;
      row[field.name] = column.get(rowIndex);
    });

    return row;
  }

  /**
   * Parses string expression into function.
   * 
   * Supports simple expressions like:
   * - "columnA + columnB"
   * - "columnA * 2"
   * - "columnA > 10 ? 1 : 0"
   * 
   * WARNING: Uses eval() which can be dangerous.
   * In production, use a safe expression parser.
   */
  private static parseExpression(expression: string): ComputeFunction {
    // Extract column names from expression
    const columnPattern = /\b([a-zA-Z_][a-zA-Z0-9_]*)\b/g;
    const columns = new Set<string>();
    let match;

    while ((match = columnPattern.exec(expression)) !== null) {
      const name = match[1];
      // Skip JavaScript keywords
      if (!this.isJavaScriptKeyword(name)) {
        columns.push(name);
      }
    }

    // Build function body
    const columnBindings = Array.from(columns)
      .map(col => `const ${col} = row['${col}'];`)
      .join('\n');

    const functionBody = `
      ${columnBindings}
      return (${expression});
    `;

    // Create function (safer than direct eval)
    return new Function('row', 'rowIndex', functionBody) as ComputeFunction;
  }

  /**
   * Checks if a name is a JavaScript keyword.
   */
  private static isJavaScriptKeyword(name: string): boolean {
    const keywords = new Set([
      'break', 'case', 'catch', 'class', 'const', 'continue', 'debugger',
      'default', 'delete', 'do', 'else', 'export', 'extends', 'false',
      'finally', 'for', 'function', 'if', 'import', 'in', 'instanceof',
      'let', 'new', 'null', 'return', 'super', 'switch', 'this', 'throw',
      'true', 'try', 'typeof', 'var', 'void', 'while', 'with', 'yield',
      'Math', 'Date', 'String', 'Number', 'Boolean', 'Array', 'Object',
      'JSON', 'parseInt', 'parseFloat', 'isNaN', 'isFinite', 'undefined'
    ]);

    return keywords.has(name);
  }

  /**
   * Safe expression parser (alternative to eval-based approach).
   * 
   * Supports basic arithmetic and comparisons only.
   */
  static parseSafeExpression(expression: string): ComputeFunction {
    // This is a placeholder for a safe expression parser
    // In production, use a library like:
    // - mathjs
    // - expr-eval
    // - jsep + custom evaluator
    
    throw new Error(
      'Safe expression parsing not yet implemented. ' +
      'Use function-based compute expressions or install expr-eval library.'
    );
  }

  /**
   * Built-in compute functions.
   */
  static readonly builtins = {
    /**
     * Concatenates string columns.
     */
    concat: (...columns: string[]) => (row: any) => {
      return columns.map(col => row[col]).join('');
    },

    /**
     * Conditional (if-then-else).
     */
    ifThenElse: (condition: ComputeFunction, thenValue: any, elseValue: any) => (row: any, index: number) => {
      return condition(row, index) ? thenValue : elseValue;
    },

    /**
     * Coalesce (returns first non-null value).
     */
    coalesce: (...columns: string[]) => (row: any) => {
      for (const col of columns) {
        const value = row[col];
        if (value !== null && value !== undefined) {
          return value;
        }
      }
      return null;
    },

    /**
     * Rounds number to N decimal places.
     */
    round: (column: string, decimals: number = 0) => (row: any) => {
      const value = row[column];
      if (typeof value !== 'number') return null;
      const multiplier = Math.pow(10, decimals);
      return Math.round(value * multiplier) / multiplier;
    },

    /**
     * Extracts year from date.
     */
    year: (column: string) => (row: any) => {
      const value = row[column];
      if (value instanceof Date) {
        return value.getFullYear();
      }
      if (typeof value === 'string') {
        return new Date(value).getFullYear();
      }
      return null;
    },

    /**
     * Extracts month from date.
     */
    month: (column: string) => (row: any) => {
      const value = row[column];
      if (value instanceof Date) {
        return value.getMonth() + 1; // 1-based
      }
      if (typeof value === 'string') {
        return new Date(value).getMonth() + 1;
      }
      return null;
    },

    /**
     * String length.
     */
    length: (column: string) => (row: any) => {
      const value = row[column];
      return value ? String(value).length : 0;
    },

    /**
     * Substring.
     */
    substring: (column: string, start: number, length?: number) => (row: any) => {
      const value = row[column];
      if (!value) return null;
      return String(value).substring(start, length !== undefined ? start + length : undefined);
    },

    /**
     * Lowercase.
     */
    lower: (column: string) => (row: any) => {
      const value = row[column];
      return value ? String(value).toLowerCase() : null;
    },

    /**
     * Uppercase.
     */
    upper: (column: string) => (row: any) => {
      const value = row[column];
      return value ? String(value).toUpperCase() : null;
    },
  };
}

