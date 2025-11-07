import { useRef, useState } from 'react';

const useSignature = () => {
  const signatureRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    if (!signatureRef.current) return;
    setIsDrawing(true);
    const rect = signatureRef.current.getBoundingClientRect();
    const ctx = signatureRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !signatureRef.current) return;
    const rect = signatureRef.current.getBoundingClientRect();
    const ctx = signatureRef.current.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!signatureRef.current) return;
    const ctx = signatureRef.current.getContext('2d');
    ctx.clearRect(0, 0, signatureRef.current.width, signatureRef.current.height);
  };

  const getSignature = () => {
    return signatureRef.current ? signatureRef.current.toDataURL() : null;
  };

  return {
    signatureRef,
    isDrawing,
    startDrawing,
    draw,
    stopDrawing,
    clearSignature,
    getSignature,
  };
};

export default useSignature;
