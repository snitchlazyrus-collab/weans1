import React from 'react';
import { MapPin, AlertTriangle, CheckCircle, Navigation } from 'lucide-react';
import useGeolocation from '../../hooks/useGeolocation';

const LocationStatusIndicator = () => {
  const {
    currentLocation,
    isInOffice,
    locationError,
    permissionStatus,
    tracking,
    activeBreakType,
    OFFICE_LOCATION
  } = useGeolocation();

  if (permissionStatus === 'denied') {
    return (
      <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Location Access Required</p>
            <p className="text-sm mt-1">
              Please enable location permissions in your browser settings to continue using the app.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="fixed bottom-4 right-4 bg-orange-500 text-white px-4 py-3 rounded-lg shadow-lg max-w-sm">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Location Error</p>
            <p className="text-sm mt-1">{locationError}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!tracking || !currentLocation) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-500 text-white px-4 py-3 rounded-lg shadow-lg">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
          <span className="text-sm">Getting location...</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed bottom-4 right-4 px-4 py-3 rounded-lg shadow-lg transition-all ${
        isInOffice
          ? 'bg-green-500 text-white'
          : activeBreakType
          ? 'bg-blue-500 text-white'
          : 'bg-red-500 text-white animate-pulse'
      }`}
    >
      <div className="flex items-start gap-3">
        {isInOffice ? (
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        ) : (
          <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
        )}
        <div>
          <p className="font-bold flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            {isInOffice ? 'In Office' : 'Outside Office'}
          </p>
          {activeBreakType && !isInOffice && (
            <p className="text-sm mt-1">
              On {activeBreakType.toUpperCase()} - OK to be outside
            </p>
          )}
          {!isInOffice && !activeBreakType && (
            <p className="text-sm mt-1 font-semibold">
              ⚠️ Auto-logout in progress...
            </p>
          )}
          <p className="text-xs mt-2 opacity-75">
            📍 {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  );
};

export default LocationStatusIndicator;
