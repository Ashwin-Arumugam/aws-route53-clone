import datetime
from typing import List, Optional
from pydantic import BaseModel

class LoginRequest(BaseModel):
    username: str
    password: str
    aws_account_id: Optional[str] = "1234-5678-9012"

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: Optional[str] = None
    aws_account_id: Optional[str] = "1234-5678-9012"
    role: Optional[str] = "AdministratorAccess"

class UserOut(BaseModel):
    id: str
    username: str
    email: str
    aws_account_id: str
    role: str

    class Config:
        from_attributes = True

class LoginResponse(BaseModel):
    message: str
    token: str
    user: UserOut

class HostedZoneBase(BaseModel):
    name: str
    description: Optional[str] = ""
    type: Optional[str] = "Public"

class HostedZoneCreate(HostedZoneBase):
    pass

class HostedZoneUpdate(BaseModel):
    description: Optional[str] = None
    type: Optional[str] = None

class HostedZoneOut(HostedZoneBase):
    id: str
    record_count: int
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class DNSRecordBase(BaseModel):
    name: str
    type: str
    ttl: Optional[int] = 300
    routing_policy: Optional[str] = "Simple"
    values: str

class DNSRecordCreate(DNSRecordBase):
    pass

class DNSRecordUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    ttl: Optional[int] = None
    routing_policy: Optional[str] = None
    values: Optional[str] = None

class DNSRecordOut(DNSRecordBase):
    id: str
    hosted_zone_id: str
    created_at: datetime.datetime
    updated_at: datetime.datetime

    class Config:
        from_attributes = True

class BulkDeleteRecordsRequest(BaseModel):
    record_ids: List[str]

class BindImportRequest(BaseModel):
    bind_text: str

class BindExportResponse(BaseModel):
    hosted_zone_id: str
    domain_name: str
    bind_content: str

class DashboardStats(BaseModel):
    hosted_zones_count: int
    total_records_count: int
    traffic_policies_count: int = 0
    health_checks_count: int = 0
    resolver_rules_count: int = 0
