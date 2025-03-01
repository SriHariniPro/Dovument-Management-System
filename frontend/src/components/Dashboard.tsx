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

const Dashboard: React.FC = () => {
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
    <div className="bg-white shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-blue-700">Total Documents</h2>
          <p className="text-3xl font-bold text-blue-900">{stats?.total || 0}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-green-700">Processed Today</h2>
          <p className="text-3xl font-bold text-green-900">0</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg">
          <h2 className="text-lg font-semibold text-purple-700">Storage Used</h2>
          <p className="text-3xl font-bold text-purple-900">0 MB</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-gray-50 p-4 rounded-lg">
          <p className="text-gray-600">No recent activity</p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 
