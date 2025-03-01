from fastapi import FastAPI, File, UploadFile, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict
from datetime import datetime
from botocore.exceptions import ClientError
import os
from dotenv import load_dotenv
from models import Document, User, DocumentMetadata
from services.ai_service import AIService
from services.auth_service import AuthService
from services.document_service import DocumentService
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

load_dotenv()

app = FastAPI(title="SmartDocs AI API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Initialize services
ai_service = AIService()
auth_service = AuthService()
document_service = DocumentService()

@app.get("/favicon.ico")
async def favicon():
    return FileResponse("static/favicon.ico")

@app.get("/")
async def root() -> Dict[str, str]:
    """Root endpoint returning API information."""
    return {
        "message": "Welcome to SmartDocs AI API",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check() -> Dict[str, str]:
    """Health check endpoint."""
    return {"status": "healthy"}

@app.post("/api/documents/upload")
async def upload_document(
    file: UploadFile = File(...),
    user = Depends(auth_service.get_current_user)
):
    try:
        # Process document with AI
        metadata = await ai_service.process_document(file)
        
        # Store document and metadata
        doc_id = await document_service.store_document(file, metadata, user["id"])
        
        return {"message": "Document uploaded successfully", "document_id": doc_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents")
async def get_documents(
    user = Depends(auth_service.get_current_user),
    category: Optional[str] = None,
    search_query: Optional[str] = None
):
    try:
        documents = await document_service.get_documents(
            user_id=user["id"],
            category=category,
            search_query=search_query
        )
        return documents
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/documents/{doc_id}")
async def get_document(
    doc_id: str,
    user = Depends(auth_service.get_current_user)
):
    try:
        document = await document_service.get_document(doc_id, user["id"])
        if not document:
            raise HTTPException(status_code=404, detail="Document not found")
        return document
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/auth/register")
async def register_user(user: User):
    try:
        user_id = await auth_service.register_user(user.dict())
        return {"message": "User registered successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/auth/login")
async def login_user(username: str, password: str):
    try:
        token = await auth_service.authenticate_user(username, password)
        return {"access_token": token, "token_type": "bearer"}
    except Exception as e:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.get("/api/documents/recommend")
async def get_recommendations(
    user = Depends(auth_service.get_current_user)
):
    try:
        recommendations = await ai_service.get_recommendations(user["id"])
        return recommendations
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 
