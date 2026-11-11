import secrets
from fastapi import APIRouter, Depends, HTTPException, status, Header
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User
from ..schemas import LoginRequest, RegisterRequest, LoginResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])

sessions = {}

@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def register(user_in: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.username == user_in.username).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Username '{user_in.username}' already exists."
        )

    email = user_in.email or f"{user_in.username}@aws.mock"
    new_user = User(
        username=user_in.username,
        email=email,
        password=user_in.password,
        aws_account_id=user_in.aws_account_id or "1234-5678-9012",
        role=user_in.role or "AdministratorAccess"
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=LoginResponse)
def login(credentials: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.username == credentials.username).first()
    
    if not user or user.password != credentials.password:
        if credentials.username == "admin" and credentials.password == "admin123":
            user = User(
                username="admin",
                email="admin@aws.mock",
                password="admin123",
                aws_account_id=credentials.aws_account_id or "1234-5678-9012",
                role="AdministratorAccess"
            )
            db.add(user)
            db.commit()
            db.refresh(user)
        else:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid username or password"
            )

    if credentials.aws_account_id and credentials.aws_account_id != user.aws_account_id:
        user.aws_account_id = credentials.aws_account_id
        db.commit()
        db.refresh(user)

    token = f"token_{secrets.token_hex(16)}"
    sessions[token] = user.id

    return LoginResponse(
        message="Login successful",
        token=token,
        user=UserOut.model_validate(user)
    )

@router.post("/logout")
def logout(authorization: str = Header(None)):
    token = authorization.replace("Bearer ", "") if authorization else None
    if token and token in sessions:
        del sessions[token]
    return {"message": "Logged out"}

@router.get("/me", response_model=UserOut)
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    token = authorization.replace("Bearer ", "") if authorization else None
    if not token or token not in sessions:
        user = db.query(User).first()
        if user:
            return UserOut.model_validate(user)
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")

    user = db.query(User).filter(User.id == sessions[token]).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")
    return UserOut.model_validate(user)
