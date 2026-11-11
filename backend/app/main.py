from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, SessionLocal
from .models import User, HostedZone, DNSRecord
from .routers import auth, hosted_zones, records, placeholders

Base.metadata.create_all(bind=engine)

app = FastAPI(title="AWS Route 53 Clone API")

origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(hosted_zones.router)
app.include_router(records.router)
app.include_router(placeholders.router)

@app.on_event("startup")
def seed_data():
    db = SessionLocal()
    try:
        if not db.query(User).filter(User.username == "admin").first():
            db.add(User(
                username="admin",
                email="admin@aws.mock",
                password="admin123",
                aws_account_id="1234-5678-9012",
                role="AdministratorAccess"
            ))
        if not db.query(User).filter(User.username == "developer").first():
            db.add(User(
                username="developer",
                email="dev@aws.mock",
                password="devpass123",
                aws_account_id="9876-5432-1098",
                role="ReadOnlyAccess"
            ))
        db.commit()

        if db.query(HostedZone).count() == 0:
            zone = HostedZone(
                id="Z04218392W414A9D3",
                name="example.com.",
                description="Production domain",
                type="Public",
                record_count=5
            )
            db.add(zone)
            db.flush()

            records = [
                DNSRecord(
                    hosted_zone_id=zone.id,
                    name="example.com.",
                    type="NS",
                    ttl=172800,
                    routing_policy="Simple",
                    values="ns-2048.awsdns-64.com.\nns-2049.awsdns-65.net.\nns-2050.awsdns-66.org.\nns-2051.awsdns-67.co.uk."
                ),
                DNSRecord(
                    hosted_zone_id=zone.id,
                    name="example.com.",
                    type="SOA",
                    ttl=900,
                    routing_policy="Simple",
                    values="ns-2048.awsdns-64.com. awsdns-hostmaster.amazon.com. 1 7200 900 1209600 86400"
                ),
                DNSRecord(
                    hosted_zone_id=zone.id,
                    name="example.com.",
                    type="A",
                    ttl=300,
                    routing_policy="Simple",
                    values="198.51.100.24\n198.51.100.25"
                ),
                DNSRecord(
                    hosted_zone_id=zone.id,
                    name="api.example.com.",
                    type="CNAME",
                    ttl=300,
                    routing_policy="Simple",
                    values="lb-prod-12345.us-east-1.elb.amazonaws.com."
                ),
                DNSRecord(
                    hosted_zone_id=zone.id,
                    name="_amazonses.example.com.",
                    type="TXT",
                    ttl=300,
                    routing_policy="Simple",
                    values='"MS=ms12345678" "v=spf1 include:amazonses.com ~all"'
                ),
            ]
            for r in records:
                db.add(r)
            db.commit()
    finally:
        db.close()

@app.get("/")
def root():
    return {"status": "ok", "service": "route53-clone-api"}
