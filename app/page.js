'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsData } from '../firebase';
import { 
  Users, 
  UserCheck, 
  Link2, 
  TrendingUp,
  Calendar,
  MapPin,
  Briefcase,
  Heart
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from 'recharts';

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    const data = await getAnalyticsData();
    setAnalytics(data);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-12">
        <p className="text-zinc-400">Failed to load analytics data</p>
        <button 
          onClick={loadAnalytics}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Users',
      value: analytics.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      textColor: 'text-blue-500'
    },
    {
      title: 'Complete Profiles',
      value: analytics.usersWithCompleteProfiles,
      subtitle: `${analytics.profileCompletionRate}% completion rate`,
      icon: UserCheck,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
    {
      title: 'Users with Social Links',
      value: analytics.usersWithSocialLinks,
      subtitle: `${((analytics.usersWithSocialLinks / analytics.totalUsers) * 100).toFixed(1)}% of users`,
      icon: Link2,
      color: 'bg-cyan-500',
      textColor: 'text-cyan-500'
    },
    {
      title: 'Growth This Month',
      value: analytics.signupsOverTime.length > 0 
        ? analytics.signupsOverTime[analytics.signupsOverTime.length - 1].count 
        : 0,
      icon: TrendingUp,
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#14b8a6', '#f97316'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
          <p className="text-zinc-400">Welcome to Crazeal Admin Panel</p>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
        >
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div
            key={index}
            className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10`}>
                <stat.icon className={stat.textColor} size={24} />
              </div>
            </div>
            <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
            <p className="text-zinc-400 text-sm">{stat.title}</p>
            {stat.subtitle && (
              <p className="text-zinc-500 text-xs mt-1">{stat.subtitle}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Creative Fields */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <Briefcase className="text-blue-500 mr-3" size={20} />
            <h2 className="text-xl font-semibold">Top Creative Fields</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.creativeFieldsData.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis 
                dataKey="name" 
                stroke="#71717a"
                tick={{ fontSize: 12, fill: '#a1a1aa' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa' }} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
              <Bar dataKey="count" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Creative Fields Distribution */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <Briefcase className="text-green-500 mr-3" size={20} />
            <h2 className="text-xl font-semibold">Field Distribution</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={analytics.creativeFieldsData.slice(0, 6)}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percentage }) => `${name}: ${percentage}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {analytics.creativeFieldsData.slice(0, 6).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Signups Over Time */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <Calendar className="text-cyan-500 mr-3" size={20} />
          <h2 className="text-xl font-semibold">User Signups Over Time</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={analytics.signupsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              dataKey="month" 
              stroke="#71717a"
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
            />
            <YAxis stroke="#71717a" tick={{ fill: '#a1a1aa' }} />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="count" 
              stroke="#06b6d4" 
              strokeWidth={2}
              dot={{ fill: '#06b6d4', r: 4 }}
              activeDot={{ r: 6 }}
              name="New Users"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Bottom Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Locations */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <MapPin className="text-orange-500 mr-3" size={20} />
            <h2 className="text-xl font-semibold">Top Locations</h2>
          </div>
          <div className="space-y-3">
            {analytics.locationData.slice(0, 10).map((location, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-zinc-500 font-mono text-sm w-6">#{index + 1}</span>
                  <span className="text-white">{location.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-orange-500 h-full rounded-full transition-all"
                      style={{ width: `${location.percentage}%` }}
                    />
                  </div>
                  <span className="text-zinc-400 font-mono text-sm w-16 text-right">
                    {location.count} ({location.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Hobbies */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center mb-6">
            <Heart className="text-pink-500 mr-3" size={20} />
            <h2 className="text-xl font-semibold">Popular Hobbies</h2>
          </div>
          <div className="space-y-3">
            {analytics.hobbiesData.slice(0, 10).map((hobby, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-zinc-500 font-mono text-sm w-6">#{index + 1}</span>
                  <span className="text-white">{hobby.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-32 bg-zinc-800 rounded-full h-2 overflow-hidden">
                    <div 
                      className="bg-pink-500 h-full rounded-full transition-all"
                      style={{ width: `${hobby.percentage}%` }}
                    />
                  </div>
                  <span className="text-zinc-400 font-mono text-sm w-16 text-right">
                    {hobby.count} ({hobby.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Users */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Users className="text-blue-500 mr-3" size={20} />
            <h2 className="text-xl font-semibold">Recent Users</h2>
          </div>
          <a 
            href="/users"
            className="text-blue-500 hover:text-blue-400 text-sm transition-colors"
          >
            View All →
          </a>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">User</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Location</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Creative Fields</th>
                <th className="text-left py-3 px-4 text-zinc-400 font-medium text-sm">Joined</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recentUsers.map((user, index) => (
                <tr key={index} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      {user.avatar ? (
                        <img 
                          src={user.avatar} 
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                          <span className="text-lg font-semibold">
                            {user.name?.charAt(0).toUpperCase() || '?'}
                          </span>
                        </div>
                      )}
                      <div>
                        <p className="font-medium">{user.name || 'Unknown'}</p>
                        <p className="text-sm text-zinc-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-zinc-300">
                    {user.location || 'Not specified'}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex flex-wrap gap-1">
                      {(user.creativeFields || user.specialization || []).slice(0, 2).map((field, i) => (
                        <span 
                          key={i}
                          className="px-2 py-1 bg-zinc-800 text-zinc-300 text-xs rounded"
                        >
                          {field.label || field.value || field}
                        </span>
                      ))}
                      {(user.creativeFields || user.specialization || []).length > 2 && (
                        <span className="px-2 py-1 bg-zinc-800 text-zinc-400 text-xs rounded">
                          +{(user.creativeFields || user.specialization || []).length - 2}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4 text-zinc-400 text-sm">
                    {(() => {
                      try {
                        if (!user.createdAt) return 'Unknown';
                        const date = user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt);
                        if (isNaN(date.getTime())) return 'Invalid Date';
                        return format(date, 'MMM d, yyyy');
                      } catch (error) {
                        return 'Unknown';
                      }
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
