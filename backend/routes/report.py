from fastapi import APIRouter, HTTPException, Response
from database.db import get_record_by_id
from services.report_generator import generate_pdf_report

router = APIRouter(prefix="/api", tags=["Reports"])

@router.get("/report/{record_id}")
async def export_pdf_report(record_id: str):
    record = get_record_by_id(record_id)
    if not record:
        raise HTTPException(status_code=404, detail="Diagnostic record not found.")

    try:
        pdf_bytes = generate_pdf_report(record)
        filename = f"cropsense_report_{record.get('disease_name', 'diagnosis').replace(' ', '_')}_{record_id[:8]}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
