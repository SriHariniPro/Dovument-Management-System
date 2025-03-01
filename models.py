from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class User(BaseModel):
    username: str
    email: str
    password: str
    organization: Optional[str] = None
    role: str = "user"

class DocumentMetadata(BaseModel):
    title: str
    category: str
    tags: List[str]
    created_at: datetime = Field(default_factory=datetime.now)
    modified_at: datetime = Field(default_factory=datetime.now)
    file_type: str
    size: int
    extracted_text: Optional[str]
    entities: Optional[List[dict]]
    sentiment: Optional[dict]
    confidence_score: float
    industry_classification: Optional[str]
    summary: Optional[str]
    key_phrases: Optional[List[str]]
    relationships: Optional[List[dict]]

class Document(BaseModel):
    id: str
    user_id: str
    file_name: str
    file_path: str
    metadata: DocumentMetadata
    version: int = 1
    is_archived: bool = False
    collaborators: List[str] = []
    access_history: List[dict] = []
    
class SearchQuery(BaseModel):
    query: str
    filters: Optional[dict]
    sort_by: Optional[str]
    page: int = 1
    limit: int = 10 