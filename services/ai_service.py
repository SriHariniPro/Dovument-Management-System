import pytesseract
from pdf2image import convert_from_bytes
from transformers import pipeline, AutoTokenizer, AutoModelForSequenceClassification
from typing import List, Dict, Any
import spacy
import os
from datetime import datetime
import logging
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=os.getenv('LOG_LEVEL', 'INFO'),
    filename=os.getenv('LOG_FILE', 'app.log'),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

class AIService:
    def __init__(self):
        try:
            # Configure pytesseract path if specified
            if os.getenv('TESSERACT_CMD'):
                pytesseract.pytesseract.tesseract_cmd = os.getenv('TESSERACT_CMD')

            # Load spaCy model
            self.nlp = spacy.load(os.getenv('SPACY_MODEL', 'en_core_web_sm'))
            
            # Try to load model from local cache first
            model_name = os.getenv('SENTIMENT_MODEL', 'distilbert-base-uncased-sentiment')
            cache_dir = os.path.join(os.getcwd(), os.getenv('MODEL_CACHE_DIR', 'models'))
            os.makedirs(cache_dir, exist_ok=True)

            try:
                # Try loading from local cache first
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model=model_name,
                    cache_dir=cache_dir,
                    local_files_only=True
                )
                logging.info("Loaded sentiment analysis model from cache")
            except Exception as e:
                logging.warning(f"Could not load model from cache: {e}")
                # If local load fails, try downloading
                self.sentiment_analyzer = pipeline(
                    "sentiment-analysis",
                    model=model_name,
                    cache_dir=cache_dir
                )
                logging.info("Downloaded sentiment analysis model")
        except Exception as e:
            logging.error(f"Error initializing AI service: {e}")
            self.nlp = None
            self.sentiment_analyzer = None

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
        key_phrases = self.extract_keywords(extracted_text)
        classification = self._classify_industry(extracted_text)
        
        # Generate metadata
        metadata = {
            "title": file.filename,
            "category": classification,
            "tags": self._generate_tags(entities, key_phrases),
            "created_at": datetime.now().isoformat(),
            "modified_at": datetime.now().isoformat(),
            "file_type": file.filename.split('.')[-1],
            "size": len(file_content),
            "extracted_text": extracted_text,
            "entities": entities,
            "sentiment": sentiment,
            "confidence_score": 0.95,
            "industry_classification": classification,
            "key_phrases": key_phrases,
            "relationships": self._find_relationships(entities)
        }
        
        return metadata

    def _process_pdf(self, content: bytes) -> str:
        """Extract text from PDF documents"""
        try:
            dpi = int(os.getenv('PDF_DPI', '200'))
            images = convert_from_bytes(content, dpi=dpi)
            text = ""
            for image in images:
                text += pytesseract.image_to_string(image)
            return text
        except Exception as e:
            logging.error(f"Error processing PDF: {e}")
            return ""

    def _process_image(self, content: bytes) -> str:
        """Extract text from image documents"""
        try:
            return pytesseract.image_to_string(content)
        except Exception as e:
            logging.error(f"Error processing image: {e}")
            return ""

    def _extract_entities(self, text: str) -> List[Dict]:
        """Extract named entities from text"""
        try:
            if not self.nlp:
                return []
            max_length = int(os.getenv('MAX_TEXT_LENGTH', '5000'))
            doc = self.nlp(text[:max_length])
            entities = []
            max_entities = int(os.getenv('MAX_ENTITIES', '10'))
            for ent in list(doc.ents)[:max_entities]:
                entities.append({
                    "text": ent.text,
                    "label": ent.label_,
                    "start": ent.start_char,
                    "end": ent.end_char
                })
            return entities
        except Exception as e:
            logging.error(f"Error extracting entities: {e}")
            return []

    def _analyze_sentiment(self, text: str) -> Dict:
        """Analyze sentiment of the text"""
        try:
            if not self.sentiment_analyzer:
                return {"label": "NEUTRAL", "score": 0.5}
            max_length = int(os.getenv('MAX_SENTIMENT_LENGTH', '512'))
            result = self.sentiment_analyzer(text[:max_length])[0]
            return {
                "label": result["label"],
                "score": float(result["score"])
            }
        except Exception as e:
            logging.error(f"Error analyzing sentiment: {e}")
            return {"label": "NEUTRAL", "score": 0.5}

    def _classify_industry(self, text: str) -> str:
        """Classify document into industry categories"""
        try:
            if not self.nlp:
                return "general"
            # Simplified classification logic
            industries = ['legal', 'medical', 'financial', 'technical', 'general']
            doc = self.nlp(text.lower()[:5000])
            scores = {industry: 0 for industry in industries}
            
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
                    
            return max(scores.items(), key=lambda x: x[1])[0]
        except Exception as e:
            logging.error(f"Error classifying industry: {e}")
            return "general"

    def _generate_tags(self, entities: List[Dict], key_phrases: List[str]) -> List[str]:
        """Generate tags from entities and key phrases"""
        try:
            tags = set()
            max_entities = int(os.getenv('MAX_ENTITIES', '10'))
            max_keywords = int(os.getenv('MAX_KEYWORDS', '5'))
            
            # Add entity-based tags
            for entity in entities[:max_entities]:
                tags.add(entity['text'].lower())
                
            # Add key phrase-based tags
            for phrase in key_phrases[:max_keywords]:
                tags.add(phrase.lower())
                
            return list(tags)
        except Exception as e:
            logging.error(f"Error generating tags: {e}")
            return []

    def _find_relationships(self, entities: List[Dict]) -> List[Dict]:
        """Find relationships between entities"""
        try:
            relationships = []
            max_relationships = int(os.getenv('MAX_RELATIONSHIPS', '10'))
            for i, entity1 in enumerate(entities):
                for entity2 in entities[i+1:]:
                    if entity1['label'] != entity2['label']:
                        relationships.append({
                            "entity1": entity1['text'],
                            "entity2": entity2['text'],
                            "type": f"{entity1['label']}_to_{entity2['label']}"
                        })
                        if len(relationships) >= max_relationships:
                            return relationships
            return relationships
        except Exception as e:
            logging.error(f"Error finding relationships: {e}")
            return []

    async def get_recommendations(self, user_id: str) -> List[Dict]:
        """Generate document recommendations for user"""
        return [
            {
                "document_id": "example_id",
                "reason": "Similar to recently viewed documents",
                "confidence": 0.85
            }
        ]

    def extract_keywords(self, text: str) -> List[str]:
        """Extract important keywords from text."""
        try:
            if not self.nlp:
                return []
            
            doc = self.nlp(text)
            keywords = [
                token.text for token in doc
                if not token.is_stop and not token.is_punct and token.is_alpha
            ]
            return list(set(keywords))  # Remove duplicates
        except Exception as e:
            logging.error(f"Error in extract_keywords: {e}")
            return []

    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Analyze text content and return insights."""
        try:
            result = {
                "entities": [],
                "sentiment": None,
                "summary": "",
                "keywords": []
            }

            # Named Entity Recognition with spaCy
            if self.nlp:
                doc = self.nlp(text)
                result["entities"] = [
                    {"text": ent.text, "label": ent.label_}
                    for ent in doc.ents
                ]
                result["keywords"] = [
                    token.text for token in doc
                    if not token.is_stop and not token.is_punct and token.is_alpha
                ]

            # Sentiment Analysis
            if self.sentiment_analyzer:
                try:
                    sentiment = self.sentiment_analyzer(text[:512])[0]  # Limit text length
                    result["sentiment"] = {
                        "label": sentiment["label"],
                        "score": float(sentiment["score"])
                    }
                except Exception as e:
                    logging.error(f"Sentiment analysis failed: {e}")

            return result
        except Exception as e:
            logging.error(f"Error in analyze_text: {e}")
            return {
                "entities": [],
                "sentiment": None,
                "summary": "",
                "keywords": [],
                "error": str(e)
            }

    def categorize_document(self, text: str, metadata: Dict[str, Any]) -> List[str]:
        """Categorize document based on content and metadata."""
        try:
            categories = set()
            
            # Add basic file type category
            if "file_type" in metadata:
                categories.add(metadata["file_type"].lower())

            # Add content-based categories
            if self.nlp:
                doc = self.nlp(text[:1000])  # Limit text for processing
                # Add categories based on named entities
                for ent in doc.ents:
                    if ent.label_ in ["ORG", "PRODUCT", "EVENT", "LAW"]:
                        categories.add(ent.label_.lower())

            return list(categories)
        except Exception as e:
            logging.error(f"Error in categorize_document: {e}")
            return [] 
