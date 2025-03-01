import os
import logging
from typing import Dict, List
from transformers import pipeline
import spacy
import pytesseract
from collections import Counter
from itertools import combinations
from PIL import Image
from io import BytesIO

default_model_cache_dir = os.getenv('MODEL_CACHE_DIR', 'models')
MAX_ENTITIES = int(os.getenv('MAX_ENTITIES', '10'))
MAX_KEYWORDS = int(os.getenv('MAX_KEYWORDS', '5'))
MAX_RELATIONSHIPS = int(os.getenv('MAX_RELATIONSHIPS', '10'))

class AIService:
    def __init__(self):
        try:
            self.sentiment_analyzer = pipeline("sentiment-analysis")
            self.nlp = spacy.load("en_core_web_sm")
        except Exception as e:
            logging.error(f"Error initializing AIService: {e}")
            self.sentiment_analyzer, self.nlp = None, None

    def process_document(self, content: bytes, file_type: str) -> Dict:
        extracted_text = self._extract_text(content, file_type)
        if not extracted_text.strip():
            return {"error": "No readable text extracted."}
        
        return {
            "text": extracted_text,
            "sentiment": self._analyze_sentiment(extracted_text),
            "entities": self._extract_entities(extracted_text),
            "keywords": self.extract_keywords(extracted_text),
            "industry_classification": self._classify_industry(extracted_text),
            "relationships": self._find_relationships(self._extract_entities(extracted_text))
        }

    def _extract_text(self, content: bytes, file_type: str) -> str:
        if file_type == 'txt':
            return content.decode('utf-8', errors='ignore')
        elif file_type == 'image':
            return self._process_image(content)
        return ""

    def _process_image(self, content: bytes) -> str:
        try:
            image = Image.open(BytesIO(content))
            return pytesseract.image_to_string(image)
        except Exception as e:
            logging.error(f"Error processing image: {e}")
            return ""

    def _analyze_sentiment(self, text: str) -> Dict:
        try:
            if not text.strip():
                return {"label": "NEUTRAL", "score": 0.5}
            result = self.sentiment_analyzer(text[:512])[0]
            return {"label": result["label"], "score": float(result["score"])}
        except Exception as e:
            logging.error(f"Error analyzing sentiment: {e}")
            return {"label": "NEUTRAL", "score": 0.5}

    def _extract_entities(self, text: str) -> List[Dict]:
        try:
            if not self.nlp:
                return []
            doc = self.nlp(text)
            return [{"text": ent.text, "label": ent.label_} for ent in doc.ents][:MAX_ENTITIES]
        except Exception as e:
            logging.error(f"Error extracting entities: {e}")
            return []

    def extract_keywords(self, text: str) -> List[str]:
        try:
            if not self.nlp:
                return []
            doc = self.nlp(text)
            keywords = [token.text.lower() for token in doc if not token.is_stop and token.is_alpha]
            return [word for word, _ in Counter(keywords).most_common(MAX_KEYWORDS)]
        except Exception as e:
            logging.error(f"Error extracting keywords: {e}")
            return []

    def _classify_industry(self, text: str) -> List[str]:
        try:
            if not self.nlp:
                return ["general"]
            doc = self.nlp(text.lower()[:5000])
            scores = {k: 0 for k in ['legal', 'medical', 'financial', 'technical', 'general']}
            
            keywords = {
                'legal': ['law', 'legal', 'court', 'attorney', 'lawyer'],
                'medical': ['medical', 'health', 'patient', 'doctor', 'hospital'],
                'financial': ['finance', 'bank', 'money', 'investment', 'financial'],
                'technical': ['software', 'system', 'data', 'technology', 'technical'],
                'general': ['general', 'information', 'document', 'report']
            }
            
            for token in doc:
                for industry, terms in keywords.items():
                    if token.text in terms:
                        scores[industry] += 1
            
            return [industry for industry, count in scores.items() if count >= 1] or ["general"]
        except Exception as e:
            logging.error(f"Error classifying industry: {e}")
            return ["general"]

    def _find_relationships(self, entities: List[Dict]) -> List[Dict]:
        try:
            relationships = []
            for entity1, entity2 in combinations(entities, 2):
                if entity1['label'] != entity2['label']:
                    relationships.append({
                        "entity1": entity1['text'],
                        "entity2": entity2['text'],
                        "type": f"{entity1['label']}_to_{entity2['label']}"
                    })
                if len(relationships) >= MAX_RELATIONSHIPS:
                    break
            return relationships
        except Exception as e:
            logging.error(f"Error finding relationships: {e}")
            return []
