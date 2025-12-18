/**
 * Error Handlers Index
 */

export {
  validateFile,
  handleCSVError,
  handleJSONError,
  handleParquetError,
  handleArrowError,
  logFileSuccess,
  withFileErrorHandling,
  type FileValidationResult,
} from './fileErrorHandler';

export {
  handleColumnNotFound,
  handleInvalidFilterValue,
  handleAggregationError,
  handleSortError,
  handleQueryTimeout,
  withQueryErrorHandling,
} from './queryErrorHandler';

export {
  checkWebGLSupport,
  handleContextLost,
  handleContextRestored,
  handleShaderError,
  handleChartRenderError,
  handleTooManyPoints,
  handleBufferAllocationError,
  setupWebGLErrorHandlers,
  withVizErrorHandling,
  checkDataSizeLimit,
} from './vizErrorHandler';

