import React, { useRef, useState } from 'react';

const SignaturePad = ({ onSubmit }) => {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const startDrawing = (e) => {
    if (!canvasRef.current) return;
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const ctx = canvasRef.current.getContext('2d');
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  const getSignature = () => {
    return canvasRef.current ? canvasRef.current.toDataURL() : null;
  };

  const handleSubmit = () => {
    const signature = getSignature();
    if (signature) {
      onSubmit(signature);
      clearSignature();
    }
  };

  return (
    <div>
      <p className="font-semibold mb-2">Sign below:</p>
      <canvas
        ref={canvasRef}
        width="400"
        height="150"
        className="border rounded mb-2 cursor-crosshair bg-white"
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
      />
      <div className="flex gap-2">
        <button
          onClick={clearSignature}
          type="button"
          className="bg-gray-500 text-white px-3 py-1 rounded font-bold hover:bg-gray-600"
        >
          Clear
        </button>
        <button
          onClick={handleSubmit}
          type="button"
          className="bg-green-500 text-white px-3 py-1 rounded font-bold hover:bg-green-600"
        >
          Submit Acknowledgment
        </button>
      </div>
    </div>
  );
};

export default SignaturePad;
