from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import HostedZone, DNSRecord
from ..schemas import HostedZoneCreate, HostedZoneUpdate, HostedZoneOut, BindExportResponse

router = APIRouter(prefix="/api/hosted-zones", tags=["hosted-zones"])

@router.get("", response_model=List[HostedZoneOut])
def get_hosted_zones(
    search: Optional[str] = None,
    zone_type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(HostedZone)
    if search and isinstance(search, str):
        search_pattern = f"%{search.strip().lower()}%"
        query = query.filter(
            (HostedZone.name.ilike(search_pattern)) | 
            (HostedZone.description.ilike(search_pattern)) |
            (HostedZone.id.ilike(search_pattern))
        )
    if zone_type and isinstance(zone_type, str):
        query = query.filter(HostedZone.type.ilike(zone_type))

    zones = query.order_by(HostedZone.created_at.desc()).all()
    for z in zones:
        z.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == z.id).count()
    return zones

@router.post("", response_model=HostedZoneOut, status_code=status.HTTP_201_CREATED)
def create_hosted_zone(zone_in: HostedZoneCreate, db: Session = Depends(get_db)):
    clean_name = zone_in.name.strip()
    if not clean_name.endswith("."):
        clean_name += "."

    existing = db.query(HostedZone).filter(HostedZone.name == clean_name).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Hosted zone '{clean_name}' already exists."
        )

    new_zone = HostedZone(
        name=clean_name,
        description=zone_in.description or "",
        type=zone_in.type or "Public",
        record_count=2
    )
    db.add(new_zone)
    db.flush()

    ns_servers = (
        f"ns-2048.awsdns-64.com.\n"
        f"ns-2049.awsdns-65.net.\n"
        f"ns-2050.awsdns-66.org.\n"
        f"ns-2051.awsdns-67.co.uk."
    )
    ns_record = DNSRecord(
        hosted_zone_id=new_zone.id,
        name=clean_name,
        type="NS",
        ttl=172800,
        routing_policy="Simple",
        values=ns_servers
    )
    soa_value = "ns-2048.awsdns-64.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
    soa_record = DNSRecord(
        hosted_zone_id=new_zone.id,
        name=clean_name,
        type="SOA",
        ttl=900,
        routing_policy="Simple",
        values=soa_value
    )

    db.add(ns_record)
    db.add(soa_record)
    db.commit()
    db.refresh(new_zone)
    return new_zone

@router.get("/{zone_id}", response_model=HostedZoneOut)
def get_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    return zone

@router.put("/{zone_id}", response_model=HostedZoneOut)
def update_hosted_zone(zone_id: str, zone_in: HostedZoneUpdate, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    if zone_in.description is not None:
        zone.description = zone_in.description
    if zone_in.type is not None:
        zone.type = zone_in.type

    db.commit()
    db.refresh(zone)
    zone.record_count = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).count()
    return zone

@router.delete("/{zone_id}", status_code=status.HTTP_200_OK)
def delete_hosted_zone(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    db.delete(zone)
    db.commit()
    return {"message": f"Hosted zone {zone_id} deleted"}

@router.get("/{zone_id}/export/bind", response_model=BindExportResponse)
def export_zone_to_bind(zone_id: str, db: Session = Depends(get_db)):
    zone = db.query(HostedZone).filter(HostedZone.id == zone_id).first()
    if not zone:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Hosted zone not found")

    records = db.query(DNSRecord).filter(DNSRecord.hosted_zone_id == zone.id).all()
    bind_lines = [
        f";; BIND zone file for {zone.name}",
        f"$ORIGIN {zone.name}",
        f"$TTL 300",
        ""
    ]
    for rec in records:
        for val in rec.values.split("\n"):
            val_clean = val.strip()
            if val_clean:
                bind_lines.append(f"{rec.name}\t{rec.ttl}\tIN\t{rec.type}\t{val_clean}")

    return BindExportResponse(
        hosted_zone_id=zone.id,
        domain_name=zone.name,
        bind_content="\n".join(bind_lines)
    )
