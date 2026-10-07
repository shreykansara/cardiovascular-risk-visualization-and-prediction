"""
FastAPI route handler for deterministic clinical PDF extraction.
Endpoint: POST /api/v1/extract/{report_type}
"""

import time
import uuid
from fastapi import APIRouter, File, HTTPException, Response, UploadFile, status
from fastapi.responses import JSONResponse

from ..utils.logger import logger
from .intake import (
    ExtractionError,
    extract_document_from_bytes,
    read_and_validate_pdf_bytes,
    run_with_concurrency_and_timeout,
)
from .models import ErrorBody, ExtractionResult
from .parsers import detect_wrong_report_type, get_parser
from .report_types import REPORT_DISPLAY_NAMES, ReportType, owned_keys

router = APIRouter(tags=["Extraction"])

def _perform_extraction_sync(pdf_bytes: bytes, rtype: ReportType):
    """Worker thread target: parse text layer, detect wrong type, and invoke parser."""
    doc = extract_document_from_bytes(pdf_bytes)

    # Wrong report type signature check
    suggested = detect_wrong_report_type(rtype, doc)
    if suggested:
        sugg_name = REPORT_DISPLAY_NAMES.get(suggested, str(suggested.value))
        raise ExtractionError(
            code="wrong_report_type",
            message=f"This looks like an {sugg_name} report. Upload it in the {sugg_name} slot.",
            status_code=422,
            suggested_type=suggested,
        )

    parser = get_parser(rtype)
    fields, rejected, warnings = parser(doc)
    return doc, fields, rejected, warnings

@router.post(
    "/extract/{report_type}",
    response_model=ExtractionResult,
    responses={
        400: {"model": ErrorBody},
        404: {"description": "Unknown report type"},
        413: {"model": ErrorBody},
        422: {"model": ErrorBody},
        503: {"model": ErrorBody},
    },
    summary="Extract Clinical Parameters from Uploaded PDF Report",
)
async def extract_report_endpoint(
    report_type: str,
    file: UploadFile = File(...),
):
    start_time = time.perf_counter()
    req_id = uuid.uuid4().hex[:8]

    # 1. Validate report_type against Enum (unknown -> 404)
    try:
        rtype_enum = ReportType(report_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Unknown report type: '{report_type}'. Allowed types: {', '.join([r.value for r in ReportType])}",
        )

    try:
        # 2. Intake validation (read chunks <= 5MB, check %PDF- header, encryption, page limit)
        pdf_bytes = await read_and_validate_pdf_bytes(file)

        # 3. Concurrency-limited (max 4, wait 5s) & timeout-protected (20s) extraction in worker thread
        doc, fields, rejected, warnings = await run_with_concurrency_and_timeout(
            _perform_extraction_sync,
            pdf_bytes,
            rtype_enum,
        )

        # 4. Result assembly
        all_owned = owned_keys(rtype_enum)
        rejected_keys = {rej.key for rej in rejected}
        not_found = [k for k in all_owned if k not in fields and k not in rejected_keys]
        pages_count = len(doc.pages)
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        extraction_status = ExtractionResult.compute_status(len(fields), len(all_owned))

        result = ExtractionResult(
            report_type=rtype_enum,
            status=extraction_status,
            pages=pages_count,
            fields=fields,
            not_found=not_found,
            rejected=rejected,
            warnings=warnings,
            elapsed_ms=elapsed_ms,
        )

        # 5. Strict Logging: one line per request: request id, report type, pages, counts, elapsed ms
        logger.info(
            f"request_id={req_id} report_type={rtype_enum.value} pages={pages_count} "
            f"filled={len(fields)} not_found={len(not_found)} rejected={len(rejected)} elapsed_ms={elapsed_ms}"
        )

        # 6. Response with Cache-Control: no-store
        json_resp = JSONResponse(status_code=200, content=result.model_dump())
        json_resp.headers["Cache-Control"] = "no-store"
        return json_resp

    except ExtractionError as e:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        logger.info(
            f"request_id={req_id} report_type={rtype_enum.value} error={e.code} elapsed_ms={elapsed_ms}"
        )
        err_resp = JSONResponse(
            status_code=e.status_code,
            content=e.to_error_body().model_dump(),
        )
        err_resp.headers["Cache-Control"] = "no-store"
        return err_resp
    except Exception as e:
        elapsed_ms = int((time.perf_counter() - start_time) * 1000)
        logger.error(
            f"request_id={req_id} report_type={rtype_enum.value} error=unreadable elapsed_ms={elapsed_ms}"
        )
        err_resp = JSONResponse(
            status_code=422,
            content=ErrorBody(code="unreadable", message="This PDF could not be read.").model_dump(),
        )
        err_resp.headers["Cache-Control"] = "no-store"
        return err_resp
