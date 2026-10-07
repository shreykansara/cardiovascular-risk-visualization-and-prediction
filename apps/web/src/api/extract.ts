/**
 * Extraction API Client
 * Uses XMLHttpRequest for real progress events and 30s timeout.
 */

import {
  ExtractionError,
  type ExtractionResult,
  type ExtractionErrorCode,
  type ReportType,
} from '../types/extraction';

export interface ExtractReportOptions {
  onProgress?: (progressPct: number) => void;
  signal?: AbortSignal;
}

export function extractReport(
  type: ReportType,
  file: File,
  options?: ExtractReportOptions
): Promise<ExtractionResult> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `/api/v1/extract/${type}`;

    xhr.open('POST', url, true);
    xhr.timeout = 30000; // 30s timeout

    // AbortSignal support
    if (options?.signal) {
      if (options.signal.aborted) {
        xhr.abort();
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      options.signal.addEventListener('abort', () => {
        xhr.abort();
        reject(new DOMException('Aborted', 'AbortError'));
      });
    }

    // Upload progress (0% to 100%)
    if (xhr.upload && options?.onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const pct = Math.round((event.loaded / event.total) * 100);
          options.onProgress?.(pct);
        }
      };
    }

    xhr.onload = () => {
      // Successful extraction response
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data: ExtractionResult = JSON.parse(xhr.responseText);
          resolve(data);
        } catch (e) {
          reject(
            new ExtractionError(
              'unreadable',
              'Failed to parse extraction server response.'
            )
          );
        }
        return;
      }

      // Error responses
      try {
        const errJson = JSON.parse(xhr.responseText);
        const code: ExtractionErrorCode = errJson.code || 'unknown';
        const message: string = errJson.message || 'Extraction failed.';
        const suggestedType: ReportType | undefined = errJson.suggested_type;
        reject(new ExtractionError(code, message, suggestedType));
      } catch (e) {
        // Fallback if response is not JSON
        if (xhr.status === 413) {
          reject(new ExtractionError('too_large', 'File exceeds maximum upload size.'));
        } else if (xhr.status === 503) {
          reject(new ExtractionError('busy', 'Extraction server is busy.'));
        } else {
          reject(new ExtractionError('unknown', `Server error (${xhr.status}).`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new ExtractionError('network', 'Could not reach the server.'));
    };

    xhr.ontimeout = () => {
      reject(new ExtractionError('unreadable', 'Request timed out after 30 seconds.'));
    };

    xhr.onabort = () => {
      reject(new DOMException('Aborted', 'AbortError'));
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
