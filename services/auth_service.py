from datetime import datetime, timedelta
from typing import Optional
import jwt
from passlib.context import CryptContext
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
import os
from tinydb import TinyDB, Query
import json

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthService:
    def __init__(self):
        # Initialize TinyDB
        os.makedirs('data', exist_ok=True)
        self.db = TinyDB('data/users.json')
        self.users = self.db.table('users')
        self.SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-secret-key")
        self.ALGORITHM = "HS256"
        self.ACCESS_TOKEN_EXPIRE_MINUTES = 30

    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)

    def get_password_hash(self, password: str) -> str:
        """Generate password hash"""
        return pwd_context.hash(password)

    async def authenticate_user(self, username: str, password: str) -> str:
        """Authenticate user and return JWT token"""
        User = Query()
        user = self.users.get(User.username == username)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        if not self.verify_password(password, user["password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect username or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
            
        access_token = self.create_access_token(
            data={"sub": user["username"]}
        )
        return access_token

    def create_access_token(self, data: dict) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=self.ACCESS_TOKEN_EXPIRE_MINUTES)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, self.SECRET_KEY, algorithm=self.ALGORITHM)
        return encoded_jwt

    async def get_current_user(self, token: str = Depends(oauth2_scheme)) -> dict:
        """Get current user from JWT token"""
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
        try:
            payload = jwt.decode(token, self.SECRET_KEY, algorithms=[self.ALGORITHM])
            username: str = payload.get("sub")
            if username is None:
                raise credentials_exception
        except jwt.JWTError:
            raise credentials_exception
            
        User = Query()
        user = self.users.get(User.username == username)
        if user is None:
            raise credentials_exception
            
        return user

    async def register_user(self, user_data: dict) -> str:
        """Register new user"""
        User = Query()
        
        # Check if username exists
        if self.users.get(User.username == user_data["username"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Username already registered"
            )
            
        # Check if email exists
        if self.users.get(User.email == user_data["email"]):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
            
        # Hash password
        user_data["password"] = self.get_password_hash(user_data["password"])
        
        # Add additional user fields
        user_data.update({
            "created_at": str(datetime.now()),
            "last_login": None,
            "is_active": True,
            "id": str(len(self.users.all()) + 1)  # Simple ID generation
        })
        
        try:
            doc_id = self.users.insert(user_data)
            return str(doc_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to register user: {str(e)}"
            )

    async def update_user(self, user_id: str, updates: dict) -> dict:
        """Update user information"""
        if "password" in updates:
            updates["password"] = self.get_password_hash(updates["password"])
            
        try:
            User = Query()
            self.users.update(updates, User.id == user_id)
            return self.users.get(User.id == user_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to update user: {str(e)}"
            )

    async def delete_user(self, user_id: str):
        """Soft delete user by deactivating account"""
        try:
            User = Query()
            self.users.update({"is_active": False}, User.id == user_id)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to delete user: {str(e)}"
            ) 