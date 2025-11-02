'use client';

import { useEffect, useState } from 'react';
import { searchUsers, updateUserProfile, deleteUserProfile, getAllProfiles } from '../../firebase';
import { 
  Search, 
  Filter, 
  Download,
  Edit,
  Trash2,
  X,
  Save,
  ChevronUp,
  ChevronDown,
  Mail,
  MapPin,
  Briefcase,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    creativeField: '',
    location: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const [editingUser, setEditingUser] = useState(null);
  const [showFilters, setShowFilters] = useState(false);
  const [availableFields, setAvailableFields] = useState([]);
  const [availableLocations, setAvailableLocations] = useState([]);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    performSearch();
  }, [searchTerm, filters, users]);

  const loadUsers = async () => {
    setLoading(true);
    const allUsers = await getAllProfiles();
    setUsers(allUsers);
    
    // Extract unique creative fields and locations for filters
    const fields = new Set();
    const locations = new Set();
    
    allUsers.forEach(user => {
      (user.creativeFields || user.specialization || []).forEach(field => {
        const fieldName = field.label || field.value || field;
        if (fieldName) fields.add(fieldName);
      });
      if (user.location) locations.add(user.location);
    });
    
    setAvailableFields(Array.from(fields).sort());
    setAvailableLocations(Array.from(locations).sort());
    setLoading(false);
  };

  const performSearch = async () => {
    const results = await searchUsers(searchTerm, filters);
    setFilteredUsers(results);
  };

  const handleSort = (field) => {
    setFilters(prev => ({
      ...prev,
      sortBy: field,
      sortOrder: prev.sortBy === field && prev.sortOrder === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleEdit = (user) => {
    setEditingUser({ ...user });
  };

  const handleSaveEdit = async () => {
    if (!editingUser) return;
    
    const result = await updateUserProfile(editingUser.id, editingUser);
    if (result.success) {
      await loadUsers();
      setEditingUser(null);
      alert('User updated successfully!');
    } else {
      alert('Failed to update user: ' + result.error);
    }
  };

  const handleDelete = async (userId, userName) => {
    if (!confirm(`Are you sure you want to delete ${userName}? This action cannot be undone.`)) {
      return;
    }
    
    const result = await deleteUserProfile(userId);
    if (result.success) {
      await loadUsers();
      alert('User deleted successfully!');
    } else {
      alert('Failed to delete user: ' + result.error);
    }
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Location', 'Creative Fields', 'Hobbies', 'Joined Date'];
    const rows = filteredUsers.map(user => [
      user.name || '',
      user.email || '',
      user.location || '',
      (user.creativeFields || user.specialization || []).map(f => f.label || f.value || f).join('; '),
      (user.hobbies || []).map(h => h.label || h.value || h).join('; '),
      user.createdAt ? format(
        user.createdAt.toDate ? user.createdAt.toDate() : new Date(user.createdAt),
        'yyyy-MM-dd'
      ) : ''
    ]);
    
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crazeal-users-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const SortIcon = ({ field }) => {
    if (filters.sortBy !== field) return null;
    return filters.sortOrder === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-zinc-400">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">User Management</h1>
          <p className="text-zinc-400">Manage and view all registered users</p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
        >
          <Download size={18} />
          Export CSV
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, location, bio, fields..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg pl-10 pr-4 py-3 text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
          </div>
          
          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors border border-zinc-700"
          >
            <Filter size={18} />
            Filters
          </button>
        </div>

        {/* Filter Options */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-zinc-800 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Creative Field
              </label>
              <select
                value={filters.creativeField}
                onChange={(e) => setFilters(prev => ({ ...prev, creativeField: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Fields</option>
                {availableFields.map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Location
              </label>
              <select
                value={filters.location}
                onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
              >
                <option value="">All Locations</option>
                {availableLocations.map(location => (
                  <option key={location} value={location}>{location}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Results Count */}
        <div className="mt-4 text-sm text-zinc-400">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-zinc-950 border-b border-zinc-800">
              <tr>
                <th 
                  className="text-left py-4 px-4 text-zinc-300 font-medium text-sm cursor-pointer hover:bg-zinc-900"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    User <SortIcon field="name" />
                  </div>
                </th>
                <th 
                  className="text-left py-4 px-4 text-zinc-300 font-medium text-sm cursor-pointer hover:bg-zinc-900"
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center gap-2">
                    Location <SortIcon field="location" />
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-zinc-300 font-medium text-sm">
                  Creative Fields
                </th>
                <th 
                  className="text-left py-4 px-4 text-zinc-300 font-medium text-sm cursor-pointer hover:bg-zinc-900"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center gap-2">
                    Joined <SortIcon field="createdAt" />
                  </div>
                </th>
                <th className="text-left py-4 px-4 text-zinc-300 font-medium text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr key={user.id} className="border-b border-zinc-800 hover:bg-zinc-800/50 transition-colors">
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
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="p-2 text-blue-500 hover:bg-blue-500/10 rounded transition-colors"
                        title="Edit user"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id, user.name)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete user"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-zinc-400">
            No users found matching your criteria
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-zinc-900 border-b border-zinc-800 p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">Edit User</h2>
              <button
                onClick={() => setEditingUser(null)}
                className="p-2 hover:bg-zinc-800 rounded transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Basic Info */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editingUser.name || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Email (Read Only)
                </label>
                <input
                  type="email"
                  value={editingUser.email || ''}
                  disabled
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-zinc-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Location
                </label>
                <input
                  type="text"
                  value={editingUser.location || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, location: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Bio
                </label>
                <textarea
                  value={editingUser.bio || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, bio: e.target.value }))}
                  rows={4}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Movie Title (Life as a Movie)
                </label>
                <input
                  type="text"
                  value={editingUser.movieTitle || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, movieTitle: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Avatar & Banner URLs */}
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Avatar URL
                </label>
                <input
                  type="text"
                  value={editingUser.avatar || ''}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, avatar: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Banner Color (Hex)
                </label>
                <input
                  type="text"
                  value={editingUser.bannerColor || '#adcbed'}
                  onChange={(e) => setEditingUser(prev => ({ ...prev, bannerColor: e.target.value }))}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-zinc-900 border-t border-zinc-800 p-6 flex items-center justify-end gap-4">
              <button
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                <Save size={18} />
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

