import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  DocumentTextIcon,
  DocumentMagnifyingGlassIcon,
  DocumentPlusIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';

interface DashboardStats {
  totalDocuments: number;
  processedToday: number;
  pendingAnalysis: number;
  storageUsed: string;
}

interface RecentDocument {
  id: string;
  title: string;
  category: string;
  uploadedAt: string;
  status: 'processed' | 'processing' | 'failed';
}

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    processedToday: 0,
    pendingAnalysis: 0,
    storageUsed: '0 MB',
  });

  const [recentDocuments, setRecentDocuments] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsResponse, documentsResponse] = await Promise.all([
          axios.get('http://localhost:8000/api/dashboard/stats'),
          axios.get('http://localhost:8000/api/dashboard/recent-documents'),
        ]);

        setStats(statsResponse.data);
        setRecentDocuments(documentsResponse.data);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const stats_items = [
    {
      name: 'Total Documents',
      value: stats.totalDocuments,
      icon: DocumentTextIcon,
      change: '+4.75%',
      changeType: 'positive',
    },
    {
      name: 'Processed Today',
      value: stats.processedToday,
      icon: DocumentMagnifyingGlassIcon,
      change: '+54.02%',
      changeType: 'positive',
    },
    {
      name: 'Pending Analysis',
      value: stats.pendingAnalysis,
      icon: DocumentPlusIcon,
      change: '-1.39%',
      changeType: 'negative',
    },
    {
      name: 'Storage Used',
      value: stats.storageUsed,
      icon: ChartBarIcon,
      change: '+10.18%',
      changeType: 'positive',
    },
  ];

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="bg-gray-200 h-4 w-1/3 mb-4 rounded"></div>
                <div className="bg-gray-300 h-8 w-1/2 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats_items.map((item) => (
          <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <item.icon className="h-6 w-6 text-gray-400" aria-hidden="true" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                    <dd className="flex items-baseline">
                      <div className="text-2xl font-semibold text-gray-900">{item.value}</div>
                      <div
                        className={`ml-2 flex items-baseline text-sm font-semibold ${
                          item.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                        }`}
                      >
                        {item.change}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <div className="sm:flex sm:items-center">
          <div className="sm:flex-auto">
            <h2 className="text-base font-semibold leading-6 text-gray-900">Recent Documents</h2>
            <p className="mt-2 text-sm text-gray-700">
              A list of all recently uploaded and processed documents.
            </p>
          </div>
          <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
            <Link
              to="/upload"
              className="block rounded-md bg-indigo-600 px-3 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Upload Document
            </Link>
          </div>
        </div>

        <div className="mt-8 flow-root">
          <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
              <table className="min-w-full divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0">
                      Title
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Category
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Uploaded
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentDocuments.map((document) => (
                    <tr key={document.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-gray-900 sm:pl-0">
                        <Link to={`/documents/${document.id}`} className="text-indigo-600 hover:text-indigo-900">
                          {document.title}
                        </Link>
                      </td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{document.category}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{document.uploadedAt}</td>
                      <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
                            document.status === 'processed'
                              ? 'bg-green-50 text-green-700 ring-1 ring-inset ring-green-600/20'
                              : document.status === 'processing'
                              ? 'bg-yellow-50 text-yellow-700 ring-1 ring-inset ring-yellow-600/20'
                              : 'bg-red-50 text-red-700 ring-1 ring-inset ring-red-600/20'
                          }`}
                        >
                          {document.status.charAt(0).toUpperCase() + document.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 