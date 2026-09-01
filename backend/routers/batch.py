import logging
from fastapi import APIRouter, HTTPException
from schemas.metrics import BatchRunRequest, BatchResult
from batch.batch_runner import batch_runner

router = APIRouter(prefix="/batch", tags=["Batch"])
logger = logging.getLogger(__name__)

_latest_batch_result: BatchResult = None

@router.post("/run", response_model=BatchResult)
async def run_synthetic_batch(req: BatchRunRequest):
    global _latest_batch_result
    count = req.count
    if count < 1 or count > 200:
        raise HTTPException(status_code=400, detail="Count must be between 1 and 200")

    result = await batch_runner.run_batch(count=count)
    _latest_batch_result = result
    return result

@router.get("/results")
async def get_latest_batch_results():
    global _latest_batch_result
    if _latest_batch_result is None:
        # Run default batch of 100 if none run yet
        _latest_batch_result = await batch_runner.run_batch(count=100)
    return _latest_batch_result
