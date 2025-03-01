import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';
import { format } from 'date-fns';

interface Document {
  id: string;
  title: string;
  filename: string;
  uploadDate: string;
  fileType: string;
  categories: string[];
  summary: string;
}

export const Documents: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/documents', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setDocuments(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch documents');
        setLoading(false);
      }
    };

    fetchDocuments();
  }, [token]);

  const handleDownload = async (documentId: string, filename: string) => {
    try {
      const response = await axios.get(`http://localhost:8000/api/documents/${documentId}/download`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setError('Failed to download document');
    }
  };

  const handleDelete = async (documentId: string) => {
    if (!window.confirm('Are you sure you want to delete this document?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:8000/api/documents/${documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setDocuments(documents.filter(doc => doc.id !== documentId));
    } catch (err) {
      setError('Failed to delete document');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-600 text-center py-4">{error}</div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">My Documents</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {documents.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              No documents found. Upload some documents to get started!
            </div>
          ) : (
            <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-3">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-white rounded-lg shadow-md p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                      </svg>
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">{doc.title}</h3>
                        <p className="text-sm text-gray-500">{doc.fileType}</p>
                      </div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <p className="text-sm text-gray-600 line-clamp-3">{doc.summary}</p>
                  </div>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {doc.categories.map((category, index) => (
                      <span key={index} className="px-2 py-1 text-xs font-medium text-indigo-600 bg-indigo-100 rounded-full">
                        {category}
                      </span>
                    ))}
                  </div>
                  <div className="text-sm text-gray-500 mb-4">
                    Uploaded on {format(new Date(doc.uploadDate), 'MMM d, yyyy')}
                  </div>
                  <div className="flex justify-between">
                    <button
                      onClick={() => handleDownload(doc.id, doc.filename)}
                      className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                    >
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(doc.id)}
                      className="text-red-600 hover:text-red-900 text-sm font-medium"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
