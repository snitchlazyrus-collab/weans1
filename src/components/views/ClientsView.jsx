import React from 'react';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

const ClientsView = () => {
  const { 
    users, 
    clients, 
    clientAssignments,
    addClient, 
    deleteClient,
    assignUserToClient, 
    removeUserFromClient,
    calculateCoverageReport,
    setError 
  } = useApp();
  const { currentUser } = useAuth();

  const handleAddClient = () => {
    const name = document.getElementById('client-name').value;
    if (!name) {
      setError('Enter client name!');
      return;
    }

    const hours = {};
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      const start = document.getElementById(`client-${day}-start`).value;
      const end = document.getElementById(`client-${day}-end`).value;
      if (start && end) {
        hours[day] = { start, end };
      }
    });

    addClient(name, hours, currentUser);
    document.getElementById('client-name').value = '';
    ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].forEach(day => {
      document.getElementById(`client-${day}-start`).value = '';
      document.getElementById(`client-${day}-end`).value = '';
    });
  };

  const handleAssignUser = () => {
    const clientId = document.getElementById('assign-client').value;
    const empId = document.getElementById('assign-user').value;
    if (!clientId || !empId) {
      setError('Select both client and employee!');
      return;
    }
    assignUserToClient(empId, clientId, currentUser);
  };

  const handleGenerateReport = () => {
    const clientId = document.getElementById('report-client').value;
    const date = document.getElementById('report-date').value;
    if (!clientId || !date) {
      setError('Select client and date!');
      return;
    }

    const report = calculateCoverageReport(clientId, date);
    console.log('Coverage Report:', report);
    alert(JSON.stringify(report, null, 2));
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <h2 className="text-3xl font-bold mb-4">🏢 Client Management</h2>

      {/* Add New Client */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h3 className="text-xl font-bold mb-3">Add New Client</h3>
        <input
          type="text"
          placeholder="Client Name"
          className="w-full p-3 border rounded mb-3"
          id="client-name"
        />

        <h4 className="font-bold mb-2">Business Hours</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
          {['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'].map(day => (
            <div key={day} className="border p-3 rounded">
              <h4 className="font-bold capitalize mb-2">{day}</h4>
              <input type="time" className="w-full p-2 border rounded mb-2" id={`client-${day}-start`} />
              <input type="time" className="w-full p-2 border rounded" id={`client-${day}-end`} />
            </div>
          ))}
        </div>

        <button
          onClick={handleAddClient}
          className="bg-green-500 text-white px-6 py-3 rounded font-bold hover:bg-green-600"
        >
          Add Client
        </button>
      </div>

      {/* Current Clients */}
      <div className="mb-6">
        <h3 className="text-xl font-bold mb-3">Current Clients</h3>
        <div className="space-y-3">
          {Object.entries(clients).map(([clientId, client]) => (
            <div key={clientId} className="border p-4 rounded bg-gray-50">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-bold text-lg">{client.name}</h4>
                <button
                  onClick={() => deleteClient(clientId, currentUser)}
                  className="bg-red-500 text-white px-3 py-1 rounded text-sm font-bold hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {Object.entries(client.businessHours || {}).map(([day, hours]) => (
                  <div key={day} className="text-sm">
                    <strong className="capitalize">{day}:</strong> {hours.start} - {hours.end}
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <p className="font-semibold text-sm mb-2">Assigned Users:</p>
                <div className="flex flex-wrap gap-2">
                  {(clientAssignments[clientId] || []).map(empId => {
                    const user = Object.values(users).find(u => u.employeeId === empId);
                    return (
                      <div key={empId} className="bg-blue-100 px-3 py-1 rounded text-sm flex items-center gap-2">
                        <span>{user?.name || empId}</span>
                        <button
                          onClick={() => removeUserFromClient(empId, clientId, currentUser)}
                          className="text-red-600 hover:text-red-800 font-bold"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                  {(clientAssignments[clientId] || []).length === 0 && (
                    <span className="text-gray-500 text-sm">No users assigned</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {Object.keys(clients).length === 0 && (
            <p className="text-gray-500 text-center py-8">No clients added yet.</p>
          )}
        </div>
      </div>

      {/* Assign Users to Clients */}
      <div className="mb-6 p-4 bg-purple-50 rounded-lg">
        <h3 className="text-xl font-bold mb-3">Assign Users to Clients</h3>
        <select className="w-full p-3 border rounded mb-3" id="assign-client">
          <option value="">Select Client</option>
          {Object.entries(clients).map(([id, client]) => (
            <option key={id} value={id}>{client.name}</option>
          ))}
        </select>

        <select className="w-full p-3 border rounded mb-3" id="assign-user">
          <option value="">Select Employee</option>
          {Object.entries(users).map(([username, user]) => (
            user.role !== 'admin' && (
              <option key={username} value={user.employeeId}>
                {user.name} ({user.employeeId})
              </option>
            )
          ))}
        </select>

        <button
          onClick={handleAssignUser}
          className="bg-purple-500 text-white px-6 py-3 rounded font-bold hover:bg-purple-600"
        >
          Assign User
        </button>
      </div>

      {/* Coverage Report */}
      <div className="p-4 bg-indigo-50 rounded-lg">
        <h3 className="text-xl font-bold mb-3">Coverage Report</h3>
        <select className="w-full p-3 border rounded mb-3" id="report-client">
          <option value="">Select Client</option>
          {Object.entries(clients).map(([id, client]) => (
            <option key={id} value={id}>{client.name}</option>
          ))}
        </select>

        <input type="date" className="w-full p-3 border rounded mb-3" id="report-date" />

        <button
          onClick={handleGenerateReport}
          className="bg-indigo-500 text-white px-6 py-3 rounded font-bold hover:bg-indigo-600"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
};

export default ClientsView;
