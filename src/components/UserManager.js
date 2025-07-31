import React, { useState, useEffect } from 'react';
import { User, Plus, Trash2, LogIn, Database, Download, Upload } from 'lucide-react';

function UserManager({ onUserSelect, currentUser, onClose }) {
  const [users, setUsers] = useState([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', age: '', occupation: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Load saved users from localStorage on component mount
  useEffect(() => {
    loadSavedUsers();
  }, []);

  const loadSavedUsers = () => {
    try {
      const savedUsers = localStorage.getItem('clementine_saved_users');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      } else {
        // Initialize with some demo users
        const demoUsers = [
          {
            id: 'user_demo_1',
            name: 'Sarah Johnson',
            email: 'sarah.johnson@email.com',
            age: '28',
            occupation: 'Teacher',
            relationshipStatus: 'single',
            sessionCount: 5,
            lastActive: new Date().toISOString()
          },
          {
            id: 'user_demo_2', 
            name: 'Michael Chen',
            email: 'michael.chen@email.com',
            age: '35',
            occupation: 'Software Engineer',
            relationshipStatus: 'married',
            partnerName: 'Lisa',
            sessionCount: 12,
            lastActive: new Date().toISOString()
          },
          {
            id: 'user_demo_3',
            name: 'Emma Rodriguez',
            email: 'emma.rodriguez@email.com',
            age: '24',
            occupation: 'Nurse',
            relationshipStatus: 'dating',
            sessionCount: 3,
            lastActive: new Date().toISOString()
          }
        ];
        setUsers(demoUsers);
        localStorage.setItem('clementine_saved_users', JSON.stringify(demoUsers));
      }
    } catch (error) {
      console.error('Error loading saved users:', error);
    }
  };

  const saveUsers = (updatedUsers) => {
    try {
      localStorage.setItem('clementine_saved_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
    } catch (error) {
      console.error('Error saving users:', error);
    }
  };

  const generateUserId = (name, email) => {
    const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    const cleanEmail = email.toLowerCase().replace(/[^a-z0-9]/g, '');
    return `clementine_${cleanName}_${cleanEmail}_${Date.now()}`;
  };

  const handleAddUser = () => {
    if (!newUser.name.trim() || !newUser.email.trim()) {
      alert('Please fill in at least name and email');
      return;
    }

    const userId = generateUserId(newUser.name, newUser.email);
    const user = {
      id: userId,
      name: newUser.name.trim(),
      email: newUser.email.trim(),
      age: newUser.age.trim() || '25',
      occupation: newUser.occupation.trim() || 'Professional',
      relationshipStatus: 'single',
      sessionCount: 0,
      lastActive: new Date().toISOString()
    };

    const updatedUsers = [...users, user];
    saveUsers(updatedUsers);
    
    setNewUser({ name: '', email: '', age: '', occupation: '' });
    setShowAddUser(false);
  };

  const handleDeleteUser = (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      const updatedUsers = users.filter(user => user.id !== userId);
      saveUsers(updatedUsers);
      
      // Also clean up their localStorage data
      const userKeys = Object.keys(localStorage).filter(key => 
        key.includes(userId) || key.includes(userId.replace('clementine_', ''))
      );
      userKeys.forEach(key => localStorage.removeItem(key));
    }
  };

  const handleSelectUser = async (user) => {
    setIsLoading(true);
    
    try {
      // Clear current user data
      const keysToRemove = Object.keys(localStorage).filter(key => 
        key.startsWith('clementine_') && !key.includes('saved_users')
      );
      keysToRemove.forEach(key => localStorage.removeItem(key));

      // Set up new user credentials
      const credentials = {
        email: user.email,
        name: user.name,
        userID: user.id,
        loginTime: new Date().toISOString()
      };

      // Save new user data to localStorage
      localStorage.setItem('clementine_user_credentials', JSON.stringify(credentials));
      localStorage.setItem('clementine_user_id', user.id);
      localStorage.setItem('clementine_user_email', user.email);
      localStorage.setItem('clementine_user_name', user.name);
      
      // Set up some initial memory data
      localStorage.setItem('clementine_user_name', user.name);
      localStorage.setItem('clementine_user_age', user.age);
      localStorage.setItem('clementine_user_occupation', user.occupation);
      localStorage.setItem('clementine_relationship_status', user.relationshipStatus || 'single');
      if (user.partnerName) {
        localStorage.setItem('clementine_partner_name', user.partnerName);
      }
      localStorage.setItem('clementine_session_count', (user.sessionCount || 0).toString());
      localStorage.setItem('clementine_last_active', new Date().toISOString());

      // Update user's last active time
      const updatedUsers = users.map(u => 
        u.id === user.id 
          ? { ...u, lastActive: new Date().toISOString(), sessionCount: (u.sessionCount || 0) + 1 }
          : u
      );
      saveUsers(updatedUsers);

      console.log('✅ Switched to user:', user.name);
      
      // Call the parent callback
      onUserSelect(credentials);
      
      // Reload the page to ensure clean state
      setTimeout(() => {
        window.location.reload();
      }, 500);
      
    } catch (error) {
      console.error('Error switching user:', error);
      alert('Error switching user. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const exportUsers = () => {
    const dataStr = JSON.stringify(users, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'clementine_users.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importUsers = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedUsers = JSON.parse(e.target.result);
        if (Array.isArray(importedUsers)) {
          const mergedUsers = [...users];
          importedUsers.forEach(importedUser => {
            if (!mergedUsers.find(u => u.id === importedUser.id)) {
              mergedUsers.push(importedUser);
            }
          });
          saveUsers(mergedUsers);
          alert(`Imported ${importedUsers.length} users successfully!`);
        }
      } catch (error) {
        alert('Error importing users. Please check the file format.');
      }
    };
    reader.readAsText(file);
    event.target.value = ''; // Reset file input
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl mx-auto max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Database className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-800">User Manager</h2>
              <p className="text-sm text-gray-600">Switch between different user profiles</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Export/Import */}
            <button
              onClick={exportUsers}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Export Users"
            >
              <Download className="w-4 h-4" />
            </button>
            
            <label className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer" title="Import Users">
              <Upload className="w-4 h-4" />
              <input
                type="file"
                accept=".json"
                onChange={importUsers}
                className="hidden"
              />
            </label>
            
            {/* Add User Button */}
            <button
              onClick={() => setShowAddUser(!showAddUser)}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
              title="Add New User"
            >
              <Plus className="w-4 h-4" />
            </button>
            
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Add User Form */}
        {showAddUser && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <h3 className="text-lg font-semibold mb-4">Add New User</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Full Name *"
                value={newUser.name}
                onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="email"
                placeholder="Email Address *"
                value={newUser.email}
                onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Age (optional)"
                value={newUser.age}
                onChange={(e) => setNewUser(prev => ({ ...prev, age: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
              <input
                type="text"
                placeholder="Occupation (optional)"
                value={newUser.occupation}
                onChange={(e) => setNewUser(prev => ({ ...prev, occupation: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-3 mt-4">
              <button
                onClick={handleAddUser}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add User
              </button>
              <button
                onClick={() => setShowAddUser(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Current User */}
        {currentUser && (
          <div className="p-4 bg-green-50 border-b border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-green-800">Currently logged in as:</p>
                <p className="text-green-700">{currentUser.name} ({currentUser.email})</p>
              </div>
            </div>
          </div>
        )}

        {/* Users List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {users.map((user) => (
              <div
                key={user.id}
                className={`border rounded-xl p-4 transition-all hover:shadow-md ${
                  currentUser?.userID === user.id 
                    ? 'border-green-300 bg-green-50' 
                    : 'border-gray-200 hover:border-purple-300'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      currentUser?.userID === user.id ? 'bg-green-100' : 'bg-purple-100'
                    }`}>
                      <User className={`w-5 h-5 ${
                        currentUser?.userID === user.id ? 'text-green-600' : 'text-purple-600'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-800">{user.name}</h3>
                      <p className="text-xs text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteUser(user.id)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete User"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="space-y-1 text-xs text-gray-600 mb-3">
                  <p><span className="font-medium">Age:</span> {user.age}</p>
                  <p><span className="font-medium">Occupation:</span> {user.occupation}</p>
                  <p><span className="font-medium">Status:</span> {user.relationshipStatus}</p>
                  {user.partnerName && (
                    <p><span className="font-medium">Partner:</span> {user.partnerName}</p>
                  )}
                  <p><span className="font-medium">Sessions:</span> {user.sessionCount || 0}</p>
                  <p><span className="font-medium">Last Active:</span> {
                    new Date(user.lastActive).toLocaleDateString()
                  }</p>
                </div>

                {currentUser?.userID === user.id ? (
                  <div className="text-xs text-green-600 font-medium text-center py-2">
                    Currently Active
                  </div>
                ) : (
                  <button
                    onClick={() => handleSelectUser(user)}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white py-2 px-3 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center justify-center space-x-2 disabled:opacity-50"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{isLoading ? 'Switching...' : 'Switch to User'}</span>
                  </button>
                )}
              </div>
            ))}
          </div>

          {users.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">No Users Found</h3>
              <p className="text-gray-600 mb-4">Add your first user to get started</p>
              <button
                onClick={() => setShowAddUser(true)}
                className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Add First User
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default UserManager;
