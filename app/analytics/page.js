'use client';

import { useEffect, useState } from 'react';
import { getAnalyticsData } from '../../firebase';
import { 
  TrendingUp,
  Users,
  Calendar,
  Target,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
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
  Legend,
  AreaChart,
  Area,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all');

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

  const COLORS = {
    primary: ['#3b82f6', '#2563eb', '#1d4ed8', '#1e40af', '#1e3a8a'],
    success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
    warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
    danger: ['#ef4444', '#dc2626', '#b91c1c', '#991b1b', '#7f1d1d'],
    cyan: ['#06b6d4', '#0891b2', '#0e7490', '#155e75', '#164e63'],
    pink: ['#ec4899', '#db2777', '#be185d', '#9d174d', '#831843'],
    purple: ['#a855f7', '#9333ea', '#7e22ce', '#6b21a8', '#581c87'],
    mixed: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899', '#a855f7', '#f97316']
  };

  // Prepare radar chart data for top creative fields
  const radarData = analytics.creativeFieldsData.slice(0, 6).map(field => ({
    field: field.name.length > 15 ? field.name.substring(0, 15) + '...' : field.name,
    count: field.count,
    fullName: field.name
  }));

  // Calculate growth rate
  const calculateGrowthRate = () => {
    if (analytics.signupsOverTime.length < 2) return 0;
    const recent = analytics.signupsOverTime[analytics.signupsOverTime.length - 1]?.count || 0;
    const previous = analytics.signupsOverTime[analytics.signupsOverTime.length - 2]?.count || 1;
    return (((recent - previous) / previous) * 100).toFixed(1);
  };

  const growthRate = calculateGrowthRate();

  // Engagement metrics
  const engagementScore = ((analytics.usersWithCompleteProfiles / analytics.totalUsers) * 100).toFixed(1);
  const socialLinkScore = ((analytics.usersWithSocialLinks / analytics.totalUsers) * 100).toFixed(1);
  
  // Average fields per user
  const avgFieldsPerUser = analytics.creativeFieldsData.length > 0
    ? (analytics.creativeFieldsData.reduce((sum, field) => sum + field.count, 0) / analytics.totalUsers).toFixed(1)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Advanced Analytics</h1>
          <p className="text-zinc-400">Deep insights into user behavior and trends</p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">All Time</option>
            <option value="year">This Year</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
          <button
            onClick={loadAnalytics}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-blue-900/50 to-blue-950/30 border border-blue-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="text-blue-400" size={24} />
            <span className={`text-sm font-semibold px-2 py-1 rounded ${
              growthRate >= 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
            }`}>
              {growthRate >= 0 ? '+' : ''}{growthRate}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{analytics.totalUsers}</h3>
          <p className="text-zinc-400 text-sm">Total Users</p>
        </div>

        <div className="bg-gradient-to-br from-green-900/50 to-green-950/30 border border-green-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Target className="text-green-400" size={24} />
            <span className="text-sm font-semibold px-2 py-1 rounded bg-green-500/20 text-green-400">
              {engagementScore}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{analytics.usersWithCompleteProfiles}</h3>
          <p className="text-zinc-400 text-sm">Complete Profiles</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-900/50 to-cyan-950/30 border border-cyan-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="text-cyan-400" size={24} />
            <span className="text-sm font-semibold px-2 py-1 rounded bg-cyan-500/20 text-cyan-400">
              {socialLinkScore}%
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{analytics.usersWithSocialLinks}</h3>
          <p className="text-zinc-400 text-sm">Social Connections</p>
        </div>

        <div className="bg-gradient-to-br from-orange-900/50 to-orange-950/30 border border-orange-800/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <BarChart3 className="text-orange-400" size={24} />
            <span className="text-sm font-semibold px-2 py-1 rounded bg-orange-500/20 text-orange-400">
              Avg
            </span>
          </div>
          <h3 className="text-2xl font-bold text-white mb-1">{avgFieldsPerUser}</h3>
          <p className="text-zinc-400 text-sm">Fields per User</p>
        </div>
      </div>

      {/* Growth & Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* User Growth Area Chart */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Calendar className="text-blue-500 mr-3" size={20} />
              <h2 className="text-xl font-semibold">User Growth Trend</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={analytics.signupsOverTime}>
              <defs>
                <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
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
              <Area 
                type="monotone" 
                dataKey="count" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorUsers)"
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar Chart for Creative Fields */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <Target className="text-cyan-500 mr-3" size={20} />
              <h2 className="text-xl font-semibold">Field Distribution Radar</h2>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#3f3f46" />
              <PolarAngleAxis 
                dataKey="field" 
                stroke="#a1a1aa"
                tick={{ fill: '#a1a1aa', fontSize: 11 }}
              />
              <PolarRadiusAxis stroke="#71717a" tick={{ fill: '#a1a1aa' }} />
              <Radar 
                name="User Count" 
                dataKey="count" 
                stroke="#06b6d4" 
                fill="#06b6d4" 
                fillOpacity={0.6} 
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name, props) => [value, props.payload.fullName]}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Creative Fields Analysis */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <PieChartIcon className="text-green-500 mr-3" size={20} />
          <h2 className="text-xl font-semibold">Complete Creative Fields Breakdown</h2>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div>
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={analytics.creativeFieldsData.slice(0, 10)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => {
                    if (parseFloat(percentage) < 5) return '';
                    return `${percentage}%`;
                  }}
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {analytics.creativeFieldsData.slice(0, 10).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS.mixed[index % COLORS.mixed.length]} />
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

          {/* List View */}
          <div className="space-y-2">
            {analytics.creativeFieldsData.slice(0, 10).map((field, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg hover:bg-zinc-800 transition-colors">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: COLORS.mixed[index % COLORS.mixed.length] }}
                  />
                  <span className="text-white font-medium">{field.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-white font-semibold">{field.count}</p>
                    <p className="text-zinc-400 text-xs">{field.percentage}%</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Hobbies & Interests */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <BarChart3 className="text-pink-500 mr-3" size={20} />
          <h2 className="text-xl font-semibold">Top Hobbies & Interests</h2>
        </div>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart 
            data={analytics.hobbiesData.slice(0, 12)}
            layout="horizontal"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis 
              type="number"
              stroke="#71717a"
              tick={{ fill: '#a1a1aa' }}
            />
            <YAxis 
              type="category"
              dataKey="name" 
              stroke="#71717a"
              tick={{ fontSize: 12, fill: '#a1a1aa' }}
              width={100}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff'
              }}
            />
            <Bar dataKey="count" fill="#ec4899" radius={[0, 8, 8, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Geographic Distribution */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex items-center mb-6">
          <Users className="text-orange-500 mr-3" size={20} />
          <h2 className="text-xl font-semibold">Geographic Distribution</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.locationData.slice(0, 15).map((location, index) => (
            <div key={index} className="bg-zinc-800/50 rounded-lg p-4 hover:bg-zinc-800 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <span className="text-white font-medium">{location.name}</span>
                <span className="text-zinc-400 text-sm">{location.count}</span>
              </div>
              <div className="w-full bg-zinc-700 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-full rounded-full transition-all"
                  style={{ width: `${location.percentage}%` }}
                />
              </div>
              <p className="text-zinc-500 text-xs mt-1">{location.percentage}% of users</p>
            </div>
          ))}
        </div>
      </div>

      {/* Engagement Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Completion</h3>
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">Completion Rate</span>
              <span className="text-white font-bold">{analytics.profileCompletionRate}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all"
                style={{ width: `${analytics.profileCompletionRate}%` }}
              />
            </div>
            <p className="text-zinc-500 text-sm mt-3">
              {analytics.usersWithCompleteProfiles} out of {analytics.totalUsers} users have complete profiles
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Social Connectivity</h3>
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">Connection Rate</span>
              <span className="text-white font-bold">{socialLinkScore}%</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-3 overflow-hidden">
              <div 
                className="bg-gradient-to-r from-cyan-500 to-cyan-600 h-full rounded-full transition-all"
                style={{ width: `${socialLinkScore}%` }}
              />
            </div>
            <p className="text-zinc-500 text-sm mt-3">
              {analytics.usersWithSocialLinks} users have added social links
            </p>
          </div>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <h3 className="text-lg font-semibold mb-4">Creative Diversity</h3>
          <div className="relative pt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-zinc-400">Unique Fields</span>
              <span className="text-white font-bold">{analytics.creativeFieldsData.length}</span>
            </div>
            <div className="space-y-2 mt-3">
              <p className="text-zinc-500 text-sm">
                Average {avgFieldsPerUser} fields per user
              </p>
              <p className="text-zinc-500 text-sm">
                {analytics.hobbiesData.length} unique hobbies tracked
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

