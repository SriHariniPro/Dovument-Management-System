import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

interface UploadState {
  uploading: boolean;
  error: string | null;
  success: boolean;
}

export const Upload: React.FC = () => {
  const [state, setState] = useState<UploadState>({
    uploading: false,
    error: null,
    success: false,
  });
  const token = useAuthStore(state => state.token);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setState({ uploading: true, error: null, success: false });

    const formData = new FormData();
    formData.append('file', acceptedFiles[0]);

    try {
      await axios.post('http://localhost:8000/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`,
        },
      });

      setState({ uploading: false, error: null, success: true });
    } catch (error) {
      setState({
        uploading: false,
        error: 'Failed to upload document. Please try again.',
        success: false,
      });
    }
  }, [token]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/plain': ['.txt'],
    },
  });

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Upload Document</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          <div {...getRootProps()} className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md ${isDragActive ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
            <div className="space-y-1 text-center">
              <input {...getInputProps()} />
              <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <div className="flex text-sm text-gray-600">
                <label className="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">PDF, DOC, DOCX or TXT up to 10MB</p>
            </div>
          </div>

          {state.uploading && (
            <div className="mt-4 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {state.error && (
            <div className="mt-4 text-red-600 text-center">{state.error}</div>
          )}

          {state.success && (
            <div className="mt-4 text-green-600 text-center">
              Document uploaded successfully!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 
