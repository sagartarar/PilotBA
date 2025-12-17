// Type declarations for apache-arrow
// This file provides type definitions for the apache-arrow module

declare module 'apache-arrow' {
  export class Table<T extends Record<string, unknown> = Record<string, unknown>> {
    readonly numRows: number;
    readonly numCols: number;
    readonly schema: Schema;
    
    constructor(data?: Record<string, unknown>[] | Record<string, Vector> | Schema, columns?: Vector[]);
    
    get(index: number): T | null;
    getChild(name: string): Vector | null;
    getChildAt(index: number): Vector | null;
    select(...columnNames: string[]): Table<T>;
    selectAt(...columnIndices: number[]): Table<T>;
    slice(begin?: number, end?: number): Table<T>;
    concat(...others: Table<T>[]): Table<T>;
    toArray(): T[];
    [Symbol.iterator](): IterableIterator<T>;
    
    static from<T extends Record<string, unknown> = Record<string, unknown>>(
      input: Record<string, unknown>[] | Iterable<T> | AsyncIterable<T>
    ): Table<T>;
    
    static empty<T extends Record<string, unknown> = Record<string, unknown>>(
      schema?: Schema
    ): Table<T>;
    
    static new<T extends Record<string, unknown> = Record<string, unknown>>(
      ...columns: [string, Vector][]
    ): Table<T>;
    
    serialize(format?: 'stream' | 'file'): Uint8Array;
  }

  export class Vector<T = unknown> {
    readonly length: number;
    readonly data: Data<T>;
    readonly type: DataType;
    readonly nullCount: number;
    
    get(index: number): T | null;
    set(index: number, value: T): void;
    indexOf(value: T): number;
    includes(value: T): boolean;
    slice(begin?: number, end?: number): Vector<T>;
    concat(...others: Vector<T>[]): Vector<T>;
    toArray(): T[];
    toJSON(): T[];
    [Symbol.iterator](): IterableIterator<T | null>;
    
    isValid(index: number): boolean;
    
    static from<T>(input: Iterable<T | null> | ArrayLike<T | null>): Vector<T>;
  }

  export class Schema {
    readonly fields: Field[];
    readonly metadata: Map<string, string>;
    readonly names: string[];
    
    constructor(fields: Field[], metadata?: Map<string, string> | null);
    
    select(...columnNames: string[]): Schema;
    selectAt(...columnIndices: number[]): Schema;
    toJSON(): Record<string, unknown>;
    toString(): string;
  }

  export class Field<T extends DataType = DataType> {
    readonly name: string;
    readonly type: T;
    readonly nullable: boolean;
    readonly metadata: Map<string, string>;
    
    constructor(name: string, type: T, nullable?: boolean, metadata?: Map<string, string> | null);
    
    toString(): string;
  }

  export abstract class DataType<TType extends Type = Type> {
    readonly typeId: TType;
    readonly ArrayType: ArrayBufferViewConstructor;
    
    static isNull(x: unknown): x is Null;
    static isInt(x: unknown): x is Int_;
    static isFloat(x: unknown): x is Float;
    static isBinary(x: unknown): x is Binary;
    static isUtf8(x: unknown): x is Utf8;
    static isBool(x: unknown): x is Bool;
    static isDecimal(x: unknown): x is Decimal;
    static isDate(x: unknown): x is Date_;
    static isTime(x: unknown): x is Time_;
    static isTimestamp(x: unknown): x is Timestamp_;
    static isInterval(x: unknown): x is Interval_;
    static isList(x: unknown): x is List;
    static isStruct(x: unknown): x is Struct;
    static isUnion(x: unknown): x is Union_;
    static isFixedSizeBinary(x: unknown): x is FixedSizeBinary;
    static isFixedSizeList(x: unknown): x is FixedSizeList;
    static isMap(x: unknown): x is Map_;
    static isDictionary(x: unknown): x is Dictionary;
  }

  export class Data<T = unknown> {
    readonly type: DataType;
    readonly length: number;
    readonly offset: number;
    readonly stride: number;
    readonly nullCount: number;
    readonly values: ArrayBufferView;
    readonly nullBitmap: Uint8Array | null;
  }

  // Primitive types
  export class Null extends DataType<Type.Null> {}
  export class Bool extends DataType<Type.Bool> {}
  export class Int8 extends DataType<Type.Int> {}
  export class Int16 extends DataType<Type.Int> {}
  export class Int32 extends DataType<Type.Int> {}
  export class Int64 extends DataType<Type.Int> {}
  export class Uint8 extends DataType<Type.Int> {}
  export class Uint16 extends DataType<Type.Int> {}
  export class Uint32 extends DataType<Type.Int> {}
  export class Uint64 extends DataType<Type.Int> {}
  export class Float16 extends DataType<Type.Float> {}
  export class Float32 extends DataType<Type.Float> {}
  export class Float64 extends DataType<Type.Float> {}
  export class Utf8 extends DataType<Type.Utf8> {}
  export class Binary extends DataType<Type.Binary> {}
  export class Decimal extends DataType<Type.Decimal> {}
  
  // Type aliases for convenience
  export type Int_ = Int8 | Int16 | Int32 | Int64 | Uint8 | Uint16 | Uint32 | Uint64;
  export type Float = Float16 | Float32 | Float64;
  
  // Date and Time types
  export class Date_ extends DataType<Type.Date> {
    constructor(unit: DateUnit);
  }
  export class Time_ extends DataType<Type.Time> {
    constructor(unit: TimeUnit, bitWidth: 32 | 64);
  }
  export class Timestamp_ extends DataType<Type.Timestamp> {
    constructor(unit: TimeUnit, timezone?: string | null);
  }
  // Alias for Timestamp_ (commonly used)
  export const Timestamp = Timestamp_;
  
