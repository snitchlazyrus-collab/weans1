import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';

const LocationTrackingDashboard = () => {
  const { users, db } = useApp();
  const [locationLogs, setLocationLogs] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toDateString());
  const [loading, setLoading] = useState(false);
  const [liveStatus, setLiveStatus] = useState({});

  // Office location (same as in hook)
  // Define office location (replace with your actual office coordinates)
const OFFICE_LOCATION = {
  latitude: 7.0789311,   // Accurate latitude for Plus Code 3JH5+HHF (Araullo Extension, Davao City)
  longitude: 125.6088534, // Accurate longitude for Plus Code 3JH5+HHF (Araullo Extension, Davao City)
  radius: 500          // Office radius in meters (adjust as needed)
};

  // Load location logs
  const loadLocationLogs = async () => {
    setLoading(true);
    try {
      const logs = await db.get('location-logs') || {};
      setLocationLogs(logs);

      // Calculate live status
      const status = {};
      const today = new Date().toDateString();

      if (logs[today]) {
        Object.entries(logs[today]).forEach(([employeeId, entries]) => {
          if (entries.length > 0) {
            const latest = entries[entries.length - 1];
            const lastUpdate = new Date(latest.timestamp);
            const minutesAgo = (new Date() - lastUpdate) / 60000;

            status[employeeId] = {
              ...latest,
              lastUpdate,
              minutesAgo: Math.round(minutesAgo),
              isRecent: minutesAgo < 5
            };
          }
        });
      }

      setLiveStatus(status);
    } catch (error) {
      console.error('Failed to load location logs:', error);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadLocationLogs();

    // Refresh every 30 seconds
    const interval = setInterval(loadLocationLogs, 30000);
    return () => clearInterval(interval);
  }, []);

  // Export location data as CSV
  const exportLocationData = () => {
    const logs = locationLogs[selectedDate] || {};
    let csv = 'Employee ID,Name,Timestamp,Latitude,Longitude,In Office,Break Type,Accuracy\n';

    Object.entries(logs).forEach(([employeeId, entries]) => {
      const employee = Object.values(users).find(u => u.employeeId === employeeId);
      const name = employee?.name || employeeId;

      entries.forEach(entry => {
        csv += `${employeeId},${name},${entry.timestamp},${entry.latitude},${entry.longitude},${entry.inOffice},${entry.breakType || 'N/A'},${entry.accuracy}\n`;
      });
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `location-logs-${selectedDate}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status) => {
    if (!status || !status.isRecent) return 'bg-gray-100 text-gray-700';
    if (status.inOffice) return 'bg-green-100 text-green-700';
    if (status.breakType) return 'bg-blue-100 text-blue-700';
    return 'bg-red-100 text-red-700';
  };

  const getStatusIcon = (status) => {
    if (!status || !status.isRecent) return '⚫';
    if (status.inOffice) return '✅';
    if (status.breakType) return '☕';
    return '🚨';
  };

  const employeeList = Object.values(users).filter(u => u.role !== 'admin');

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            📍 Location Tracking Dashboard
          </h2>
          <p className="text-gray-600 mt-1">Real-time employee location monitoring</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={loadLocationLogs}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 flex items-center gap-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Loading...
              </>
            ) : (
              <>
                🔄 Refresh
              </>
            )}
          </button>
          <button
            onClick={exportLocationData}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            📥 Export CSV
          </button>
        </div>
      </div>

      {/* Office Location Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-900 mb-2">Office Location Settings</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-gray-600">Latitude</p>
            <p className="font-semibold">{OFFICE_LOCATION.latitude}</p>
          </div>
          <div>
            <p className="text-gray-600">Longitude</p>
            <p className="font-semibold">{OFFICE_LOCATION.longitude}</p>
          </div>
          <div>
            <p className="text-gray-600">Radius</p>
            <p className="font-semibold">{OFFICE_LOCATION.radius}m</p>
          </div>
          <div>
            <p className="text-gray-600">Location</p>
            <p className="font-semibold">Davao City</p>
          </div>
        </div>
      </div>

      {/* Live Status Cards */}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-gray-800 mb-3">Live Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {employeeList.map(employee => {
            const status = liveStatus[employee.employeeId];

            return (
              <div
                key={employee.employeeId}
                className={`p-4 rounded-lg border-2 ${getStatusColor(status)}`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold text-lg">
                      {getStatusIcon(status)} {employee.name}
                    </p>
                    <p className="text-xs opacity-75">{employee.employeeId}</p>
                  </div>
                  <span className="text-xl">📍</span>
                </div>

                {status ? (
                  <>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Status:</strong>{' '}
                        {status.inOffice ? 'In Office ✅' :
                         status.breakType ? `On ${status.breakType.toUpperCase()} ☕` :
                         'Outside Office 🚨'}
                      </p>
                      <p>
                        <strong>Last Update:</strong> {status.minutesAgo}m ago
                      </p>
                      <p className="text-xs opacity-75">
                        📍 {status.latitude.toFixed(4)}, {status.longitude.toFixed(4)}
                      </p>
                    </div>

                    {!status.isRecent && (
                      <p className="text-xs mt-2 font-semibold">
                        ⚠️ Location data is outdated
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm">No location data today</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Date selector for historical logs */}
      <div className="mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          View Historical Data
        </label>
        <input
          type="date"
          value={new Date(selectedDate).toISOString().split('T')[0]}
          onChange={(e) => setSelectedDate(new Date(e.target.value).toDateString())}
          className="px-4 py-2 border rounded-lg"
        />
      </div>

      {/* Historical Location Timeline */}
      <div>
        <h3 className="text-lg font-bold text-gray-800 mb-3">
          Location Timeline - {selectedDate}
        </h3>

        {Object.keys(locationLogs[selectedDate] || {}).length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <div className="text-6xl mb-2">🕐</div>
            <p className="text-gray-600">No location data for this date</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(locationLogs[selectedDate] || {}).map(([employeeId, entries]) => {
              const employee = Object.values(users).find(u => u.employeeId === employeeId);

              return (
                <div key={employeeId} className="border rounded-lg p-4">
                  <h4 className="font-bold text-gray-800 mb-3">
                    {employee?.name || employeeId} ({employeeId})
                  </h4>

                  <div className="space-y-2">
                    {entries.map((entry, index) => (
                      <div
                        key={index}
                        className={`flex flex-col md:flex-row md:items-center md:justify-between p-2 rounded text-sm gap-2 ${
                          entry.inOffice ? 'bg-green-50' :
                          entry.breakType ? 'bg-blue-50' : 'bg-red-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs">
                            {new Date(entry.timestamp).toLocaleTimeString()}
                          </span>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            entry.inOffice ? 'bg-green-200 text-green-800' :
                            entry.breakType ? 'bg-blue-200 text-blue-800' :
                            'bg-red-200 text-red-800'
                          }`}>
                            {entry.inOffice ? '✅ In Office' :
                             entry.breakType ? `☕ ${entry.breakType.toUpperCase()}` :
                             '🚨 Outside'}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">
                          📍 {entry.latitude.toFixed(4)}, {entry.longitude.toFixed(4)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 text-xs text-gray-600">
                    Total logs: {entries.length}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="font-semibold text-gray-700 mb-2">Status Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-green-500 rounded-full"></span>
            <span>In Office</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-blue-500 rounded-full"></span>
            <span>On Break</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full"></span>
            <span>Outside Office</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 bg-gray-500 rounded-full"></span>
            <span>No Data</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LocationTrackingDashboard;
