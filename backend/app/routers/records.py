import re
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import HostedZone, DNSRecord
from ..schemas import (
    DNSRecordCreate,
    DNSRecordUpdate,
    DNSRecordOut,
    BulkDeleteRecordsRequest,
    BindImportRequest
)

router = APIRouter(prefix="/api/hosted-zones/{zone_id}/records", tags=["records"])

SUPPORTED_TYPES = {"A", "AAAA", "CNAME", "TXT", "MX", "NS", "PTR", "SRV", "CAA", "SOA"}

def validate_record_type(rec_type: str):
    rec_type_upper = rec_type.upper()
    if rec_type_upper not in SUPPORTED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported record type: {rec_type}"
        )
    return rec_type_upper

@router.get("", response_model=List[DNSRecordOut])
def get_records(
    zone_id: str,
    search: Optional[str] = None,
    record_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    query = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id)
    if search and isinstance(search, str):
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            (DNSRecord.name.ilike(search_pattern)) |
            (DNSRecord.values.ilike(search_pattern))
        )
    if record_type and isinstance(record_type, str):
        query = query.filter(DNSRecord.type == record_type.upper())

    return query.order_by(DNSRecord.type.asc(), DNSRecord.name.asc()).all()

@router.post("", response_model=DNSRecordOut, status_code=status.HTTP_201_CREATED)
def create_record(zone_id: str, record_in: DNSRecordCreate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    rec_type = validate_record_type(record_in.type)
    formatted_name = record_in.name.strip()
    if not formatted_name.endswith("."):
        formatted_name += "."

    new_record = DNSRecord(
        hosted_zone_id=zone_id,
        name=formatted_name,
        type=rec_type,
        ttl=record_in.ttl if record_in.ttl is not None else 300,
        routing_policy=record_in.routing_policy or "Simple",
        values=record_in.values.strip()
    )
    db.add(new_record)
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count() + 1
    db.commit()
    db.refresh(new_record)
    return new_record

@router.get("/{record_id}", response_model=DNSRecordOut)
def get_record(zone_id: str, record_id: str, db: Session = Depends(get_db)):
    record = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")
    return record

@router.put("/{record_id}", response_model=DNSRecordOut)
def update_record(
    zone_id: str,
    record_id: str,
    record_in: DNSRecordUpdate,
    db: Session = Depends(get_db)
):
    record = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    if record_in.name is not None:
        name = record_in.name.strip()
        record.name = name if name.endswith(".") else f"{name}."
    if record_in.type is not None:
        record.type = validate_record_type(record_in.type)
    if record_in.ttl is not None:
        record.ttl = record_in.ttl
    if record_in.routing_policy is not None:
        record.routing_policy = record_in.routing_policy
    if record_in.values is not None:
        record.values = record_in.values.strip()

    db.commit()
    db.refresh(record)
    return record

@router.delete("/{record_id}", status_code=status.HTTP_200_OK)
def delete_record(zone_id: str, record_id: str, db: Session = Depends(get_db)):
    record = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id == record_id
    ).first()
    if not record:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Record not found")

    db.delete(record)
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone:
        zone.record_count = max(0, db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count() - 1)
    db.commit()
    return {"message": f"Record {record_id} deleted"}

@router.post("/bulk-delete", status_code=status.HTTP_200_OK)
def bulk_delete_records(zone_id: str, request: BulkDeleteRecordsRequest, db: Session = Depends(get_db)):
    deleted_count = db.query(DNSRecord).filter(
        DNSRecord.hosted_zone_id == zone_id,
        DNSRecord.id.in_(request.record_ids)
    ).delete(synchronize_session=False)

    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if zone:
        zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()

    return {"deleted_count": deleted_count}

@router.post("/import/bind", status_code=status.HTTP_201_CREATED)
def import_bind_zone(zone_id: str, payload: BindImportRequest, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    imported = 0
    for line in payload.bind_text.splitlines():
        line = line.strip()
        if not line or line.startswith(";") or line.startswith("$"):
            continue

        parts = re.split(r'\s+', line)
        if len(parts) >= 4:
            name = parts[0]
            if "IN" in parts:
                idx = parts.index("IN")
                rec_type = parts[idx + 1].upper()
                val = " ".join(parts[idx + 2:])
                ttl = int(parts[1]) if parts[1].isdigit() else 300
            else:
                rec_type = parts[2].upper()
                val = " ".join(parts[3:])
                ttl = 300

            if rec_type in SUPPORTED_TYPES:
                new_rec = DNSRecord(
                    hosted_zone_id=zone_id,
                    name=name if name.endswith(".") else f"{name}.",
                    type=rec_type,
                    ttl=ttl,
                    values=val
                )
                db.add(new_rec)
                imported += 1

    db.commit()
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone_id).count()
    db.commit()

    return {"message": f"Imported {imported} records", "imported_count": imported}
