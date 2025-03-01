import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { CloudArrowUpIcon, DocumentTextIcon, XMarkIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

interface UploadedFile {
  file: File;
  progress: number;
  status: 'waiting' | 'uploading' | 'processing' | 'complete' | 'error';
  error?: string;
}

export function Upload() {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const navigate = useNavigate();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = acceptedFiles.map(file => ({
      file,
      progress: 0,
      status: 'waiting' as const,
    }));
    setFiles(prev => [...prev, ...newFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
  });

  const uploadFile = async (file: UploadedFile) => {
    const formData = new FormData();
    formData.append('file', file.file);

    try {
      setFiles(prev =>
        prev.map(f =>
          f === file ? { ...f, status: 'uploading', progress: 0 } : f
        )
      );

      const response = await axios.post('http://localhost:8000/api/documents/upload', formData, {
        onUploadProgress: (progressEvent) => {
          const progress = progressEvent.loaded / (progressEvent.total || 0) * 100;
          setFiles(prev =>
            prev.map(f =>
              f === file ? { ...f, progress } : f
            )
          );
        },
      });

      setFiles(prev =>
        prev.map(f =>
          f === file ? { ...f, status: 'processing', progress: 100 } : f
        )
      );

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      setFiles(prev =>
        prev.map(f =>
          f === file ? { ...f, status: 'complete' } : f
        )
      );

      // Navigate to the document page after successful upload
      navigate(`/documents/${response.data.document_id}`);
    } catch (error) {
      setFiles(prev =>
        prev.map(f =>
          f === file ? { ...f, status: 'error', error: 'Upload failed' } : f
        )
      );
    }
  };

  const removeFile = (file: UploadedFile) => {
    setFiles(prev => prev.filter(f => f !== file));
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold leading-6 text-gray-900">Upload Documents</h1>
          <p className="mt-2 text-sm text-gray-700">
            Upload your documents for AI-powered analysis and organization.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div
          {...getRootProps()}
          className={`
            relative block w-full rounded-lg border-2 border-dashed p-12 text-center
            ${isDragActive
              ? 'border-indigo-600 bg-indigo-50'
              : 'border-gray-300 hover:border-indigo-600'
            }
          `}
        >
          <input {...getInputProps()} />
          <CloudArrowUpIcon
            className="mx-auto h-12 w-12 text-gray-400"
            aria-hidden="true"
          />
          <span className="mt-2 block text-sm font-semibold text-gray-900">
            {isDragActive
              ? 'Drop your files here'
              : 'Drag and drop files, or click to select'
          }
          </span>
          <span className="mt-2 block text-sm text-gray-500">
            Support for PDF, Word documents, and images
          </span>
        </div>

        {files.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-medium text-gray-900">Files</h2>
            <ul className="mt-4 divide-y divide-gray-200 border-t border-b border-gray-200">
              {files.map((file, index) => (
                <li key={index} className="flex items-center justify-between py-4">
                  <div className="flex items-center">
                    <DocumentTextIcon
                      className="h-6 w-6 text-gray-400"
                      aria-hidden="true"
                    />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-900">
                        {file.file.name}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(file.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <div className="ml-4 flex items-center space-x-4">
                    {file.status === 'waiting' && (
                      <button
                        type="button"
                        onClick={() => uploadFile(file)}
                        className="rounded bg-indigo-600 px-2 py-1 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
                      >
                        Upload
                      </button>
                    )}
                    {file.status === 'uploading' && (
                      <div className="w-24">
                        <div className="h-1.5 w-full rounded-full bg-gray-200">
                          <div
                            className="h-1.5 rounded-full bg-indigo-600 transition-all"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {file.status === 'processing' && (
                      <span className="text-sm text-gray-500">Processing...</span>
                    )}
                    {file.status === 'complete' && (
                      <span className="text-sm text-green-600">Complete</span>
                    )}
                    {file.status === 'error' && (
                      <span className="text-sm text-red-600">{file.error}</span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeFile(file)}
                      className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
} 