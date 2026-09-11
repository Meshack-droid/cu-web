import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  UploadCloud,
  Sparkles,
  Link2,
  Check,
  RotateCcw,
  Image as ImageIcon,
  Church,
  AlertCircle,
  Camera,
} from 'lucide-react';
import {
  type Ministry,
  updateMinistry,
  MINISTRY_DEFAULT_PRESETS,
  getMinistryBackground,
} from '@/features/ministries/ministries.api';

// Curated authentic Christian fellowship presets for one-click selection
const PRESET_GALLERY = [
  {
    name: 'Worship & Praise',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80',
    category: 'worship',
  },
  {
    name: 'Intercession & Prayer',
    url: 'https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=1200&q=80',
    category: 'prayer',
  },
  {
    name: 'Instrumentalists & Strings',
    url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
    category: 'music',
  },
  {
    name: 'Media & Live Production',
    url: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&w=1200&q=80',
    category: 'media',
  },
  {
    name: 'Bible Study & Discipleship',
    url: 'https://images.unsplash.com/photo-1504052434569-70ad5836ab65?auto=format&fit=crop&w=1200&q=80',
    category: 'study',
  },
  {
    name: 'Missions & Outreach',
    url: 'https://images.unsplash.com/photo-1529070538774-1843cb3265df?auto=format&fit=crop&w=1200&q=80',
    category: 'missions',
  },
  {
    name: 'Creative Arts & Stage Drama',
    url: 'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?auto=format&fit=crop&w=1200&q=80',
    category: 'creative',
  },
  {
    name: 'Technicians & Sound Booth',
    url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=1200&q=80',
    category: 'technical',
  },
  {
    name: 'Hospital & Compassion',
    url: 'https://images.unsplash.com/photo-1576765608535-5f04d1e3f289?auto=format&fit=crop&w=1200&q=80',
    category: 'benevolent',
  },
  {
    name: 'Youth & High School Mentorship',
    url: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80',
    category: 'mentorship',
  },
  {
    name: "Brothers' Fellowship",
    url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    category: 'brothers',
  },
  {
    name: "Sisters' Fellowship",
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    category: 'sisters',
  },
];

interface MinistryBackgroundModalProps {
  isOpen: boolean;
  onClose: () => void;
  ministry: Ministry | null;
  onSaved?: (updatedUrl: string) => void;
}

