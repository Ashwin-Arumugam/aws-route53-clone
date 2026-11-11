from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import HostedZone, DNSRecord
from ..schemas import DashboardStats

router = APIRouter(prefix="/api", tags=["placeholders"])

@router.get("/dashboard/stats", response_model=DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    return DashboardStats(
        hosted_zones_count=db.query(HostedZone).count(),
        total_records_count=db.query(DNSRecord).count()
    )

@router.get("/traffic-policies")
def get_traffic_policies():
    return {"status": "coming_soon", "title": "Traffic Policies"}

@router.get("/health-checks")
def get_health_checks():
    return {"status": "coming_soon", "title": "Health Checks"}

@router.get("/resolver")
def get_resolver():
    return {"status": "coming_soon", "title": "Resolver"}

@router.get("/profiles")
def get_profiles():
    return {"status": "coming_soon", "title": "Profiles"}
