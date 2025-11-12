// hooks/useGeolocation.js
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useApp } from '../context/AppContext';

// Define office location
const OFFICE_LOCATION = {
  latitude: 7.0789311,
  longitude: 125.6088534,
  radius: 1000
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
  const [lastUpdate, setLastUpdate] = useState(null);
  const [safariWarning, setSafariWarning] = useState(null);

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
  const appVisibleRef = useRef(true);
  const lastSuccessfulUpdateRef = useRef(Date.now());
  const iosPollingRef = useRef(null);

  // Update refs when values change
  useEffect(() => { activeBreakTypeRef.current = activeBreakType; }, [activeBreakType]);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);
  useEffect(() => { addToFeedRef.current = addToFeed; }, [addToFeed]);
  useEffect(() => { handleLogoutRef.current = handleLogout; }, [handleLogout]);
  useEffect(() => { dbRef.current = db; }, [db]);

  // Detect iOS on mount
  useEffect(() => {
    const ios = isIOS();
    setIsIOSDevice(ios);

    if (ios) {
      setSafariWarning('⚠️ iOS: Keep this page open and screen unlocked. Location will pause when you lock your device or switch apps.');
    }

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

  // Log location to database
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
        latitude: position.latitude,
        longitude: position.longitude,
        inOffice,
        accuracy: position.accuracy,
        breakType: activeBreakTypeRef.current,
        device: isIOS() ? 'iOS' : 'Android/Desktop',
        appVisible: appVisibleRef.current
      });

      // Keep only last 100 entries per employee per day
      if (locationData[today][user.employeeId].length > 100) {
        locationData[today][user.employeeId].shift();
      }

      await database.set('location-logs', locationData);
      console.log('✅ Location logged successfully');
    } catch (error) {
      console.error('Failed to log location:', error);
    }
  };

  // Handle location update
  const handleLocationUpdate = useCallback((position) => {
    const coords = position.coords || position;
    console.log('📍 Location update:', {
      lat: coords.latitude.toFixed(6),
      lng: coords.longitude.toFixed(6),
      accuracy: Math.round(coords.accuracy) + 'm',
      timestamp: new Date().toLocaleTimeString()
    });

    consecutiveErrorsRef.current = 0;
    lastSuccessfulUpdateRef.current = Date.now();

    const user = currentUserRef.current;
    if (!user) {
      console.log('No user found in location update');
      return;
    }

    const { latitude, longitude, accuracy } = coords;

    lastLocationRef.current = { latitude, longitude };
    setCurrentLocation({ latitude, longitude });
    setLastUpdate(new Date());

    const inOffice = checkIfInOffice(latitude, longitude);
    console.log(`User is ${inOffice ? 'IN ✅' : 'OUT OF 🚨'} office (accuracy: ${Math.round(accuracy)}m)`);
    setIsInOffice(inOffice);

    logLocation({ latitude, longitude, accuracy }, inOffice);

    // Auto-logout if not in office (unless on allowed break)
    const currentBreak = activeBreakTypeRef.current;
    if (!inOffice && !ALLOWED_OUTSIDE_OFFICE.includes(currentBreak)) {
      console.log('🚨 User left office area - Auto logout triggered');

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
    console.error('❌ Geolocation error:', error.code, error.message);
    consecutiveErrorsRef.current += 1;

    let errorMessage = '';
    let helpText = '';

    switch (error.code) {
      case error.PERMISSION_DENIED:
        if (isIOS()) {
          errorMessage = '🚫 Location access denied';
          helpText = 'iOS Settings → Privacy & Security → Location Services → Safari → While Using';
        } else {
          errorMessage = '🚫 Location access denied';
          helpText = 'Please enable location permissions in browser settings';
        }
        setPermissionStatus('denied');
        setNeedsPermission(true);
        setTracking(false);
        trackingStartedRef.current = false;
        break;
      case error.POSITION_UNAVAILABLE:
        errorMessage = '📡 Location unavailable';
        helpText = 'Ensure Location Services are enabled in device Settings';
        if (lastLocationRef.current && consecutiveErrorsRef.current < 5) {
          console.log('Using last known location');
          return;
        }
        break;
      case error.TIMEOUT:
        errorMessage = '⏱️ Location request timed out';
        if (lastLocationRef.current) {
          console.log('Timeout but using last known location');
          return;
        }
        break;
      default:
        errorMessage = '⚠️ Location error occurred';
        helpText = 'Please check your device settings';
    }

    if (consecutiveErrorsRef.current >= 3) {
      setLocationError(`${errorMessage}. ${helpText}`);
    }
  }, []);

  // Request location manually (critical for iOS)
  const requestLocationManually = useCallback(() => {
    if (!navigator.geolocation) return;

    console.log('🔄 Manual location request');

    // iOS-specific optimized options
    const options = {
      enableHighAccuracy: true,
      timeout: 20000,
      maximumAge: 30000 // Accept 30-second-old positions on iOS
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('✅ Manual request succeeded');
        handleLocationUpdate(pos);
      },
      (err) => {
        console.error('❌ Manual request failed:', err.code, err.message);
        handleLocationError(err);
      },
      options
    );
  }, [handleLocationUpdate, handleLocationError]);

  // Start tracking - iOS optimized
  const startTracking = useCallback(() => {
    console.log('🌍 Starting location tracking (iOS-optimized)');

    if (!navigator.geolocation) {
      console.error('❌ Geolocation not supported');
      setLocationError('Geolocation not supported by your browser');
      return;
    }

    if (trackingStartedRef.current) {
      console.log('⚠️ Tracking already started');
      return;
    }

    // Clean up any existing tracking
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (iosPollingRef.current) {
      clearInterval(iosPollingRef.current);
      iosPollingRef.current = null;
    }

    trackingStartedRef.current = true;
    setTracking(true);
    setNeedsPermission(false);
    consecutiveErrorsRef.current = 0;

    const ios = isIOS();

    // Options optimized for iOS
    const options = {
      enableHighAccuracy: true,
      timeout: ios ? 20000 : 15000,
      maximumAge: ios ? 30000 : 10000 // iOS can use older positions
    };

    console.log('📍 Getting initial position...');

    // Get initial position first
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        console.log('✅ Initial position obtained');
        setPermissionStatus('granted');
        handleLocationUpdate(pos);

        // **KEY FIX FOR iOS**: Use ONLY polling, no watchPosition
        if (ios) {
          console.log('🍎 iOS detected - using polling only (every 30s)');

          // Poll every 30 seconds for iOS
          iosPollingRef.current = setInterval(() => {
            if (trackingStartedRef.current && appVisibleRef.current) {
              console.log('⏰ iOS polling check');
              requestLocationManually();
            }
          }, 30000); // 30 seconds

        } else {
          // For non-iOS: Use watchPosition + backup polling
          console.log('🤖 Non-iOS - using watchPosition + backup polling');

          watchIdRef.current = navigator.geolocation.watchPosition(
            handleLocationUpdate,
            handleLocationError,
            options
          );

          // Backup polling every 2 minutes
          pollIntervalRef.current = setInterval(() => {
            if (appVisibleRef.current) {
              console.log('⏰ Backup polling check');
              requestLocationManually();
            }
          }, 120000);
        }
      },
      (err) => {
        console.error('❌ Initial position failed:', err.code, err.message);
        handleLocationError(err);
        trackingStartedRef.current = false;
        setTracking(false);

        if (err.code === 1) {
          if (isIOS()) {
            alert('📍 Location access required for attendance tracking.\n\niOS: Settings → Privacy & Security → Location Services → Safari → "While Using the App"\n\nPlease enable and refresh.');
          } else {
            alert('📍 Location access required. Please enable location permissions and refresh.');
          }
        }
      },
      options
    );

    console.log('✅ Tracking setup complete');
  }, [handleLocationUpdate, handleLocationError, requestLocationManually]);

  // Stop tracking
  const stopTracking = useCallback(() => {
    console.log('🛑 Stopping location tracking');

    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }

    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }

    if (iosPollingRef.current) {
      clearInterval(iosPollingRef.current);
      iosPollingRef.current = null;
    }

    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }

    setTracking(false);
    consecutiveErrorsRef.current = 0;
    trackingStartedRef.current = false;
  }, []);

  // Set/clear break type
  const setBreakType = useCallback((type) => {
    console.log('Setting break type:', type);
    setActiveBreakType(type);
  }, []);

  const clearBreakType = useCallback(() => {
    console.log('Clearing break type');
    setActiveBreakType(null);
  }, []);

  // Auto-start tracking when user logs in (non-admin only)
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      console.log('👤 User logged in, starting tracking in 1 second...');
      const timer = setTimeout(startTracking, 1000);
      return () => {
        clearTimeout(timer);
        stopTracking();
      };
    }
  }, [currentUser?.employeeId, currentUser?.role, startTracking, stopTracking]);

  // Handle visibility change - CRITICAL for iOS
  useEffect(() => {
    if (!tracking) return;

    const handleVisibilityChange = () => {
      const isVisible = !document.hidden;
      appVisibleRef.current = isVisible;

      console.log(`📱 App ${isVisible ? 'foregrounded' : 'backgrounded'}`);

      if (isVisible && isIOS()) {
        console.log('📍 iOS app foregrounded - requesting fresh location');
        // Request location immediately when app comes to foreground
        setTimeout(() => {
          requestLocationManually();
        }, 500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [tracking, requestLocationManually]);

  // Watchdog: Check if location updates have stalled
  useEffect(() => {
    if (!tracking) return;

    const watchdog = setInterval(() => {
      const timeSinceUpdate = Date.now() - lastSuccessfulUpdateRef.current;

      if (timeSinceUpdate > 180000) { // 3 minutes without update
        console.warn('⚠️ Location updates stalled, manual refresh...');
        requestLocationManually();
      }
    }, 60000); // Check every minute

    return () => clearInterval(watchdog);
  }, [tracking, requestLocationManually]);

  // iOS-specific: Handle page focus events
  useEffect(() => {
    if (!isIOS() || !tracking) return;

    const handleFocus = () => {
      console.log('📱 iOS page focused - requesting location');
      requestLocationManually();
    };

    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
  }, [tracking, requestLocationManually]);

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
    requestLocationManually,
    OFFICE_LOCATION,
    isIOSDevice,
    lastUpdate,
    safariWarning
  };
};

export default useGeolocation;
