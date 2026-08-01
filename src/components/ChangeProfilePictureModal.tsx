import React, { useState, useRef, useEffect } from 'react';
import { Camera, Upload, X, Check, Image as ImageIcon, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ChangeProfilePictureModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentAvatarUrl: string;
  onSaveAvatar: (newUrl: string) => Promise<void> | void;
}

const AVATAR_PRESETS = [
  { name: 'Cyber Orb', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=300&q=80' },
  { name: 'Crypto Gold', url: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?auto=format&fit=crop&w=300&q=80' },
  { name: 'AI Mesh', url: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=300&q=80' },
  { name: 'Quantum Core', url: 'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=300&q=80' },
  { name: 'Hologram', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80' },
  { name: 'Neon Cyberpunk', url: 'https://images.unsplash.com/photo-1563089145-599997674d42?auto=format&fit=crop&w=300&q=80' },
  { name: 'Galaxy Nexus', url: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=300&q=80' },
  { name: 'Aetheric Wave', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80' },
];

export const ChangeProfilePictureModal: React.FC<ChangeProfilePictureModalProps> = ({
  isOpen,
  onClose,
  currentAvatarUrl,
  onSaveAvatar,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'camera' | 'presets' | 'url'>('upload');
  const [previewUrl, setPreviewUrl] = useState<string>(currentAvatarUrl);
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Camera state
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [capturedSnapshot, setCapturedSnapshot] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setPreviewUrl(currentAvatarUrl);
      setCustomUrlInput('');
      setCapturedSnapshot(null);
      setCameraError(null);
    } else {
      stopCamera();
    }
  }, [isOpen, currentAvatarUrl]);

  // Clean up camera on unmount or tab switch
  useEffect(() => {
    if (activeTab !== 'camera') {
      stopCamera();
    } else if (isOpen && activeTab === 'camera' && !cameraStream && !capturedSnapshot) {
      startCamera();
    }
  }, [activeTab, isOpen]);

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    setCameraError(null);
    setCapturedSnapshot(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API is not supported in this browser environment.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 640 }, height: { ideal: 640 }, facingMode: 'user' },
        audio: false,
      });
      setCameraStream(stream);
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.warn('Camera access error:', err);
      setCameraError(
        err.message || 'Could not access camera. Please check permissions or upload a photo directly.'
      );
      setIsCameraActive(false);
    }
  };

  const takeCameraSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const size = Math.min(video.videoWidth || 400, video.videoHeight || 400);

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Center crop square
      const startX = (video.videoWidth - size) / 2;
      const startY = (video.videoHeight - size) / 2;
      ctx.drawImage(video, startX, startY, size, size, 0, 0, size, size);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      setCapturedSnapshot(dataUrl);
      setPreviewUrl(dataUrl);
      stopCamera();
    }
  };

  const handleRetakeCamera = () => {
    setCapturedSnapshot(null);
    startCamera();
  };

  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file (PNG, JPG, WEBP, GIF)');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('Image file size must be under 10MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setPreviewUrl(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    setIsSaving(true);
    try {
      await onSaveAvatar(previewUrl);
      onClose();
    } catch (err) {
      console.error('Failed to save profile picture:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          drag="y"
          dragConstraints={{ top: 0, bottom: 0 }}
          dragElastic={0.35}
          dragSnapToOrigin
          onDragEnd={(_, info) => {
            if (info.offset.y > 70 || info.velocity.y > 250) {
              onClose();
            }
          }}
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] cursor-grab active:cursor-grabbing relative"
        >
          {/* Drag handle for mobile */}
          <div className="w-full flex justify-center pt-2 pb-0 touch-none select-none bg-slate-950/50">
            <div className="w-12 h-1.5 bg-slate-700/80 hover:bg-slate-500 rounded-full transition-colors" />
          </div>

          {/* Header */}
          <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Change Profile Picture</h2>
                <p className="text-xs text-slate-400">Upload a photo, use camera, or pick a Web3 preset</p>
              </div>
            </div>
            <button
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5">
            {/* Live Preview Header Circle */}
            <div className="flex items-center justify-center gap-6 p-4 rounded-2xl bg-slate-950 border border-slate-800">
              <div className="relative group">
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-cyan-500 p-[2px] bg-slate-900 shadow-xl">
                  <img
                    src={previewUrl}
                    alt="Profile Preview"
                    className="w-full h-full object-cover rounded-full"
                    onError={() => setPreviewUrl(currentAvatarUrl)}
                  />
                </div>
                <div className="absolute -bottom-1 -right-1 p-1.5 rounded-full bg-cyan-500 text-slate-950 font-bold border-2 border-slate-900">
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="space-y-1 text-left">
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-800/50">
                  Live Preview
                </span>
                <p className="text-sm font-bold text-white">New Avatar Selected</p>
                <p className="text-xs text-slate-400">This photo will be updated across your NEXORUM OS profile and top navigation bar.</p>
              </div>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'upload'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Upload</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'camera'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Camera</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('presets')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'presets'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Presets</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('url')}
                className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${
                  activeTab === 'url'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>URL</span>
              </button>
            </div>

            {/* TAB 1: FILE UPLOAD & DROPZONE */}
            {activeTab === 'upload' && (
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-8 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all space-y-3 ${
                  isDragging
                    ? 'border-cyan-400 bg-cyan-950/30'
                    : 'border-slate-800 bg-slate-950 hover:border-cyan-500/50 hover:bg-slate-900/50'
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
                  <Upload className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold text-white">Click or drag & drop an image here</p>
                  <p className="text-[11px] text-slate-400">Supports PNG, JPG, WEBP, GIF up to 10MB</p>
                </div>
              </div>
            )}

            {/* TAB 2: LIVE CAMERA WEBCAM CAPTURE */}
            {activeTab === 'camera' && (
              <div className="space-y-3">
                <div className="w-full h-64 rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 relative flex items-center justify-center">
                  {capturedSnapshot ? (
                    <img src={capturedSnapshot} alt="Camera Snapshot" className="w-full h-full object-cover" />
                  ) : isCameraActive ? (
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      onLoadedMetadata={() => videoRef.current?.play()}
                      className="w-full h-full object-cover"
                    />
                  ) : cameraError ? (
                    <div className="p-4 text-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                      <p className="text-xs text-rose-300 font-semibold">{cameraError}</p>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="py-1.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold"
                      >
                        Try Again
                      </button>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin mx-auto" />
                      <p className="text-xs text-slate-400">Initializing Camera Stream...</p>
                    </div>
                  )}

                  <canvas ref={canvasRef} className="hidden" />
                </div>

                {/* Camera Control Actions */}
                <div className="flex items-center justify-center gap-3">
                  {capturedSnapshot ? (
                    <button
                      type="button"
                      onClick={handleRetakeCamera}
                      className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center gap-2 border border-slate-700"
                    >
                      <RefreshCw className="w-4 h-4 text-cyan-400" />
                      <span>Retake Photo</span>
                    </button>
                  ) : isCameraActive ? (
                    <button
                      type="button"
                      onClick={takeCameraSnapshot}
                      className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black flex items-center gap-2 shadow-lg shadow-cyan-500/20"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Take Snapshot</span>
                    </button>
                  ) : null}
                </div>
              </div>
            )}

            {/* TAB 3: WEB3 PRESETS */}
            {activeTab === 'presets' && (
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-300">Choose from Web3 & Metaverse Avatar Presets</p>
                <div className="grid grid-cols-4 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {AVATAR_PRESETS.map((preset) => {
                    const isSelected = previewUrl === preset.url;
                    return (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => setPreviewUrl(preset.url)}
                        className={`group p-1.5 rounded-2xl border text-center transition-all ${
                          isSelected
                            ? 'bg-cyan-950/60 border-cyan-400 ring-2 ring-cyan-500/30'
                            : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                        }`}
                      >
                        <div className="w-14 h-14 mx-auto rounded-xl overflow-hidden border border-slate-800 relative">
                          <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                          {isSelected && (
                            <div className="absolute inset-0 bg-cyan-950/50 flex items-center justify-center">
                              <Check className="w-5 h-5 text-cyan-300" />
                            </div>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-300 truncate mt-1">{preset.name}</p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 4: DIRECT IMAGE URL */}
            {activeTab === 'url' && (
              <div className="space-y-3">
                <label className="text-xs font-bold text-slate-300 block">Paste Public Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={customUrlInput}
                    onChange={(e) => setCustomUrlInput(e.target.value)}
                    placeholder="https://example.com/my-photo.jpg"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (customUrlInput.trim()) {
                        setPreviewUrl(customUrlInput.trim());
                      }
                    }}
                    className="py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 shrink-0"
                  >
                    Apply URL
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  You can link images hosted on Unsplash, IPFS, Imgur, or any HTTPS server.
                </p>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="p-5 border-t border-slate-800 bg-slate-950/50 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                stopCamera();
                onClose();
              }}
              className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
            >
              Cancel
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !previewUrl}
              className="py-2.5 px-6 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-black shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
            >
              {isSaving ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Set Profile Picture</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