  export class Interval_ extends DataType<Type.Interval> {
    constructor(unit: IntervalUnit);
  }
  
  // Complex types
  export class List<T extends DataType = DataType> extends DataType<Type.List> {
    constructor(child: Field<T>);
  }
  export class Struct<T extends Record<string, DataType> = Record<string, DataType>> extends DataType<Type.Struct> {
    constructor(children: Field[]);
  }
  export class Union_<T extends DataType = DataType> extends DataType<Type.Union> {
    constructor(mode: UnionMode, typeIds: number[], children: Field<T>[]);
  }
  export class FixedSizeBinary extends DataType<Type.FixedSizeBinary> {
    constructor(byteWidth: number);
  }
  export class FixedSizeList<T extends DataType = DataType> extends DataType<Type.FixedSizeList> {
    constructor(listSize: number, child: Field<T>);
  }
  export class Map_<TKey extends DataType = DataType, TValue extends DataType = DataType> extends DataType<Type.Map> {
    constructor(child: Field<Struct<{ key: TKey; value: TValue }>>, keysSorted?: boolean);
  }
  export class Dictionary<T extends DataType = DataType, TKey extends DataType = DataType> extends DataType<Type.Dictionary> {
    constructor(dictionary: T, indices: TKey, id?: number | null, isOrdered?: boolean);
  }

  // Enums
  export enum Type {
    NONE = 0,
    Null = 1,
    Int = 2,
    Float = 3,
    Binary = 4,
    Utf8 = 5,
    Bool = 6,
    Decimal = 7,
    Date = 8,
    Time = 9,
    Timestamp = 10,
    Interval = 11,
    List = 12,
    Struct = 13,
    Union = 14,
    FixedSizeBinary = 15,
    FixedSizeList = 16,
    Map = 17,
    Dictionary = 18,
  }

  export enum DateUnit {
    DAY = 0,
    MILLISECOND = 1,
  }

  export enum TimeUnit {
    SECOND = 0,
    MILLISECOND = 1,
    MICROSECOND = 2,
    NANOSECOND = 3,
  }

  export enum IntervalUnit {
    YEAR_MONTH = 0,
    DAY_TIME = 1,
  }

  export enum UnionMode {
    Sparse = 0,
    Dense = 1,
  }

  // Builder functions
  export function makeVector<T>(data: Iterable<T | null> | ArrayLike<T | null>): Vector<T>;
  export function makeData<T extends DataType>(props: {
    type: T;
    length: number;
    nullCount?: number;
    nullBitmap?: Uint8Array | null;
    data?: ArrayBufferView;
    offset?: number;
    stride?: number;
    children?: Data[];
    dictionary?: Vector;
  }): Data;

  // Table building
  export function tableFromArrays(arrays: Record<string, ArrayLike<unknown>>): Table;
  export function tableFromIPC(input: ArrayBuffer | Uint8Array): Table;
  export function tableToIPC(table: Table, format?: 'stream' | 'file'): Uint8Array;

  // RecordBatch for streaming
  export class RecordBatch<T extends Record<string, unknown> = Record<string, unknown>> {
    readonly schema: Schema;
    readonly numRows: number;
    readonly numCols: number;
    
    constructor(schema: Schema, numRows: number, data: Data[]);
    
    get(index: number): T | null;
    getChild(name: string): Vector | null;
    getChildAt(index: number): Vector | null;
    select(...columnNames: string[]): RecordBatch<T>;
    selectAt(...columnIndices: number[]): RecordBatch<T>;
    toArray(): T[];
    [Symbol.iterator](): IterableIterator<T>;
  }

  // RecordBatchReader for reading IPC streams
  export class RecordBatchReader<T extends Record<string, unknown> = Record<string, unknown>> {
    readonly schema: Schema;
    
    static from<T extends Record<string, unknown>>(input: ArrayBuffer | Uint8Array): RecordBatchReader<T>;
    
    readAll(): RecordBatch<T>[];
    [Symbol.iterator](): IterableIterator<RecordBatch<T>>;
    [Symbol.asyncIterator](): AsyncIterableIterator<RecordBatch<T>>;
  }

  // Predicate functions for filtering
  export const predicate: {
    col(name: string): PredicateColumn;
    lit(value: unknown): PredicateLiteral;
    and(...predicates: Predicate[]): Predicate;
    or(...predicates: Predicate[]): Predicate;
    not(predicate: Predicate): Predicate;
  };

  export interface Predicate {
    and(other: Predicate): Predicate;
    or(other: Predicate): Predicate;
    not(): Predicate;
  }

  export interface PredicateColumn extends Predicate {
    eq(value: unknown): Predicate;
    ne(value: unknown): Predicate;
    lt(value: unknown): Predicate;
    le(value: unknown): Predicate;
    gt(value: unknown): Predicate;
    ge(value: unknown): Predicate;
  }

  export interface PredicateLiteral extends Predicate {}

  // Utility types
  export type TypedArray = 
    | Int8Array 
    | Int16Array 
    | Int32Array 
    | Uint8Array 
    | Uint16Array 
    | Uint32Array 
    | Float32Array 
    | Float64Array
    | BigInt64Array
    | BigUint64Array;

  export type ArrayBufferViewConstructor = 
    | Int8ArrayConstructor
    | Int16ArrayConstructor
    | Int32ArrayConstructor
    | Uint8ArrayConstructor
    | Uint16ArrayConstructor
    | Uint32ArrayConstructor
    | Float32ArrayConstructor
    | Float64ArrayConstructor
    | BigInt64ArrayConstructor
    | BigUint64ArrayConstructor;
}

