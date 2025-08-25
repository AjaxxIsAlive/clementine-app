import React, { useState } from 'react';
import authService from '../services/authService';

function TestAdmin() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleAddTestUsers = async () => {
    setLoading(true);
    setMessage('');
    
    try {
      console.log('� Adding authenticated test users...');
      const result = await authService.createAuthenticatedTestUsers();
      
      if (result.success) {
        setMessage(`✅ Success: ${result.message}`);
        console.log('✅ Test users added successfully');
        loadUsers(); // Refresh the list
      } else {
        setMessage(`❌ Failed: ${result.error || 'Unknown error'}`);
        console.error('❌ Failed to add test users:', result);
      }
    } catch (error) {
      console.error('❌ Error adding test users:', error);
      setMessage(`❌ Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const result = await authService.debugListUsers();
      if (result.data) {
        setUsers(result.data);
        setMessage(`✅ Found ${result.data.length} users in database`);
      }
    } catch (error) {
      setMessage(`❌ Error loading users: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const testLogin = async (email) => {
    setMessage(`🔄 Testing login for ${email}...`);
    try {
      const result = await authService.login(email, 'test123');
      if (result.success) {
        setMessage(`✅ Login test successful for ${email}!`);
      } else {
        setMessage(`❌ Login test failed for ${email}: ${result.error}`);
      }
    } catch (error) {
      setMessage(`❌ Login test error: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">Test Admin Panel</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">User Management</h2>
          
          <div className="flex gap-4 mb-4">
            <button
              onClick={handleAddTestUsers}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Test Users'}
            </button>
            
            <button
              onClick={loadUsers}
              disabled={loading}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Load Users'}
            </button>
          </div>
          
          {message && (
            <div className="mb-4 p-3 rounded bg-gray-100 text-sm">
              {message}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Current Users ({users.length})</h2>
          
          {users.length === 0 ? (
            <p className="text-gray-500">No users loaded. Click "Load Users" to see current database users.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">Name</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Email</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">ID</th>
                    <th className="border border-gray-300 px-4 py-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.id || index} className="hover:bg-gray-50">
                      <td className="border border-gray-300 px-4 py-2">
                        {user.first_name || 'No Name'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        {user.email || 'No Email'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2 text-xs text-gray-500">
                        {user.id ? user.id.substring(0, 8) + '...' : 'No ID'}
                      </td>
                      <td className="border border-gray-300 px-4 py-2">
                        <button
                          onClick={() => testLogin(user.email)}
                          className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-1 rounded text-sm"
                          disabled={!user.email || loading}
                        >
                          Test Login
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-6">
          <a href="/" className="text-blue-500 hover:text-blue-600">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default TestAdmin;
