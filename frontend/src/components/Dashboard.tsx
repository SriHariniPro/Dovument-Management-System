import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuthStore } from '../stores/authStore';

interface DocumentStats {
  total: number;
  categories: { [key: string]: number };
  recentUploads: Array<{
    id: string;
    name: string;
    uploadDate: string;
    category: string;
  }>;
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useAuthStore(state => state.token);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/documents', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Process the response to get stats
        const documents = response.data;
        const categories: { [key: string]: number } = {};
        documents.forEach((doc: any) => {
          categories[doc.category] = (categories[doc.category] || 0) + 1;
        });

        setStats({
          total: documents.length,
          categories,
          recentUploads: documents.slice(0, 5)
        });
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      </div>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <div className="py-4">
          {/* Stats Grid */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {/* Total Documents */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <svg className="h-6 w-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">Total Documents</dt>
                      <dd className="text-lg font-medium text-gray-900">{stats?.total || 0}</dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            {/* Categories */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Categories</h3>
                <div className="mt-5">
                  {stats?.categories && Object.entries(stats.categories).map(([category, count]) => (
                    <div key={category} className="flex justify-between items-center mt-2">
                      <span className="text-sm text-gray-500">{category}</span>
                      <span className="text-sm font-medium text-gray-900">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Uploads */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Recent Uploads</h3>
                <div className="mt-5">
                  {stats?.recentUploads.map((doc) => (
                    <div key={doc.id} className="mt-2">
                      <p className="text-sm font-medium text-gray-900">{doc.name}</p>
                      <p className="text-sm text-gray-500">{new Date(doc.uploadDate).toLocaleDateString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 
