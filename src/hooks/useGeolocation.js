// hooks/useGeolocation.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

// Define office location
const OFFICE_LOCATION = {
  latitude: 7.0789311,
  longitude: 125.6088534,
  radius: 500
};

// Allow these break types outside office
const ALLOWED_OUTSIDE_OFFICE = ['lunch', 'rr', 'break'];

// Detect iOS
const isIOS = () => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
         (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

export const useGeolocation = () => {
  const { currentUser, handleLogout } = useAuth();
  const { addToFeed, db } = useApp();

  const [currentLocation, setCurrentLocation] = useState(null);
  const [isInOffice, setIsInOffice] = useState(false);
  const [locationError, setLocationError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [tracking, setTracking] = useState(false);
  const [activeBreakType, setActiveBreakType] = useState(null);
  const [needsPermission, setNeedsPermission] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);

  // Use refs to avoid stale closures
  const activeBreakTypeRef = useRef(activeBreakType);
  const currentUserRef = useRef(currentUser);
  const watchIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const logoutTimerRef = useRef(null);
  const addToFeedRef = useRef(addToFeed);
  const handleLogoutRef = useRef(handleLogout);
  const dbRef = useRef(db);
  const lastLocationRef = useRef(null);
  const consecutiveErrorsRef = useRef(0);
  const trackingStartedRef = useRef(false);

  // Update refs when values change
  useEffect(() => {
    activeBreakTypeRef.current = activeBreakType;
  }, [activeBreakType]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    addToFeedRef.current = addToFeed;
  }, [addToFeed]);

  useEffect(() => {
    handleLogoutRef.current = handleLogout;
  }, [handleLogout]);

  useEffect(() => {
    dbRef.current = db;
  }, [db]);

  // Detect iOS on mount
  useEffect(() => {
    const ios = isIOS();
    setIsIOSDevice(ios);
    console.log('Device is iOS:', ios);
  }, []);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  };

  // Check if user is within office radius
  const checkIfInOffice = (latitude, longitude) => {
    const distance = calculateDistance(
      latitude,
      longitude,
      OFFICE_LOCATION.latitude,
      OFFICE_LOCATION.longitude
    );

    return distance <= OFFICE_LOCATION.radius;
  };

  // Log location to Firebase
  const logLocation = async (position, inOffice) => {
    const user = currentUserRef.current;
    const database = dbRef.current;

    if (!user || !database) {
      console.log('Cannot log location - missing user or db');
      return;
    }

    try {
      const locationData = await database.get('location-logs') || {};
      const today = new Date().toDateString();

      if (!locationData[today]) locationData[today] = {};
      if (!locationData[today][user.employeeId]) {
        locationData[today][user.employeeId] = [];
      }

      locationData[today][user.employeeId].push({
        timestamp: new Date().toISOString(),
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        inOffice,
        accuracy: position.coords.accuracy,
        breakType: activeBreakTypeRef.current,
        device: isIOS() ? 'iOS' : 'other'
      });

      // Keep only last 50 entries per employee per day
      if (locationData[today][user.employeeId].length > 50) {
        locationData[today][user.employeeId].shift();
      }

      await database.set('location-logs', locationData);
    } catch (error) {
      console.error('Failed to log location:', error);
    }
  };

  // Handle location update
  const handleLocationUpdate = useCallback((position) => {
    console.log('📍 Location update received:', position.coords);
    consecutiveErrorsRef.current = 0;

    const user = currentUserRef.current;
    if (!user) {
      console.log('No user found in location update');
      return;
    }

    const { latitude, longitude } = position.coords;

    lastLocationRef.current = { latitude, longitude };
    setCurrentLocation({ latitude, longitude });

    const inOffice = checkIfInOffice(latitude, longitude);
    console.log(`User is ${inOffice ? 'IN' : 'OUT OF'} office`);
    setIsInOffice(inOffice);

    logLocation(position, inOffice);

    // Auto-logout if not in office (unless on allowed break)
    const currentBreak = activeBreakTypeRef.current;
    if (!inOffice && !ALLOWED_OUTSIDE_OFFICE.includes(currentBreak)) {
      console.log('User left office area - Auto logout triggered');

      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
      }

      const feed = addToFeedRef.current;
      if (feed) {
        feed(
          `${user.name} left office premises - Auto logout at ${new Date().toLocaleTimeString()}`,
          'geolocation',
          user
        );
      }

      alert('🚨 You have left the office premises. You will be logged out automatically.');

      logoutTimerRef.current = setTimeout(() => {
        const logout = handleLogoutRef.current;
        if (logout) logout();
      }, 5000);
    }

    setLocationError(null);
  }, []);

  // Handle location error
  const handleLocationError = useCallback((error) => {
    console.error('❌ Geolocation error:', error);
    consecutiveErrorsRef.current += 1;

    let errorMessage = '';
    switch (error.code) {
      case error.PERMISSION_DENIED:
        errorMessage = isIOS()
          ? 'Location access denied. Please go to Settings > Safari > Location and select "Allow" or "Ask".'
          : 'Location access denied. Please enable location permissions to continue.';
        setPermissionStatus('denied');
        setNeedsPermission(true);
        setTracking(false);
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = 'Location information unavailable. Please ensure Location Services are enabled in Settings.';
        break;
      case error.TIMEOUT:
        errorMessage = 'Location request timed out. Retrying...';
        if (lastLocationRef.current) {
          console.log('Using last known location due to timeout');
          return;
        }
        break;
      default:
        errorMessage = 'An unknown error occurred.';
    }

    if (consecutiveErrorsRef.current > 2) {
      setLocationError(errorMessage);
    }

    console.error('Geolocation error message:', errorMessage);
  }, []);

  // Start tracking - MUST BE CALLED FROM USER INTERACTION
  const startTracking = useCallback(() => {
    console.log('🌍 startTracking called (iOS-compatible mode)');

    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      setLocationError('Geolocation not supported');
      return;
    }

    // Prevent multiple simultaneous starts
    if (trackingStartedRef.current) {
      console.log('⚠️ Tracking already started, skipping');
      return;
    }

    trackingStartedRef.current = true;

    // Clean up any existing tracking
    if (watchIdRef.current) {
      console.log('Clearing existing watch');
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollIntervalRef.current) {
      console.log('Clearing existing interval');
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    console.log('✅ Starting location tracking...');
    setTracking(true);
    setNeedsPermission(false);
    consecutiveErrorsRef.current = 0;

    // iOS-specific options
    const options = {
      enableHighAccuracy: true,
      timeout: isIOS() ? 15000 : 10000,
      maximumAge: isIOS() ? 60000 : 30000
    };

    // Get initial position
    console.log('Getting initial position...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('✅ Initial position obtained');
        setPermissionStatus('granted');
        handleLocationUpdate(pos);
      },
      (err) => {
        console.error('❌ Initial position failed');
        handleLocationError(err);
        trackingStartedRef.current = false;
      },
      options
    );

    // For iOS: Use polling instead of watchPosition
    if (isIOS()) {
      console.log('Setting up iOS polling (every 60 seconds)...');
      pollIntervalRef.current = setInterval(() => {
        console.log('⏰ iOS: Polling location...');
        navigator.geolocation.getCurrentPosition(
          handleLocationUpdate,
          handleLocationError,
          options
        );
      }, 60000);
    } else {
      // For other browsers: Use watchPosition + polling backup
      console.log('Setting up position watch...');
      watchIdRef.current = navigator.geolocation.watchPosition(
        (pos) => {
          console.log('📍 Watch position update');
          handleLocationUpdate(pos);
        },
        (err) => {
          console.error('❌ Watch position error');
          handleLocationError(err);
        },
        options
      );

      console.log('Setting up backup polling interval...');
      pollIntervalRef.current = setInterval(() => {
        console.log('⏰ Polling location...');
        navigator.geolocation.getCurrentPosition(
          handleLocationUpdate,
          handleLocationError,
          options
        );
      }, 120000);
    }

    console.log('✅ Tracking setup complete');
  }, [handleLocationUpdate, handleLocationError]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log('🛑 Stopping location tracking...');

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    setTracking(false);
    consecutiveErrorsRef.current = 0;
    trackingStartedRef.current = false;
  }, []);

  // Set current break type
  const setBreakType = useCallback((type) => {
    console.log('Setting break type:', type);
    setActiveBreakType(type);
  }, []);

  // Clear break type
  const clearBreakType = useCallback(() => {
    console.log('Clearing break type');
    setActiveBreakType(null);
  }, []);

  // Auto-start tracking when user logs in (non-admin only)
  useEffect(() => {
    console.log('🔄 Effect triggered - currentUser:', currentUser?.employeeId, 'role:', currentUser?.role);

    if (currentUser && currentUser.role !== 'admin') {
      console.log('👤 User logged in (non-admin), auto-starting tracking...');

      // Small delay to ensure everything is initialized
      const timer = setTimeout(() => {
        if (!trackingStartedRef.current) {
          console.log('🚀 Auto-starting location tracking');
          startTracking();
        }
      }, 500);

      return () => {
        clearTimeout(timer);
        console.log('🧹 Cleaning up location tracking...');
        stopTracking();
      };
    } else {
      console.log('ℹ️ No tracking needed - user:', currentUser ? 'admin' : 'none');
    }
  }, [currentUser?.employeeId, currentUser?.role, startTracking, stopTracking]);

  // Handle visibility change (iOS backgrounding)
  useEffect(() => {
    if (!isIOS() || !tracking) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('📱 App backgrounded');
      } else {
        console.log('📱 App foregrounded - refreshing location');
        navigator.geolocation.getCurrentPosition(
          handleLocationUpdate,
          handleLocationError,
          {
            enableHighAccuracy: true,
            timeout: 15000,
            maximumAge: 0
          }
        );
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tracking, handleLocationUpdate, handleLocationError]);

  return {
    currentLocation,
    isInOffice,
    locationError,
    permissionStatus,
    tracking,
    activeBreakType,
    needsPermission,
    startTracking,
    stopTracking,
    setBreakType,
    clearBreakType,
    OFFICE_LOCATION,
    isIOSDevice
  };
};

export default useGeolocation;
