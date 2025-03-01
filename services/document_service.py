import boto3
import os
from botocore.exceptions import ClientError
from datetime import datetime
from typing import List, Optional, Dict
import uuid
from tinydb import TinyDB, Query
import shutil
import json

class DocumentService:
    def __init__(self):
        # Initialize local storage
        os.makedirs('data/documents', exist_ok=True)
        self.db = TinyDB('data/documents.json')
        self.documents = self.db.table('documents')
        
        # Initialize S3 client for optional cloud storage
        self.s3 = boto3.client('s3',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('AWS_SECRET_KEY'),
            region_name=os.getenv('AWS_REGION')
        ) if os.getenv('AWS_ACCESS_KEY') else None
        self.bucket_name = os.getenv('AWS_BUCKET_NAME')

    async def store_document(self, file, metadata: Dict, user_id: str) -> str:
        """Store document locally and metadata in TinyDB"""
        file_path = None
        try:
            # Generate unique document ID
            doc_id = str(uuid.uuid4())
            
            # Create document directory if it doesn't exist
            user_doc_dir = f"data/documents/{user_id}"
            os.makedirs(user_doc_dir, exist_ok=True)
            
            # Save file locally
            file_path = f"{user_doc_dir}/{doc_id}_{file.filename}"
            with open(file_path, "wb") as buffer:
                shutil.copyfileobj(file.file, buffer)
            
            # Store in S3 if configured
            s3_path = None
            if self.s3 and self.bucket_name:
                s3_path = f"{user_id}/{doc_id}/{file.filename}"
                self.s3.upload_file(file_path, self.bucket_name, s3_path)
            
            # Prepare document metadata
            doc_data = {
                "id": doc_id,
                "user_id": user_id,
                "file_name": file.filename,
                "file_path": file_path,
                "s3_path": s3_path,
                "metadata": metadata,
                "created_at": str(datetime.now()),
                "updated_at": str(datetime.now()),
                "version": 1,
                "is_archived": False,
                "collaborators": []
            }
            
            # Store in TinyDB
            self.documents.insert(doc_data)
            
            return doc_id
            
        except Exception as e:
            # Clean up local file if storage fails
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
            raise Exception(f"Failed to store document: {str(e)}")

    async def get_documents(
        self,
        user_id: str,
        category: Optional[str] = None,
        search_query: Optional[str] = None
    ) -> List[Dict]:
        """Get documents for user with optional filtering"""
        try:
            Document = Query()
            
            # Base query for user's documents
            query = Document.user_id == user_id
            
            # Add category filter if specified
            if category:
                query &= Document.metadata.category == category
                
            # Get all matching documents
            documents = self.documents.search(query)
            
            # Apply text search if specified
            if search_query:
                search_query = search_query.lower()
                documents = [
                    doc for doc in documents
                    if search_query in doc['file_name'].lower() or
                    search_query in doc['metadata'].get('extracted_text', '').lower()
                ]
            
            return documents
            
        except Exception as e:
            raise Exception(f"Failed to get documents: {str(e)}")

    async def get_document(self, doc_id: str, user_id: str) -> Dict:
        """Get single document by ID"""
        try:
            Document = Query()
            document = self.documents.get(
                (Document.id == doc_id) & 
                ((Document.user_id == user_id) | (Document.collaborators.any([user_id])))
            )
            
            if not document:
                raise Exception("Document not found or access denied")
                
            return document
            
        except Exception as e:
            raise Exception(f"Failed to get document: {str(e)}")

    async def update_document(
        self,
        doc_id: str,
        user_id: str,
        updates: Dict
    ) -> Dict:
        """Update document metadata"""
        try:
            Document = Query()
            document = self.documents.get(
                (Document.id == doc_id) & 
                ((Document.user_id == user_id) | (Document.collaborators.any([user_id])))
            )
            
            if not document:
                raise Exception("Document not found or access denied")
            
            # Update the document
            updates['updated_at'] = str(datetime.now())
            updates['version'] = document.get('version', 1) + 1
            
            self.documents.update(updates, Document.id == doc_id)
            
            return self.documents.get(Document.id == doc_id)
            
        except Exception as e:
            raise Exception(f"Failed to update document: {str(e)}")

    async def delete_document(self, doc_id: str, user_id: str):
        """Delete document and its files"""
        try:
            Document = Query()
            document = self.documents.get(
                (Document.id == doc_id) & 
                (Document.user_id == user_id)
            )
            
            if not document:
                raise Exception("Document not found or access denied")
            
            # Delete local file
            if os.path.exists(document['file_path']):
                os.remove(document['file_path'])
            
            # Delete from S3 if configured
            if self.s3 and self.bucket_name and document.get('s3_path'):
                self.s3.delete_object(
                    Bucket=self.bucket_name,
                    Key=document['s3_path']
                )
            
            # Remove from database
            self.documents.remove(Document.id == doc_id)
            
        except Exception as e:
            raise Exception(f"Failed to delete document: {str(e)}")

    async def add_collaborator(
        self,
        doc_id: str,
        owner_id: str,
        collaborator_id: str
    ):
        """Add collaborator to document"""
        try:
            Document = Query()
            document = self.documents.get(
                (Document.id == doc_id) & 
                (Document.user_id == owner_id)
            )
            
            if not document:
                raise Exception("Document not found or access denied")
            
            collaborators = document.get('collaborators', [])
            if collaborator_id not in collaborators:
                collaborators.append(collaborator_id)
                
            self.documents.update(
                {'collaborators': collaborators},
                Document.id == doc_id
            )
            
        except Exception as e:
            raise Exception(f"Failed to add collaborator: {str(e)}")

    async def remove_collaborator(
        self,
        doc_id: str,
        owner_id: str,
        collaborator_id: str
    ):
        """Remove collaborator from document"""
        try:
            Document = Query()
            document = self.documents.get(
                (Document.id == doc_id) & 
                (Document.user_id == owner_id)
            )
            
            if not document:
                raise Exception("Document not found or access denied")
            
            collaborators = document.get('collaborators', [])
            if collaborator_id in collaborators:
                collaborators.remove(collaborator_id)
                
            self.documents.update(
                {'collaborators': collaborators},
                Document.id == doc_id
            )
            
        except Exception as e:
            raise Exception(f"Failed to remove collaborator: {str(e)}") 