export function MinistryBackgroundModal({
  isOpen,
  onClose,
  ministry,
  onSaved,
}: MinistryBackgroundModalProps) {
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [activeSourceTab, setActiveSourceTab] = useState<'upload' | 'preset' | 'custom'>('upload');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (ministry) {
      const currentBg = getMinistryBackground(ministry);
      setSelectedImage(currentBg);
      setCustomUrlInput(currentBg.startsWith('data:') ? '' : currentBg);
      setErrorMessage(null);
    }
  }, [ministry, isOpen]);

  if (!isOpen || !ministry) return null;

  // Handle file selection from local device
  const handleFileChange = (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (PNG, JPEG, WebP).');
      return;
    }

    // Limit to 6MB max raw file
    if (file.size > 6 * 1024 * 1024) {
      setErrorMessage('File size exceeds 6MB. Please choose a smaller photo.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        // Optional client-side image downscale to ensure snappy performance
        compressImage(result, (compressedDataUrl) => {
          setSelectedImage(compressedDataUrl);
          setErrorMessage(null);
        });
      }
    };
    reader.onerror = () => {
      setErrorMessage('Failed to read image file from your device.');
    };
    reader.readAsDataURL(file);
  };

  // Helper to downscale large camera photos to 1280px max dimension
  const compressImage = (dataUrl: string, callback: (url: string) => void) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = dataUrl;
    img.onload = () => {
      const maxDim = 1280;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        callback(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      callback(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      callback(dataUrl);
    };
  };

  const handleSave = async () => {
    if (!selectedImage) {
      setErrorMessage('Please select or upload a background image.');
      return;
    }

    setIsSaving(true);
    setErrorMessage(null);

    try {
      await updateMinistry(ministry.id, {
        image_url: selectedImage,
      });

      if (onSaved) {
        onSaved(selectedImage);
      }
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to update ministry background image.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefault = () => {
    const defaultUrl =
      MINISTRY_DEFAULT_PRESETS[(ministry.code || '').toLowerCase()] ||
      'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&w=1200&q=80';
    setSelectedImage(defaultUrl);
    setCustomUrlInput(defaultUrl);
    setErrorMessage(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl relative my-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-[#EAF5EF] text-[#006633] border border-[#006633]/20">
              <Camera size={20} />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200/80 mb-0.5">
                <Sparkles size={11} className="text-amber-600" /> Super Admin Ministry Media
              </div>
              <h2 className="text-lg font-black text-[#17201B] tracking-tight">
                {ministry.name}
              </h2>
              <p className="text-xs text-slate-500">
                Change or upload the official background photograph for this ministry tab.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="grid h-8 w-8 place-items-center rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Live Preview Card */}
        <div className="mt-4">
          <label className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-1.5">
            Live Preview on Hub & Dashboard
          </label>
          <div className="relative h-44 sm:h-52 w-full rounded-2xl overflow-hidden border border-slate-200 shadow-md">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={ministry.name}
                className="h-full w-full object-cover object-center"
              />
            ) : (
              <div className="h-full w-full bg-slate-900 grid place-items-center text-slate-400 text-xs">
                No image selected
              </div>
            )}
            {/* Cinematic Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/45 to-slate-950/20" />

            <div className="absolute inset-0 p-4 sm:p-5 flex flex-col justify-between text-white">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1 rounded-full bg-white/20 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold tracking-wider uppercase border border-white/30 text-emerald-300">
                  <Church size={11} />
                  <span>{ministry.code || 'Constitutional'}</span>
                </span>
                <span className="rounded-full bg-amber-400/90 text-slate-950 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider">
                  Active Ministry
                </span>
              </div>

              <div>
                <h3 className="text-base sm:text-lg font-black tracking-tight drop-shadow-sm text-white">
                  {ministry.name}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-200 line-clamp-2 mt-0.5 drop-shadow-xs font-normal max-w-lg">
                  {ministry.description ||
                    'Equipping students in Christ-centered discipleship, worship, and campus evangelism.'}
                </p>
                <div className="mt-2 flex items-center gap-3 text-[10px] text-slate-300">
                  <span>📍 {ministry.meeting_venue || 'Main Sanctuary'}</span>
                  <span>🗓️ {ministry.meeting_day || 'Weekly Fellowship'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Source Selector Tabs */}
        <div className="mt-5 flex gap-1.5 p-1 rounded-2xl bg-slate-100 border border-slate-200/80">
          <button
            onClick={() => setActiveSourceTab('upload')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeSourceTab === 'upload'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud size={14} />
            <span>Upload Device Photo</span>
          </button>
          <button
            onClick={() => setActiveSourceTab('preset')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeSourceTab === 'preset'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sparkles size={14} />
            <span>Curated Presets</span>
          </button>
          <button
            onClick={() => setActiveSourceTab('custom')}
            className={`flex-1 py-1.5 text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5 ${
              activeSourceTab === 'custom'
                ? 'bg-white text-slate-950 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Link2 size={14} />
            <span>Image URL</span>
          </button>
        </div>

        {/* Tab 1: Upload from Device */}
        {activeSourceTab === 'upload' && (
          <div className="mt-3.5 space-y-2">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
            />
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
              }}
              onDragLeave={() => setDragActive(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragActive(false);
                handleFileChange(e.dataTransfer.files?.[0] || null);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
                dragActive
                  ? 'border-[#006633] bg-[#EAF5EF]/60'
                  : 'border-slate-200 hover:border-slate-300 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-white shadow-xs text-[#006633] border border-slate-200">
                <UploadCloud size={24} />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">
                  Click to select photo or drag and drop here
                </p>
                <p className="text-[11px] text-slate-500">
                  Supports PNG, JPEG, WebP photos (automatic high-res downscaling)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Curated Presets Grid */}
        {activeSourceTab === 'preset' && (
          <div className="mt-3.5 space-y-2">
            <p className="text-[11px] text-slate-500">
              Select one of our curated high-resolution Christian fellowship & sanctuary photographs:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
              {PRESET_GALLERY.map((preset) => {
                const isSelected = selectedImage === preset.url;
                return (
                  <button
                    key={preset.name}
                    type="button"
                    onClick={() => {
                      setSelectedImage(preset.url);
                      setCustomUrlInput(preset.url);
                      setErrorMessage(null);
                    }}
                    className={`group relative h-20 rounded-xl overflow-hidden border text-left transition ${
                      isSelected
                        ? 'border-[#006633] ring-2 ring-[#006633]'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <img
                      src={preset.url}
                      alt={preset.name}
                      className="h-full w-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />
                    <div className="absolute inset-0 p-1.5 flex flex-col justify-between text-white">
                      {isSelected ? (
                        <span className="self-end grid h-4 w-4 place-items-center rounded-full bg-[#006633] text-white">
                          <Check size={10} />
                        </span>
                      ) : (
                        <div />
                      )}
                      <span className="text-[10px] font-bold line-clamp-1 leading-tight">
                        {preset.name}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 3: Custom URL */}
        {activeSourceTab === 'custom' && (
          <div className="mt-3.5 space-y-2">
            <p className="text-[11px] text-slate-500">
              Paste an external web image link from Unsplash, Google Photos, or your church media cloud:
            </p>
            <div className="flex gap-2">
              <input
                type="url"
                value={customUrlInput}
                onChange={(e) => setCustomUrlInput(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-900 focus:border-[#006633] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (customUrlInput.trim().startsWith('http')) {
                    setSelectedImage(customUrlInput.trim());
                    setErrorMessage(null);
                  } else {
                    setErrorMessage('Please enter a valid URL starting with http:// or https://');
                  }
                }}
                className="rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-bold hover:bg-slate-800 transition"
              >
                Apply
              </button>
            </div>
          </div>
        )}

        {/* Error notification */}
        {errorMessage && (
          <div className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 p-2.5 text-xs text-red-700 border border-red-200">
            <AlertCircle size={14} className="shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={handleResetDefault}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw size={13} />
            <span>Reset to Default</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#006633] hover:bg-[#004D26] px-5 py-2 text-xs font-bold text-white shadow-xs transition active:scale-95 disabled:opacity-50"
            >
              <Check size={14} />
              <span>{isSaving ? 'Saving Picture...' : 'Save Background Picture'}</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
