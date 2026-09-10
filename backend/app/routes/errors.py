"""
Consistent error responses.

FastAPI's default 422 body is a list of loc/msg/type objects. That is fine
for machines but awkward for a dashboard, so we add a flat `message` and a
per-field map while keeping the original `detail` for compatibility.
"""

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


def _field_name(loc) -> str:
    parts = [str(p) for p in loc if p != "body"]
    return ".".join(parts) or "request"


async def validation_error_handler(_: Request, exc: RequestValidationError) -> JSONResponse:
    errors = exc.errors()
    fields = {}
    for err in errors:
        name = _field_name(err.get("loc", ()))
        # keep the first problem reported per field, strip pydantic's "Value error, " prefix
        if name not in fields:
            fields[name] = str(err.get("msg", "invalid value")).removeprefix("Value error, ")
    message = "; ".join(f"{name}: {msg}" for name, msg in fields.items())
    return JSONResponse(
        status_code=422,
        content={
            "error": "validation_error",
            "message": message or "Invalid request",
            "fields": fields,
            "detail": [
                {"loc": list(e.get("loc", ())), "msg": e.get("msg"), "type": e.get("type")} for e in errors
            ],
        },
    )


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(RequestValidationError, validation_error_handler)
