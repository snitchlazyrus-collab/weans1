import { useRef, useState, useCallback } from 'react';

const useSignature = () => {
  const signatureRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const initCanvas = useCallback(() => {
    if (!signatureRef.current) return;
    const ctx = signatureRef.current.getContext('2d');
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  const getCoordinates = useCallback((e) => {
    if (!signatureRef.current) return null;
    const rect = signatureRef.current.getBoundingClientRect();

    // Handle both mouse and touch events
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    };
  }, []);

  const startDrawing = useCallback((e) => {
    if (!signatureRef.current) return;
    e.preventDefault(); // Prevent scrolling on touch

    setIsDrawing(true);
    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = signatureRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  }, [getCoordinates]);

  const draw = useCallback((e) => {
    if (!isDrawing || !signatureRef.current) return;
    e.preventDefault(); // Prevent scrolling on touch

    const coords = getCoordinates(e);
    if (!coords) return;

    const ctx = signatureRef.current.getContext('2d');
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  }, [isDrawing, getCoordinates]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
  }, []);

  const clearSignature = useCallback(() => {
    if (!signatureRef.current) return;
    const ctx = signatureRef.current.getContext('2d');
    ctx.clearRect(0, 0, signatureRef.current.width, signatureRef.current.height);
  }, []);

  const getSignature = useCallback(() => {
    if (!signatureRef.current) return null;

    // Check if canvas is blank
    const canvas = signatureRef.current;
    const ctx = canvas.getContext('2d');
    const pixelData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

    // Check if any pixel is not transparent
    const isBlank = !pixelData.some(channel => channel !== 0);

    if (isBlank) {
      return null; // Don't return empty signature
    }

    return canvas.toDataURL('image/png');
  }, []);

  return {
    signatureRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    getSignature,
    initCanvas,
  };
};

export default useSignature;
