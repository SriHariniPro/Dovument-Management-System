import boto3
import pytesseract
from pdf2image import convert_from_bytes
from transformers import pipeline
from typing import List, Dict
import spacy
import os
from datetime import datetime

class AIService:
    def __init__(self):
        # Initialize AI models and services
        self.nlp = spacy.load("en_core_web_sm")
        self.sentiment_analyzer = pipeline("sentiment-analysis")
        self.summarizer = pipeline("summarization")
        
        # Initialize AWS services
        self.comprehend = boto3.client('comprehend',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('AWS_SECRET_KEY'),
            region_name=os.getenv('AWS_REGION')
        )
        
        self.textract = boto3.client('textract',
            aws_access_key_id=os.getenv('AWS_ACCESS_KEY'),
            aws_secret_access_key=os.getenv('AWS_SECRET_KEY'),
            region_name=os.getenv('AWS_REGION')
        )

    async def process_document(self, file) -> Dict:
        """Process document and extract metadata using AI services"""
        
        # Extract text based on file type
        file_content = await file.read()
        if file.filename.lower().endswith('.pdf'):
            extracted_text = self._process_pdf(file_content)
        else:
            extracted_text = self._process_image(file_content)

        # Perform AI analysis
        entities = self._extract_entities(extracted_text)
        sentiment = self._analyze_sentiment(extracted_text)
        summary = self._generate_summary(extracted_text)
        key_phrases = self._extract_key_phrases(extracted_text)
        classification = self._classify_industry(extracted_text)
        
        # Generate metadata
        metadata = {
            "title": file.filename,
            "category": classification,
            "tags": self._generate_tags(entities, key_phrases),
            "created_at": datetime.now(),
            "modified_at": datetime.now(),
            "file_type": file.filename.split('.')[-1],
            "size": len(file_content),
            "extracted_text": extracted_text,
            "entities": entities,
            "sentiment": sentiment,
            "confidence_score": 0.95,  # Example score
            "industry_classification": classification,
            "summary": summary,
            "key_phrases": key_phrases,
            "relationships": self._find_relationships(entities)
        }
        
        return metadata

    def _process_pdf(self, content: bytes) -> str:
        """Extract text from PDF documents"""
        images = convert_from_bytes(content)
        text = ""
        for image in images:
            text += pytesseract.image_to_string(image)
        return text

    def _process_image(self, content: bytes) -> str:
        """Extract text from image documents"""
        return pytesseract.image_to_string(content)

    def _extract_entities(self, text: str) -> List[Dict]:
        """Extract named entities from text"""
        doc = self.nlp(text)
        entities = []
        for ent in doc.ents:
            entities.append({
                "text": ent.text,
                "label": ent.label_,
                "start": ent.start_char,
                "end": ent.end_char
            })
        return entities

    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of the text"""
        result = self.sentiment_analyzer(text[:512])[0]
        return {
            "label": result["label"],
            "score": result["score"]
        }

    def _generate_summary(self, text: str) -> str:
        """Generate a summary of the text"""
        chunks = [text[i:i + 1000] for i in range(0, len(text), 1000)]
        summaries = []
        for chunk in chunks[:3]:  # Process first 3 chunks only
            summary = self.summarizer(chunk, max_length=100, min_length=30, do_sample=False)
            summaries.append(summary[0]['summary_text'])
        return " ".join(summaries)

    def _extract_key_phrases(self, text: str) -> List[str]:
        """Extract key phrases using AWS Comprehend"""
        response = self.comprehend.detect_key_phrases(
            Text=text[:5000],
            LanguageCode='en'
        )
        return [phrase['Text'] for phrase in response['KeyPhrases']]

    def _classify_industry(self, text: str) -> str:
        """Classify document into industry categories"""
        # Simplified classification logic
        industries = ['legal', 'medical', 'financial', 'technical']
        doc = self.nlp(text.lower())
        scores = {industry: 0 for industry in industries}
        
        # Simple keyword matching
        for token in doc:
            if 'law' in token.text or 'legal' in token.text:
                scores['legal'] += 1
            elif 'medical' in token.text or 'health' in token.text:
                scores['medical'] += 1
            elif 'finance' in token.text or 'bank' in token.text:
                scores['financial'] += 1
            elif 'software' in token.text or 'system' in token.text:
                scores['technical'] += 1
                
        return max(scores.items(), key=lambda x: x[1])[0]

    def _generate_tags(self, entities: List[Dict], key_phrases: List[str]) -> List[str]:
        """Generate tags from entities and key phrases"""
        tags = set()
        
        # Add entity-based tags
        for entity in entities[:10]:  # Limit to top 10 entities
            tags.add(entity['text'].lower())
            
        # Add key phrase-based tags
        for phrase in key_phrases[:5]:  # Limit to top 5 key phrases
            tags.add(phrase.lower())
            
        return list(tags)

    def _find_relationships(self, entities: List[Dict]) -> List[Dict]:
        """Find relationships between entities"""
        relationships = []
        for i, entity1 in enumerate(entities):
            for entity2 in entities[i+1:]:
                if entity1['label'] != entity2['label']:
                    relationships.append({
                        "entity1": entity1['text'],
                        "entity2": entity2['text'],
                        "type": f"{entity1['label']}_to_{entity2['label']}"
                    })
        return relationships[:10]  # Limit to top 10 relationships

    async def get_recommendations(self, user_id: str) -> List[Dict]:
        """Generate document recommendations for user"""
        # This would typically involve more sophisticated recommendation logic
        return [
            {
                "document_id": "example_id",
                "reason": "Similar to recently viewed documents",
                "confidence": 0.85
            }
        ] 