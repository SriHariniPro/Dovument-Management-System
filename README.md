# SmartDocs AI - Intelligent Document Management System

SmartDocs AI is a modern, AI-powered document management system that automates document classification, enhances search capabilities, and extracts key information from various file formats. The system uses advanced AI techniques for semantic understanding and provides intelligent recommendations.

## Features

- **Automated Classification & Tagging**: AI-powered categorization of documents with smart tagging using text analysis
- **Intelligent Content Extraction**: OCR-based extraction of key details from documents
- **Semantic Understanding**: Deep content analysis to identify topics, entities, and relationships
- **Smart Search**: Advanced search capabilities with filters and semantic matching
- **Collaboration Tools**: Version control and collaborative editing features
- **Industry-Specific Organization**: Tailored document management for legal, medical, and financial sectors
- **Modern UI**: Clean, responsive interface built with React and Tailwind CSS

## Tech Stack

### Backend
- Python FastAPI
- MongoDB
- AWS Services (S3, Textract, Comprehend)
- Spacy for NLP
- PyTesseract for OCR

### Frontend
- React with TypeScript
- Tailwind CSS
- Headless UI Components
- Zustand for State Management

## Prerequisites

- Python 3.8+
- Node.js 14+
- MongoDB
- AWS Account
- OpenAI API Key (optional)

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/smartdocs-ai.git
   cd smartdocs-ai
   ```

2. Set up the backend:
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   python -m spacy download en_core_web_sm
   ```

3. Set up the frontend:
   ```bash
   cd frontend
   npm install
   ```

4. Configure environment variables:
   - Copy `.env.example` to `.env`
   - Update the variables with your configuration

## Running the Application

1. Start the backend server:
   ```bash
   cd backend
   uvicorn main:app --reload
   ```

2. Start the frontend development server:
   ```bash
   cd frontend
   npm start
   ```

3. Access the application at `http://localhost:3000`

## API Documentation

The API documentation is available at `http://localhost:8000/docs` when the backend server is running.

### Main Endpoints

- `POST /api/auth/register`: Register new user
- `POST /api/auth/login`: User login
- `POST /api/documents/upload`: Upload document
- `GET /api/documents`: List documents
- `GET /api/documents/{id}`: Get document details
- `GET /api/dashboard/stats`: Get dashboard statistics

## Development

### Backend Development

The backend is structured as follows:
- `main.py`: Main application entry point
- `services/`: Core service implementations
- `models.py`: Data models
- `utils/`: Utility functions

### Frontend Development

The frontend follows a modern React application structure:
- `src/components/`: Reusable UI components
- `src/pages/`: Page components
- `src/stores/`: State management
- `src/services/`: API integration

## Testing

1. Run backend tests:
   ```bash
   cd backend
   pytest
   ```

2. Run frontend tests:
   ```bash
   cd frontend
   npm test
   ```

## Deployment

### Backend Deployment

1. Set up a production MongoDB instance
2. Configure AWS services
3. Deploy to your preferred hosting service (e.g., AWS, Heroku)
4. Update environment variables

### Frontend Deployment

1. Build the production bundle:
   ```bash
   cd frontend
   npm run build
   ```
2. Deploy the `build` directory to your hosting service

## Security Considerations

- All API endpoints are protected with JWT authentication
- File uploads are validated and sanitized
- AWS credentials are securely managed
- Password hashing using bcrypt
- CORS configuration for production

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for AI capabilities
- AWS for cloud services
- Spacy for NLP features
- React and FastAPI communities 