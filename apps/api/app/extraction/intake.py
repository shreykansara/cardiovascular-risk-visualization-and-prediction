"""
PDF Intake Validation and Concurrency Management.
Validates file size, PDF header, encryption, page limits, and text layer in memory.
Enforces worker-thread timeouts (20s) and concurrent extraction throttling (semaphore of 4).
"""

import asyncio
from concurrent.futures import TimeoutError as FutureTimeoutError
import io
from typing import Callable, Optional
from fastapi import UploadFile
import pdfplumber

from .models import ErrorBody
from .pdf_text import Document
from .report_types import ReportType

MAX_BYTES = 5 * 1024 * 1024  # 5 MB
MAX_PAGES = 10
MIN_TEXT_CHARS = 40
CONCURRENCY_LIMIT = 4
SEMAPHORE_WAIT_TIMEOUT = 5.0
EXTRACTION_TIMEOUT = 20.0

# Concurrency semaphore
_extraction_semaphore = asyncio.Semaphore(CONCURRENCY_LIMIT)

class ExtractionError(Exception):
    """Domain exception for extraction errors with error code and status."""
    def __init__(
        self,
        code: str,
        message: str,
        status_code: int = 422,
        suggested_type: Optional[ReportType] = None,
    ):
        super().__init__(message)
        self.code = code
        self.message = message
        self.status_code = status_code
        self.suggested_type = suggested_type

    def to_error_body(self) -> ErrorBody:
        return ErrorBody(
            code=self.code,
            message=self.message,
            suggested_type=self.suggested_type,
        )

async def read_and_validate_pdf_bytes(file: UploadFile) -> bytes:
    """
    Reads the uploaded file stream in 64KB chunks and applies intake validation rules.
    Never uses the file name for anything.
    """
    buffer = bytearray()
    chunk_size = 64 * 1024

    while True:
        chunk = await file.read(chunk_size)
        if not chunk:
            break
        buffer.extend(chunk)
        if len(buffer) > MAX_BYTES:
            raise ExtractionError(
                code="too_large",
                message="This file is larger than 5 MB.",
                status_code=413,
            )

    content = bytes(buffer)

    # 1. Check PDF magic bytes prefix
    if not content.startswith(b"%PDF-"):
        raise ExtractionError(
            code="not_pdf",
            message="This file is not a PDF.",
            status_code=400,
        )

    # 2. Check encryption, page count, and readability using pdfplumber in memory
    try:
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            # Check encrypted
            if getattr(pdf.doc, "is_encrypted", False):
                raise ExtractionError(
                    code="encrypted",
                    message="This PDF is password protected.",
                    status_code=422,
                )

            # Check page count
            if len(pdf.pages) > MAX_PAGES:
                raise ExtractionError(
                    code="too_many_pages",
                    message="This report has more than 10 pages.",
                    status_code=422,
                )
    except ExtractionError:
        raise
    except Exception as e:
        err_str = str(e).lower()
        if "password" in err_str or "encrypt" in err_str:
            raise ExtractionError(
                code="encrypted",
                message="This PDF is password protected.",
                status_code=422,
            )
        raise ExtractionError(
            code="unreadable",
            message="This PDF could not be read.",
            status_code=422,
        )

    return content

def extract_document_from_bytes(pdf_bytes: bytes) -> Document:
    """Synchronous parsing of Document from validated bytes."""
    try:
        doc = Document.from_pdf_bytes(pdf_bytes)
    except Exception:
        raise ExtractionError(
            code="unreadable",
            message="This PDF could not be read.",
            status_code=422,
        )

    # Check minimum text layer characters
    if doc.total_non_whitespace_chars < MIN_TEXT_CHARS:
        raise ExtractionError(
            code="no_text_layer",
            message="This PDF has no readable text. Scanned reports are not supported yet.",
            status_code=422,
        )

    return doc

async def run_with_concurrency_and_timeout(sync_fn: Callable[..., any], *args, **kwargs):
    """
    Acquires concurrency semaphore with 5s timeout (returns 503 'busy' if exhausted),
    and executes sync_fn in a worker thread with 20s timeout (returns 422 'unreadable' on timeout).
    """
    try:
        await asyncio.wait_for(_extraction_semaphore.acquire(), timeout=SEMAPHORE_WAIT_TIMEOUT)
    except (asyncio.TimeoutError, TimeoutError):
        raise ExtractionError(
            code="busy",
            message="The server is busy. Try again in a moment.",
            status_code=503,
        )

    try:
        result = await asyncio.wait_for(
            asyncio.to_thread(sync_fn, *args, **kwargs),
            timeout=EXTRACTION_TIMEOUT,
        )
        return result
    except (asyncio.TimeoutError, TimeoutError, FutureTimeoutError):
        raise ExtractionError(
            code="unreadable",
            message="This PDF could not be read.",
            status_code=422,
        )
    finally:
        _extraction_semaphore.release()
