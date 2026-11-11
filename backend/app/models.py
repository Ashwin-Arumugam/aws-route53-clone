import datetime
import uuid
import secrets
import string
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

def generate_zone_id():
    chars = string.ascii_uppercase + string.digits
    return "Z" + "".join(secrets.choice(chars) for _ in range(14))

def generate_record_id():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    password = Column(String, nullable=False)
    aws_account_id = Column(String, default="1234-5678-9012")
    role = Column(String, default="AdministratorAccess")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class HostedZone(Base):
    __tablename__ = "hosted_zones"

    id = Column(String, primary_key=True, default=generate_zone_id)
    name = Column(String, nullable=False, index=True)
    description = Column(String, nullable=True, default="")
    type = Column(String, default="Public")
    record_count = Column(Integer, default=2)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    records = relationship("DNSRecord", back_populates="hosted_zone", cascade="all, delete-orphan")

class DNSRecord(Base):
    __tablename__ = "dns_records"

    id = Column(String, primary_key=True, default=generate_record_id)
    hosted_zone_id = Column(String, ForeignKey("hosted_zones.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    type = Column(String, nullable=False)
    ttl = Column(Integer, default=300)
    routing_policy = Column(String, default="Simple")
    values = Column(Text, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    hosted_zone = relationship("HostedZone", back_populates="records")
