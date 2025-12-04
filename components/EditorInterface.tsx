
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { 
  Upload, Sparkles, Type as TypeIcon, 
  Play, Pause, ChevronDown, Plus, Image as ImageIcon, Trash2,
  SkipBack, SkipForward, BrainCircuit, CloudUpload, FileVideo,
  LayoutTemplate, Split, Undo2, Layers, MonitorPlay, Download, 
  ZoomIn, ZoomOut, SlidersHorizontal, Eraser, Music4, Film, 
  Tv, Zap, Ban, MousePointer2, Scissors, GripVertical,
  MessageSquare, Wand2, ArrowRight, X, Check, Copy, RefreshCw, AudioLines,
  Maximize2, Minimize2, Move, TrendingUp, BarChart3, Settings2, GripHorizontal,
  Bot, User, ImagePlus, Clapperboard, Magnet, Volume2, Palette, Eye, EyeOff, Lock, Unlock,
  Aperture, Sun, Moon, Droplet, Thermometer, BoxSelect, ChevronRight, Diamond, RotateCw, Crop, Pipette,
  Activity, Gauge, MoveHorizontal, Mic2, Wind, Waves, Disc
} from 'lucide-react';

// --- TYPES ---
type MediaType = 'video' | 'image' | 'audio' | 'text';
type ToolMode = 'select' | 'razor';
type EditTab = 'basic' | 'color' | 'effects' | 'ai';

interface MediaAsset {
  id: string;
  type: MediaType;
  src?: string; // Optional for text
  content?: string; // For text
  thumbnail?: string;
  name: string;
  duration: number; 
  width: number;
  height: number;
  timestamp: string;
}

// PRO TIMELINE STRUCTURE
interface TimelineClip extends MediaAsset {
  startTime: number; // Global timeline time (seconds)
  offset: number; // Start time within the source media (trim in)
  
  // Transform
  scale: number;
  rotation: number;
  x: number;
  y: number;
  opacity: number;
  
  // Audio
  volume: number;
  speed: number;
  fadeIn: number;
  fadeOut: number;
  eqBass: number;
  eqMid: number;
  eqTreble: number;
  audioCompressor: boolean;
  audioDenoise: boolean;

  // Color Grading
  contrast: number;
  saturation: number;
  brightness: number;
  exposure: number;
  temperature: number; // Hue rotate / Sepia mix
  tint: number;
  blur: number;

  // Effects
  vignette: number;
  chromaKey: boolean;
  chromaColor: string;
  filmGrain: boolean;
  
  // Transitions
  transitionIn: 'none' | 'fade' | 'slide' | 'wipe' | 'zoom' | 'blur' | 'glitch';
  transitionOut: 'none' | 'fade' | 'slide' | 'wipe' | 'zoom' | 'blur' | 'glitch';
  transitionDuration: number;
  transitionEasing: 'linear' | 'easeIn' | 'easeOut' | 'easeInOut';

  // Masking
  maskType: 'none' | 'circle' | 'rectangle';
  maskFeather: number;
  maskInvert: boolean;

  // Keyframes (Mock structure for UI)
  keyframes: Record<string, boolean>;
  keyframeEasing: 'linear' | 'bezier';

  // Speed Ramping
  speedRamp: boolean;
  opticalFlow: boolean;
  pitchCorrection: boolean;

  // AI State
  isAiEnhanced: boolean;
  isStabilized: boolean;
  
  // Text
  fontSize?: number;
  fontColor?: string;
  bgColor?: string;
}

interface Track {
  id: number;
  name: string;
  type: 'video' | 'audio' | 'overlay';
  isMuted: boolean;
  isLocked: boolean;
  isHidden: boolean;
  clips: TimelineClip[];
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  type?: 'text' | 'action_result' | 'generated_asset';
  asset?: MediaAsset; 
}

// --- UTILS ---
const extractFrame = (videoSrc: string, time: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoSrc;
    video.currentTime = time;
    video.onloadeddata = () => {};
    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth / 4; 
        canvas.height = video.videoHeight / 4;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.5);
        resolve(dataUrl.split(',')[1]); 
      } catch (e) { reject(e); }
    };
    video.onerror = (e) => reject(e);
    if (videoSrc.startsWith('blob:') || videoSrc.startsWith('http')) {
         video.currentTime = time;
    }
  });
};

const Resizer = ({ direction, onResize }: { direction: 'horizontal' | 'vertical', onResize: (delta: number) => void }) => {
  const [isDragging, setIsDragging] = useState(false);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      onResize(direction === 'horizontal' ? e.movementX : e.movementY);
    };
    const handleMouseUp = () => setIsDragging(false);
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = direction === 'horizontal' ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = 'default';
      document.body.style.userSelect = 'auto';
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, direction, onResize]);
  return (
    <div 
      className={`bg-[#111] hover:bg-brand-primary transition-colors z-50 flex items-center justify-center group
        ${direction === 'horizontal' ? 'w-1.5 h-full cursor-col-resize border-l border-[#222]' : 'h-1.5 w-full cursor-row-resize border-t border-[#222]'}`}
      onMouseDown={() => setIsDragging(true)}
    >
      <div className={`bg-gray-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity ${direction === 'horizontal' ? 'h-4 w-0.5' : 'w-4 h-0.5'}`} />
    </div>
  );
};

// --- COMPONENTS ---
const PropertySlider = ({ 
  label, value, min, max, onChange, unit = '', hasKeyframe = false, onKeyframeToggle 
}: { 
  label: string, value: number, min: number, max: number, onChange: (val: number) => void, unit?: string, hasKeyframe?: boolean, onKeyframeToggle?: () => void 
}) => (
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1.5">
      <div className="flex items-center gap-2">
         {onKeyframeToggle && (
           <button 
             onClick={onKeyframeToggle}
             className={`p-0.5 rounded ${hasKeyframe ? 'text-brand-accent bg-brand-accent/10' : 'text-gray-600 hover:text-gray-400'}`}
             title="Toggle Keyframe"
           >
             <Diamond size={10} className={hasKeyframe ? 'fill-current' : ''}/>
           </button>
         )}
         <span className="text-[11px] text-gray-400 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <input 
          type="number" 
          value={Math.round(value * 100) / 100} 
          onChange={(e) => onChange(Math.min(max, Math.max(min, Number(e.target.value))))}
          className="w-10 bg-[#222] border border-[#333] text-[10px] text-right rounded px-1 text-gray-300 focus:border-brand-primary outline-none"
        />
        <span className="text-[10px] text-gray-500 w-3">{unit}</span>
      </div>
    </div>
    <div className="relative h-1 bg-[#333] rounded-full group cursor-ew-resize">
       <div 
        className="absolute h-full bg-brand-primary rounded-full pointer-events-none" 
        style={{ width: `${((value - min) / (max - min)) * 100}%` }}
       ></div>
       <input 
        type="range" 
        min={min} 
        max={max}
        step={0.1}
        value={value} 
        onChange={(e) => onChange(parseFloat(e.target.value))} 
        className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize"
       />
       <div 
        className="w-3 h-3 bg-white rounded-full absolute top-1/2 -translate-y-1/2 -ml-1.5 shadow pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ left: `${((value - min) / (max - min)) * 100}%` }}
       />
    </div>
  </div>
);

const Accordion = ({ title, isOpen, onToggle, children }: { title: string, isOpen: boolean, onToggle: () => void, children?: React.ReactNode }) => (
  <div className="border-b border-[#222]">
    <button onClick={onToggle} className="w-full flex items-center justify-between p-3 hover:bg-[#1A1A1A] transition-colors">
      <span className="text-xs font-bold text-gray-300">{title}</span>
      <ChevronRight size={14} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ height: 0, opacity: 0 }} 
          animate={{ height: 'auto', opacity: 1 }} 
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden"
        >
          <div className="p-3 pt-0">{children}</div>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface EditorInterfaceProps {
  onBack: () => void;
  initialVideoFile?: File | null;
}

export const EditorInterface: React.FC<EditorInterfaceProps> = ({ onBack, initialVideoFile }) => {
  // --- LAYOUT ---
  const [leftPanelWidth, setLeftPanelWidth] = useState(320);
  const [rightPanelWidth, setRightPanelWidth] = useState(350);
  const [timelineHeight, setTimelineHeight] = useState(350);
  const [activeLeftTab, setActiveLeftTab] = useState<'media' | 'edit'>('media');
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  
  // EDIT SECTIONS STATE
  const [editSections, setEditSections] = useState({
    basic: true,
    color: false,
    audio: false,
    effects: false,
    transitions: false,
    speed: false,
  });

  const toggleSection = (section: keyof typeof editSections) => {
    setEditSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // --- STATE ---
  const [mediaLibrary, setMediaLibrary] = useState<MediaAsset[]>([
     { id: '1', type: 'image', src: 'https://images.unsplash.com/photo-1614728853970-302260444909?q=80&w=2574&auto=format&fit=crop', name: 'scene_1.png', duration: 5, width: 1920, height: 1080, timestamp: 'less than a minute ago' },
  ]);
  
  // PRO TRACK STRUCTURE
  const [tracks, setTracks] = useState<Track[]>([
    { id: 1, name: 'V1', type: 'video', isMuted: false, isLocked: false, isHidden: false, clips: [] },
    { id: 2, name: 'V2', type: 'video', isMuted: false, isLocked: false, isHidden: false, clips: [] },
    { id: 3, name: 'A1', type: 'audio', isMuted: false, isLocked: false, isHidden: false, clips: [] },
    { id: 4, name: 'T1', type: 'overlay', isMuted: false, isLocked: false, isHidden: false, clips: [] },
  ]);

  const defaultProps: Omit<TimelineClip, keyof MediaAsset | 'startTime' | 'offset'> = {
    scale: 100, rotation: 0, x: 0, y: 0, opacity: 100,
    volume: 100, speed: 1, eqBass: 0, eqMid: 0, eqTreble: 0, audioCompressor: false, audioDenoise: false,
    contrast: 100, saturation: 100, brightness: 100, exposure: 100, temperature: 0, tint: 0, blur: 0,
    fadeIn: 0, fadeOut: 0,
    vignette: 0, chromaKey: false, chromaColor: '#00ff00', filmGrain: false,
    transitionIn: 'none', transitionOut: 'none', transitionDuration: 1.0, transitionEasing: 'linear',
    maskType: 'none', maskFeather: 0, maskInvert: false,
    keyframes: {}, keyframeEasing: 'linear',
    speedRamp: false, opticalFlow: false, pitchCorrection: true,
    isAiEnhanced: false, isStabilized: false
  };

  const [selectedClipId, setSelectedClipId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<number | null>(null);

  // --- PLAYBACK ---
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(60);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(40); // Pixels per second
  const [snappingEnabled, setSnappingEnabled] = useState(true);

  // --- CANVAS GIZMO STATE ---
  const [isGizmoDragging, setIsGizmoDragging] = useState(false);
  const [gizmoAction, setGizmoAction] = useState<'move' | 'scale' | 'rotate' | null>(null);
  const gizmoStartRef = useRef<{ x: number, y: number, valX: number, valY: number, valScale: number, valRot: number } | null>(null);

  // --- DRAG STATE ---
  const [dragState, setDragState] = useState<{
    clipId: string, 
    trackId: number, 
    startX: number, 
    originalTime: number, 
    originalDuration: number,
    originalOffset: number,
    mode: 'move' | 'trim-start' | 'trim-end'
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const playLoopRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- AI STATE ---
  const [apiKey, setApiKey] = useState('AIzaSyCq-1A8E4_Eed-NOlwVrnRbv24xF29RA6s');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [promptInput, setPromptInput] = useState('');
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // --- SAFE API KEY ACCESS ---
  const getApiKey = () => {
    try {
      if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
      }
    } catch (e) {
      // process is undefined in browser if not provided by bundler
    }
    return apiKey;
  };

  // --- INITIAL LOAD ---
  useEffect(() => {
    if (initialVideoFile) {
        const url = URL.createObjectURL(initialVideoFile);
        const newAsset: MediaAsset = {
            id: Math.random().toString(),
            type: 'video',
            src: url,
            name: initialVideoFile.name,
            duration: 10, // Placeholder duration until metadata load
            width: 1920,
            height: 1080,
            timestamp: 'Just now'
        };
        
        // Add to library
        setMediaLibrary(prev => [newAsset, ...prev]);

        // Add to V1 track automatically
        const newClip: TimelineClip = { ...newAsset, startTime: 0, offset: 0, ...defaultProps };
        setTracks(prev => prev.map(t => t.id === 1 ? { ...t, clips: [newClip] } : t));
        setSelectedClipId(newClip.id);
        
        // Add welcome message from AI
        setChatHistory([{
            id: 'welcome',
            role: 'assistant',
            content: `I've analyzed ${initialVideoFile.name}. I detected a weak hook in the first 3 seconds. Would you like me to fix it by applying a dynamic zoom?`
        }]);
    } else {
        // Clean start if no file
        setTracks(prev => prev.map(t => ({...t, clips: []})));
    }
  }, [initialVideoFile]);

  // --- HELPERS ---
  const getClipById = (id: string) => {
    for (const track of tracks) {
      const clip = track.clips.find(c => c.id === id);
      if (clip) return { clip, track };
    }
    return null;
  };

  const selectedClip = selectedClipId ? getClipById(selectedClipId)?.clip : null;

  // --- PLAYBACK ENGINE ---
  const updatePlayback = useCallback(() => {
    if (!isPlaying) return;
    setCurrentTime(prev => {
      const next = prev + 0.033;
      if (next >= totalDuration) {
        setIsPlaying(false);
        return 0;
      }
      return next;
    });
    playLoopRef.current = requestAnimationFrame(updatePlayback);
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    if (isPlaying) {
      videoRef.current?.play().catch(() => {});
      playLoopRef.current = requestAnimationFrame(updatePlayback);
    } else {
      videoRef.current?.pause();
      if (playLoopRef.current) cancelAnimationFrame(playLoopRef.current);
    }
    return () => { if (playLoopRef.current) cancelAnimationFrame(playLoopRef.current); };
  }, [isPlaying, updatePlayback]);

  // SYNC VIDEO ELEMENT
  const activeVideoClip = tracks
    .filter(t => t.type === 'video' && !t.isHidden)
    .sort((a, b) => b.id - a.id) // Sort tracks by ID descending (highest on top)
    .reduce((acc: TimelineClip | undefined, track) => {
        if (acc) return acc;
        return track.clips.find(c => currentTime >= c.startTime && currentTime < c.startTime + c.duration);
    }, undefined);

  useEffect(() => {
    if (videoRef.current && activeVideoClip && activeVideoClip.type === 'video') {
       videoRef.current.playbackRate = activeVideoClip.speed;
       videoRef.current.volume = (activeVideoClip.volume || 100) / 100;
       
       const timeInClip = (currentTime - activeVideoClip.startTime) * activeVideoClip.speed + activeVideoClip.offset;
       if (Math.abs(videoRef.current.currentTime - timeInClip) > 0.5) {
          videoRef.current.currentTime = Math.max(0, timeInClip);
       }
    }
  }, [currentTime, activeVideoClip]);

  // --- TIMELINE ACTIONS ---

  const handleDragStart = (e: React.MouseEvent, clip: TimelineClip, trackId: number, mode: 'move' | 'trim-start' | 'trim-end') => {
    e.stopPropagation();
    e.preventDefault(); 
    
    // Prevent dragging if just clicking (threshold check inside mousemove)
    
    if (toolMode === 'razor') {
        const rect = e.currentTarget.getBoundingClientRect();
        // Calculate split time relative to clip's internal time
        const clickX = e.nativeEvent.offsetX; 
        const timeInClip = clickX / zoomLevel;
        const globalSplitTime = clip.startTime + timeInClip;

        setSelectedClipId(clip.id);
        handleSplitClip(clip.id, globalSplitTime);
        return;
    }

    setDragState({
        clipId: clip.id,
        trackId: trackId,
        startX: e.clientX,
        originalTime: clip.startTime,
        originalDuration: clip.duration,
        originalOffset: clip.offset,
        mode
    });
    setSelectedClipId(clip.id);
    setActiveLeftTab('edit');
  };

  const handleSplitClip = (clipId: string, time: number) => {
     const data = getClipById(clipId);
     if (!data) return;
     const { clip, track } = data;
     
     if (time <= clip.startTime || time >= clip.startTime + clip.duration) return;
     
     const splitPoint = time - clip.startTime;
     
     const updatedOriginal = { ...clip, duration: splitPoint };
     
     const newClip: TimelineClip = {
         ...clip,
         id: Math.random().toString(),
         startTime: time,
         duration: clip.duration - splitPoint,
         offset: clip.offset + splitPoint,
         name: clip.name + " (Split)"
     };

     setTracks(prev => prev.map(t => {
         if (t.id !== track.id) return t;
         return { ...t, clips: t.clips.map(c => c.id === clipId ? updatedOriginal : c).concat(newClip) };
     }));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
        if (dragState) {
            const deltaPixels = e.clientX - dragState.startX;
            
            // Threshold for Move to avoid accidental micro-drags
            if (Math.abs(deltaPixels) < 5 && dragState.mode === 'move') return;

            const deltaTime = deltaPixels / zoomLevel;

            setTracks(prev => prev.map(track => {
                if (track.id !== dragState.trackId) return track;

                return {
                    ...track,
                    clips: track.clips.map(clip => {
                        if (clip.id !== dragState.clipId) return clip;

                        let newStart = clip.startTime;
                        let newDuration = clip.duration;
                        let newOffset = clip.offset;

                        if (dragState.mode === 'move') {
                            newStart = Math.max(0, dragState.originalTime + deltaTime);
                        } 
                        else if (dragState.mode === 'trim-start') {
                            const maxTrim = dragState.originalDuration - 0.1;
                            const change = Math.min(Math.max(deltaTime, -dragState.originalTime), maxTrim);
                            newStart = dragState.originalTime + change;
                            newDuration = dragState.originalDuration - change;
                            newOffset = dragState.originalOffset + change;
                        } 
                        else if (dragState.mode === 'trim-end') {
                            newDuration = Math.max(0.1, dragState.originalDuration + deltaTime);
                        }

                        return { ...clip, startTime: newStart, duration: newDuration, offset: newOffset };
                    })
                };
            }));
        }

        // GIZMO LOGIC
        if (isGizmoDragging && gizmoStartRef.current && selectedClipId) {
            const deltaX = e.clientX - gizmoStartRef.current.x;
            const deltaY = e.clientY - gizmoStartRef.current.y;
            
            setTracks(prev => prev.map(t => ({
                ...t,
                clips: t.clips.map(c => {
                    if (c.id !== selectedClipId) return c;
                    
                    if (gizmoAction === 'move') {
                        // Assuming canvas scale factor is 1 for simplicity, in real app needs normalization
                        return { ...c, x: gizmoStartRef.current!.valX + deltaX, y: gizmoStartRef.current!.valY + deltaY };
                    }
                    if (gizmoAction === 'scale') {
                         return { ...c, scale: Math.max(10, gizmoStartRef.current!.valScale + (deltaX * 0.5)) };
                    }
                    if (gizmoAction === 'rotate') {
                         return { ...c, rotation: gizmoStartRef.current!.valRot + (deltaX * 0.5) };
                    }
                    return c;
                })
            })));
        }
    };

    const handleMouseUp = () => {
        setDragState(null);
        setIsGizmoDragging(false);
        setGizmoAction(null);
    };

    if (dragState || isGizmoDragging) {
        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState, isGizmoDragging, gizmoAction, zoomLevel, snappingEnabled, currentTime, selectedClipId]);

  const handleDropToTrack = (e: React.DragEvent, trackId: number) => {
      e.preventDefault();
      const assetId = e.dataTransfer.getData("assetId");
      if (!assetId) return;
      const asset = mediaLibrary.find(a => a.id === assetId);
      if (!asset) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const scrollLeft = e.currentTarget.scrollLeft || 0;
      const dropTime = Math.max(0, (e.clientX - rect.left + scrollLeft) / zoomLevel);

      const newClip: TimelineClip = {
          ...asset,
          id: Math.random().toString(),
          startTime: dropTime,
          offset: 0,
          ...defaultProps
      };

      setTracks(prev => prev.map(t => {
          if (t.id !== trackId) return t;
          return { ...t, clips: [...t.clips, newClip] };
      }));
      setSelectedClipId(newClip.id);
  };

  const deleteSelected = () => {
      if (!selectedClipId) return;
      setTracks(prev => prev.map(t => ({
          ...t, clips: t.clips.filter(c => c.id !== selectedClipId)
      })));
      setSelectedClipId(null);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('image') ? 'image' : file.type.startsWith('audio') ? 'audio' : 'video';
      const newAsset: MediaAsset = {
          id: Math.random().toString(), type: type as MediaType, src: url, name: file.name,
          duration: type === 'image' ? 5 : 10, width: 1920, height: 1080, timestamp: 'Just now'
      };
      setMediaLibrary(prev => [newAsset, ...prev]);
      
      const targetTrack = tracks.find(t => t.type === (type === 'audio' ? 'audio' : 'video'));
      if (targetTrack) {
          const newClip: TimelineClip = { ...newAsset, startTime: currentTime, offset: 0, ...defaultProps };
          setTracks(prev => prev.map(t => t.id === targetTrack.id ? { ...t, clips: [...t.clips, newClip] } : t));
          setSelectedClipId(newClip.id);
      }
  };

  const updateSelectedClip = (prop: keyof TimelineClip, value: any) => {
      if (!selectedClipId) return;
      setTracks(prev => prev.map(t => ({
          ...t,
          clips: t.clips.map(c => c.id === selectedClipId ? { ...c, [prop]: value } : c)
      })));
  };

  const toggleKeyframe = (prop: string) => {
      if (!selectedClipId || !selectedClip) return;
      const hasKey = !!selectedClip.keyframes[prop];
      
      const newKeyframes = { ...selectedClip.keyframes };
      if (hasKey) delete newKeyframes[prop];
      else newKeyframes[prop] = true;

      updateSelectedClip('keyframes', newKeyframes);
  };

  // --- GIZMO HANDLERS ---
  const handleGizmoStart = (e: React.MouseEvent, action: 'move' | 'scale' | 'rotate') => {
      e.stopPropagation();
      e.preventDefault();
      if (!selectedClip) return;
      
      setIsGizmoDragging(true);
      setGizmoAction(action);
      gizmoStartRef.current = {
          x: e.clientX,
          y: e.clientY,
          valX: selectedClip.x,
          valY: selectedClip.y,
          valScale: selectedClip.scale,
          valRot: selectedClip.rotation
      };
  };

  const handleSendMessage = async () => {
    if (!promptInput.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: promptInput,
    };

    setChatHistory((prev) => [...prev, userMessage]);
    setPromptInput('');

    try {
      const key = getApiKey();
      if (!key) throw new Error("API Key not found");
      
      const ai = new GoogleGenAI({ apiKey: key });
      const chat = ai.chats.create({
        model: 'gemini-2.5-flash',
        history: chatHistory.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'model',
          parts: [{ text: msg.content }]
        }))
      });

      const result = await chat.sendMessage({ message: userMessage.content });
      const responseText = result.text;

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseText
      };
      setChatHistory((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error(error);
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Error: Could not generate response. Please check API Key."
      };
      setChatHistory((prev) => [...prev, errorMessage]);
    }
  };

  // --- RENDER HELPERS ---
  const getVideoFilter = (clip: TimelineClip) => {
      let filter = `contrast(${clip.contrast}%) brightness(${clip.brightness}%) saturate(${clip.saturation}%) opacity(${clip.opacity}%)`;
      if (clip.blur > 0) filter += ` blur(${clip.blur}px)`;
      if (clip.temperature !== 0) filter += ` sepia(${Math.abs(clip.temperature) / 200}) hue-rotate(${clip.temperature}deg)`;
      return filter;
  };

  const getClipMask = (clip: TimelineClip) => {
      if (clip.maskType === 'circle') return `circle(${50 - (clip.maskFeather/4)}% at 50% 50%)`;
      if (clip.maskType === 'rectangle') return `inset(${clip.maskFeather/2}%)`;
      return 'none';
  };

  return (
    <div className="fixed inset-0 bg-[#0F0F0F] text-white font-sans flex flex-col z-50 overflow-hidden select-none">
      
      {/* 1. HEADER */}
      <div className="h-14 border-b border-[#222] bg-[#0F0F0F] flex items-center justify-between px-4 z-20 flex-shrink-0">
         <div className="flex items-center gap-4">
            <button onClick={onBack} className="p-2 hover:bg-[#222] rounded-full text-gray-400"><Undo2 size={18} /></button>
            <div className="flex items-center gap-2 group">
               <div className="relative w-8 h-8 flex items-center justify-center">
                   <svg width="32" height="32" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 8L32 20L8 32V8Z" fill="url(#logo_gradient_editor)" />
                      <defs>
                        <linearGradient id="logo_gradient_editor" x1="0" y1="0" x2="1" y2="1">
                          <stop offset="0%" stopColor="#6366f1" />
                          <stop offset="100%" stopColor="#a855f7" />
                        </linearGradient>
                      </defs>
                   </svg>
               </div>
               <span className="font-black text-lg tracking-tight">VFXB Studio</span>
            </div>
         </div>
         <div className="flex items-center gap-4">
            <button onClick={() => setShowApiKeyInput(!showApiKeyInput)} className="text-gray-400 hover:text-white"><Settings2 size={18} /></button>
            <button className="bg-white text-black px-4 py-1.5 rounded text-xs font-bold hover:bg-gray-200 flex items-center gap-2">Export <Download size={14}/></button>
         </div>
      </div>

      {/* 2. MAIN WORKSPACE */}
      <div className="flex-1 flex overflow-hidden">
         {/* LEFT PANEL */}
         <div style={{ width: leftPanelWidth }} className="bg-[#0F0F0F] border-r border-[#222] flex flex-col flex-shrink-0">
             <div className="flex border-b border-[#222]">
                <button onClick={() => setActiveLeftTab('media')} className={`flex-1 py-3 text-xs font-bold ${activeLeftTab === 'media' ? 'text-white border-b-2 border-brand-primary' : 'text-gray-500'}`}>Media</button>
                <button onClick={() => setActiveLeftTab('edit')} className={`flex-1 py-3 text-xs font-bold ${activeLeftTab === 'edit' ? 'text-white border-b-2 border-brand-primary' : 'text-gray-500'}`}>Edit</button>
             </div>
             <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#111]">
                {activeLeftTab === 'media' ? (
                    <div className="p-4 space-y-4">
                        <div onClick={() => fileInputRef.current?.click()} className="border-2 border-dashed border-[#333] hover:border-brand-primary hover:bg-[#1A1A1A] rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition-all">
                            <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} />
                            <CloudUpload size={24} className="text-gray-400 mb-2" />
                            <p className="text-xs font-bold text-gray-300">Import Media</p>
                        </div>
                        <div className="space-y-2">
                           <h4 className="text-xs font-bold text-gray-500 uppercase">Library</h4>
                           {mediaLibrary.map(asset => (
                               <div key={asset.id} draggable onDragStart={(e) => e.dataTransfer.setData("assetId", asset.id)} className="flex items-center gap-3 p-2 rounded bg-[#1A1A1A] hover:bg-[#222] border border-[#333] cursor-grab">
                                   <div className="w-12 h-12 bg-black rounded overflow-hidden">
                                       {asset.type !== 'audio' && <img src={asset.src || asset.thumbnail} className="w-full h-full object-cover"/>}
                                       {asset.type === 'audio' && <AudioLines className="w-full h-full p-2 text-green-500"/>}
                                   </div>
                                   <div>
                                       <p className="text-xs text-white font-medium truncate w-32">{asset.name}</p>
                                       <p className="text-[10px] text-gray-500">{asset.type}</p>
                                   </div>
                               </div>
                           ))}
                        </div>
                    </div>
                ) : (
                    <div className="">
                        {selectedClip ? (
                            <>
                                <div className="p-4 border-b border-[#222]">
                                     <h4 className="text-sm font-bold truncate flex items-center gap-2">
                                        {selectedClip.type === 'video' ? <FileVideo size={14}/> : <ImageIcon size={14}/>} 
                                        {selectedClip.name}
                                     </h4>
                                </div>
                                
                                {/* 1. BASIC TRANSFORM */}
                                <Accordion title="Transform & Opacity" isOpen={editSections.basic} onToggle={() => toggleSection('basic')}>
                                    <div className="mb-2 flex items-center justify-between">
                                        <label className="text-[10px] text-gray-400 uppercase">Keyframe Easing</label>
                                        <select 
                                            value={selectedClip.keyframeEasing} 
                                            onChange={(e) => updateSelectedClip('keyframeEasing', e.target.value)}
                                            className="bg-[#222] text-[10px] p-1 rounded border border-[#333]"
                                        >
                                            <option value="linear">Linear</option>
                                            <option value="bezier">Bezier</option>
                                        </select>
                                    </div>
                                    <PropertySlider label="Scale" value={selectedClip.scale} min={10} max={200} onChange={(v) => updateSelectedClip('scale', v)} unit="%" 
                                      hasKeyframe={!!selectedClip.keyframes['scale']} onKeyframeToggle={() => toggleKeyframe('scale')}
                                    />
                                    <PropertySlider label="Position X" value={selectedClip.x} min={-500} max={500} onChange={(v) => updateSelectedClip('x', v)} 
                                       hasKeyframe={!!selectedClip.keyframes['x']} onKeyframeToggle={() => toggleKeyframe('x')}
                                    />
                                    <PropertySlider label="Position Y" value={selectedClip.y} min={-500} max={500} onChange={(v) => updateSelectedClip('y', v)} 
                                       hasKeyframe={!!selectedClip.keyframes['y']} onKeyframeToggle={() => toggleKeyframe('y')}
                                    />
                                    <PropertySlider label="Rotation" value={selectedClip.rotation} min={-180} max={180} onChange={(v) => updateSelectedClip('rotation', v)} unit="°" 
                                       hasKeyframe={!!selectedClip.keyframes['rotation']} onKeyframeToggle={() => toggleKeyframe('rotation')}
                                    />
                                    <PropertySlider label="Opacity" value={selectedClip.opacity} min={0} max={100} onChange={(v) => updateSelectedClip('opacity', v)} unit="%" 
                                       hasKeyframe={!!selectedClip.keyframes['opacity']} onKeyframeToggle={() => toggleKeyframe('opacity')}
                                    />
                                </Accordion>

                                {/* 2. TRANSITIONS */}
                                <Accordion title="Transitions" isOpen={editSections.transitions} onToggle={() => toggleSection('transitions')}>
                                     <div className="mb-4">
                                        <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2 block">Enter Animation</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['none', 'fade', 'slide', 'wipe', 'zoom', 'blur', 'glitch'].map(type => (
                                                <button key={type} onClick={() => updateSelectedClip('transitionIn', type)} className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${selectedClip.transitionIn === type ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-[#222] border-[#333] text-gray-500 hover:text-gray-300'}`}>
                                                    <div className="w-4 h-4 rounded-sm bg-current mb-1 opacity-50"></div>
                                                    <span className="text-[9px] capitalize">{type}</span>
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                     <div className="mb-4">
                                        <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2 block">Exit Animation</label>
                                        <div className="grid grid-cols-4 gap-2">
                                            {['none', 'fade', 'slide', 'wipe', 'zoom', 'blur', 'glitch'].map(type => (
                                                <button key={type} onClick={() => updateSelectedClip('transitionOut', type)} className={`flex flex-col items-center justify-center p-2 rounded border transition-colors ${selectedClip.transitionOut === type ? 'bg-brand-primary/20 border-brand-primary text-white' : 'bg-[#222] border-[#333] text-gray-500 hover:text-gray-300'}`}>
                                                    <div className="w-4 h-4 rounded-sm bg-current mb-1 opacity-50"></div>
                                                    <span className="text-[9px] capitalize">{type}</span>
                                                </button>
                                            ))}
                                        </div>
                                     </div>
                                     <PropertySlider label="Duration" value={selectedClip.transitionDuration} min={0.1} max={5.0} onChange={(v) => updateSelectedClip('transitionDuration', v)} unit="s" />
                                     <div className="flex justify-between items-center">
                                        <label className="text-[10px] text-gray-400">Easing</label>
                                        <select value={selectedClip.transitionEasing} onChange={e => updateSelectedClip('transitionEasing', e.target.value)} className="bg-[#222] text-[10px] p-1 rounded border border-[#333]">
                                            <option value="linear">Linear</option>
                                            <option value="easeIn">Ease In</option>
                                            <option value="easeOut">Ease Out</option>
                                            <option value="easeInOut">Ease In Out</option>
                                        </select>
                                     </div>
                                </Accordion>

                                {/* 3. SPEED CONTROL */}
                                <Accordion title="Speed Ramping" isOpen={editSections.speed} onToggle={() => toggleSection('speed')}>
                                    <div className="flex items-center gap-2 mb-4">
                                        <Gauge size={16} className="text-brand-accent"/>
                                        <span className="text-xs text-gray-300">Playback Speed</span>
                                    </div>
                                    <div className="h-16 bg-[#1A1A1A] rounded border border-[#333] mb-4 relative overflow-hidden flex items-end">
                                        <svg className="w-full h-full p-2" viewBox="0 0 100 40" preserveAspectRatio="none">
                                            <path d={`M0,35 C30,35 70,${35 - (selectedClip.speed * 5)} 100,${35 - (selectedClip.speed * 8)}`} fill="none" stroke="#6366f1" strokeWidth="2" />
                                            <area />
                                        </svg>
                                        <span className="absolute top-2 right-2 text-xs font-bold text-white">{selectedClip.speed}x</span>
                                    </div>
                                    <PropertySlider label="Speed" value={selectedClip.speed} min={0.1} max={5.0} onChange={(v) => updateSelectedClip('speed', v)} unit="x" />
                                    <div className="flex justify-between mt-2 mb-4">
                                        {[0.5, 1.0, 2.0, 5.0].map(s => (
                                            <button key={s} onClick={() => updateSelectedClip('speed', s)} className="text-[10px] bg-[#222] px-2 py-1 rounded hover:text-white text-gray-400">{s}x</button>
                                        ))}
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] text-gray-400 flex items-center gap-2"><Wind size={12}/> Optical Flow (Smooth)</label>
                                            <input type="checkbox" checked={selectedClip.opticalFlow} onChange={(e) => updateSelectedClip('opticalFlow', e.target.checked)} className="accent-brand-primary"/>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <label className="text-[11px] text-gray-400 flex items-center gap-2"><Music4 size={12}/> Pitch Correction</label>
                                            <input type="checkbox" checked={selectedClip.pitchCorrection} onChange={(e) => updateSelectedClip('pitchCorrection', e.target.checked)} className="accent-brand-primary"/>
                                        </div>
                                    </div>
                                </Accordion>

                                {/* 4. COLOR GRADING */}
                                <Accordion title="Color & Filter" isOpen={editSections.color} onToggle={() => toggleSection('color')}>
                                    <div className="grid grid-cols-2 gap-2 mb-2">
                                       <div className="bg-[#1A1A1A] p-2 rounded text-center border border-[#333]">
                                           <Sun size={14} className="mx-auto mb-1 text-yellow-500"/>
                                           <span className="text-[10px] text-gray-400">Exp</span>
                                       </div>
                                       <div className="bg-[#1A1A1A] p-2 rounded text-center border border-[#333]">
                                           <Aperture size={14} className="mx-auto mb-1 text-blue-400"/>
                                           <span className="text-[10px] text-gray-400">Con</span>
                                       </div>
                                    </div>
                                    <PropertySlider label="Exposure" value={selectedClip.exposure} min={0} max={200} onChange={(v) => updateSelectedClip('exposure', v)} />
                                    <PropertySlider label="Contrast" value={selectedClip.contrast} min={0} max={200} onChange={(v) => updateSelectedClip('contrast', v)} />
                                    <PropertySlider label="Saturation" value={selectedClip.saturation} min={0} max={200} onChange={(v) => updateSelectedClip('saturation', v)} />
                                    <PropertySlider label="Temp" value={selectedClip.temperature} min={-100} max={100} onChange={(v) => updateSelectedClip('temperature', v)} />
                                </Accordion>

                                {/* 5. ADVANCED AUDIO */}
                                <Accordion title="Audio & EQ" isOpen={editSections.audio} onToggle={() => toggleSection('audio')}>
                                     <div className="flex items-center justify-between mb-2">
                                         <label className="text-[11px] text-gray-400 font-medium uppercase">Master Gain</label>
                                         <span className="text-[10px] text-brand-primary font-bold">{selectedClip.volume}%</span>
                                     </div>
                                     <div className="h-32 flex items-end justify-between gap-1 bg-[#111] p-2 rounded mb-4 border border-[#222]">
                                         {[...Array(8)].map((_, i) => (
                                             <div key={i} className="w-full bg-green-500/20 rounded-t-sm relative">
                                                 <div className="absolute bottom-0 w-full bg-green-500 rounded-t-sm transition-all" style={{ height: `${Math.min(100, selectedClip.volume * (0.5 + Math.random()*0.5))}%` }}></div>
                                             </div>
                                         ))}
                                     </div>
                                     <PropertySlider label="Volume" value={selectedClip.volume} min={0} max={200} onChange={(v) => updateSelectedClip('volume', v)} />
                                     
                                     <div className="mt-6 mb-2">
                                         <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider block mb-2">3-Band Equalizer</label>
                                         <PropertySlider label="Bass" value={selectedClip.eqBass} min={-12} max={12} onChange={(v) => updateSelectedClip('eqBass', v)} unit="dB" />
                                         <PropertySlider label="Mid" value={selectedClip.eqMid} min={-12} max={12} onChange={(v) => updateSelectedClip('eqMid', v)} unit="dB" />
                                         <PropertySlider label="Treble" value={selectedClip.eqTreble} min={-12} max={12} onChange={(v) => updateSelectedClip('eqTreble', v)} unit="dB" />
                                     </div>
                                     
                                     <div className="border-t border-[#333] pt-4 mt-4 space-y-2">
                                         <div className="flex items-center justify-between">
                                             <label className="text-[11px] text-gray-400 flex items-center gap-2"><Waves size={12}/> Noise Reduction</label>
                                             <input type="checkbox" checked={selectedClip.audioDenoise} onChange={(e) => updateSelectedClip('audioDenoise', e.target.checked)} className="accent-brand-primary"/>
                                         </div>
                                         <div className="flex items-center justify-between">
                                             <label className="text-[11px] text-gray-400 flex items-center gap-2"><Disc size={12}/> Compressor</label>
                                             <input type="checkbox" checked={selectedClip.audioCompressor} onChange={(e) => updateSelectedClip('audioCompressor', e.target.checked)} className="accent-brand-primary"/>
                                         </div>
                                     </div>
                                </Accordion>

                                {/* 6. EFFECTS (MASKING, CHROMA) */}
                                <Accordion title="Effects & Mask" isOpen={editSections.effects} onToggle={() => toggleSection('effects')}>
                                    <div className="mb-4">
                                        <label className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-2 block">Mask Shape</label>
                                        <div className="flex gap-2 bg-[#222] p-1 rounded">
                                            {['none', 'rectangle', 'circle'].map((m) => (
                                                <button 
                                                  key={m}
                                                  onClick={() => updateSelectedClip('maskType', m)}
                                                  className={`flex-1 text-[10px] py-1 capitalize rounded ${selectedClip.maskType === m ? 'bg-brand-primary text-white' : 'text-gray-400 hover:text-white'}`}
                                                >
                                                  {m}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                    {selectedClip.maskType !== 'none' && (
                                       <>
                                         <PropertySlider label="Feather" value={selectedClip.maskFeather} min={0} max={50} onChange={(v) => updateSelectedClip('maskFeather', v)} unit="px" />
                                         <div className="flex items-center justify-between mt-2">
                                             <label className="text-[11px] text-gray-400">Invert Mask</label>
                                             <input type="checkbox" checked={selectedClip.maskInvert} onChange={(e) => updateSelectedClip('maskInvert', e.target.checked)} className="accent-brand-primary"/>
                                         </div>
                                       </>
                                    )}

                                    <div className="flex items-center justify-between py-2 border-t border-[#222] mt-4 pt-4">
                                        <div className="flex items-center gap-2">
                                          <Palette size={14} className="text-green-500"/>
                                          <span className="text-xs text-gray-300">Chroma Key</span>
                                        </div>
                                        <button onClick={() => updateSelectedClip('chromaKey', !selectedClip.chromaKey)} className={`w-8 h-4 rounded-full relative transition-colors ${selectedClip.chromaKey ? 'bg-brand-primary' : 'bg-[#333]'}`}>
                                            <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${selectedClip.chromaKey ? 'left-4.5' : 'left-0.5'}`} />
                                        </button>
                                    </div>
                                    {selectedClip.chromaKey && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <div className="w-full h-6 rounded bg-green-500 border border-white/20 cursor-pointer"></div>
                                            <Pipette size={14} className="text-gray-400 cursor-pointer"/>
                                        </div>
                                    )}
                                </Accordion>
                            </>
                        ) : (
                             <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                                 <BoxSelect size={32} className="mb-2 opacity-50"/>
                                 <p className="text-xs">Select a clip to view properties</p>
                             </div>
                        )}
                    </div>
                )}
             </div>
         </div>
         <Resizer direction="horizontal" onResize={(d) => setLeftPanelWidth(w => w + d)} />

         {/* CENTER: PREVIEW */}
         <div className="flex-1 bg-[#0A0A0A] flex flex-col relative min-w-0" ref={canvasRef}>
             <div className="flex-1 flex items-center justify-center p-8 overflow-hidden bg-[#050505]">
                 <div className="relative shadow-2xl bg-black aspect-video max-h-full h-full w-auto group overflow-hidden border border-[#222]">
                     
                     {/* RENDER ACTIVE VIDEO */}
                     {activeVideoClip ? (
                         <div 
                            className="relative w-full h-full"
                            style={{
                                transform: `scale(${activeVideoClip.scale / 100}) rotate(${activeVideoClip.rotation}deg) translate(${activeVideoClip.x}px, ${activeVideoClip.y}px)`,
                                transition: isGizmoDragging ? 'none' : 'all 0.1s ease-out'
                            }}
                            onMouseDown={(e) => handleGizmoStart(e, 'move')}
                         >
                             <video 
                                 ref={videoRef} 
                                 src={activeVideoClip.src} 
                                 className="w-full h-full object-contain pointer-events-none"
                                 style={{
                                     filter: getVideoFilter(activeVideoClip),
                                     clipPath: getClipMask(activeVideoClip),
                                     maskImage: activeVideoClip.chromaKey ? `linear-gradient(to bottom, black, transparent)` : 'none' // Simulating chroma
                                 }}
                             />
                             
                             {/* GIZMO OVERLAY */}
                             {selectedClipId === activeVideoClip.id && (
                                <div className="absolute inset-0 border-2 border-brand-primary pointer-events-none">
                                    {/* CORNER HANDLES */}
                                    <div className="absolute -top-1.5 -left-1.5 w-3 h-3 bg-white border border-brand-primary pointer-events-auto cursor-nwse-resize" onMouseDown={(e) => handleGizmoStart(e, 'scale')}/>
                                    <div className="absolute -top-1.5 -right-1.5 w-3 h-3 bg-white border border-brand-primary pointer-events-auto cursor-nesw-resize" onMouseDown={(e) => handleGizmoStart(e, 'scale')}/>
                                    <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 bg-white border border-brand-primary pointer-events-auto cursor-nesw-resize" onMouseDown={(e) => handleGizmoStart(e, 'scale')}/>
                                    <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 bg-white border border-brand-primary pointer-events-auto cursor-nwse-resize" onMouseDown={(e) => handleGizmoStart(e, 'scale')}/>
                                    
                                    {/* ROTATION HANDLE */}
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                       <div className="w-0.5 h-6 bg-brand-primary"></div>
                                       <div className="w-4 h-4 bg-white rounded-full border border-brand-primary shadow cursor-alias pointer-events-auto flex items-center justify-center" onMouseDown={(e) => handleGizmoStart(e, 'rotate')}>
                                          <RotateCw size={10} className="text-black"/>
                                       </div>
                                    </div>
                                </div>
                             )}
                         </div>
                     ) : (
                         <div className="w-full h-full flex flex-col items-center justify-center text-gray-700">
                             <MonitorPlay size={48} className="mb-4 opacity-20"/>
                             <p className="text-xs">Drag media to timeline</p>
                         </div>
                     )}

                     {/* TEXT OVERLAYS */}
                     {tracks.filter(t => t.type === 'overlay').flatMap(t => t.clips)
                        .filter(c => currentTime >= c.startTime && currentTime < c.startTime + c.duration)
                        .map(c => (
                            <div key={c.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <h2 className="text-6xl font-bold text-white drop-shadow-lg" style={{ fontSize: c.fontSize, color: c.fontColor }}>{c.content}</h2>
                            </div>
                        ))
                     }
                 </div>
             </div>
             {/* TRANSPORT */}
             <div className="h-12 border-t border-[#222] bg-[#0F0F0F] flex items-center justify-center gap-6">
                 <button onClick={() => setCurrentTime(0)}><SkipBack size={18} className="text-gray-400 hover:text-white"/></button>
                 <button onClick={() => setIsPlaying(!isPlaying)} className="w-10 h-10 bg-white rounded-full flex items-center justify-center hover:scale-105 transition-transform">
                     {isPlaying ? <Pause size={16} className="text-black fill-black"/> : <Play size={16} className="text-black fill-black ml-0.5"/>}
                 </button>
                 <button onClick={() => setCurrentTime(totalDuration)}><SkipForward size={18} className="text-gray-400 hover:text-white"/></button>
             </div>
         </div>
         <Resizer direction="horizontal" onResize={(d) => setRightPanelWidth(w => w - d)} />

         {/* RIGHT: AI */}
         <div style={{ width: rightPanelWidth }} className="bg-[#0F0F0F] border-l border-[#222] flex flex-col flex-shrink-0">
             <div className="h-12 border-b border-[#222] flex items-center px-4 bg-[#141414]">
                 <Bot size={16} className="text-brand-accent mr-2"/>
                 <span className="text-sm font-bold">VFXB Bot</span>
             </div>
             {showApiKeyInput && (
                 <div className="p-2 border-b border-[#333] bg-[#111]">
                     <input type="text" value={apiKey} onChange={e => setApiKey(e.target.value)} className="w-full bg-[#222] text-xs p-2 text-white border border-[#333] rounded" placeholder="API Key"/>
                 </div>
             )}
             <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar" ref={chatScrollRef}>
                 {chatHistory.map(msg => (
                     <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-[#333]' : 'bg-brand-primary'}`}>
                             {msg.role === 'user' ? <User size={14}/> : <Bot size={14} className="text-white"/>}
                         </div>
                         <div className={`p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'bg-[#222]' : 'bg-[#1A1A1A] border border-[#333]'}`}>
                             {msg.content}
                         </div>
                     </div>
                 ))}
             </div>
             <div className="p-4 border-t border-[#222]">
                 <div className="relative">
                     <textarea value={promptInput} onChange={e => setPromptInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSendMessage()} className="w-full bg-[#1A1A1A] border border-[#333] rounded-xl p-3 text-sm text-white h-12 pr-10 resize-none" placeholder="Ask AI..."/>
                     <button onClick={handleSendMessage} className="absolute right-2 top-2 p-1.5 bg-white text-black rounded"><ArrowRight size={14}/></button>
                 </div>
             </div>
         </div>
      </div>

      <Resizer direction="vertical" onResize={(d) => setTimelineHeight(h => h - d)} />

      {/* 3. PRO TIMELINE */}
      <div style={{ height: timelineHeight }} className="bg-[#0F0F0F] border-t border-[#222] flex flex-col flex-shrink-0">
          {/* TOOLBAR */}
          <div className="h-10 bg-[#141414] border-b border-[#222] flex items-center justify-between px-4">
              <div className="flex items-center gap-2">
                  <button onClick={() => setToolMode('select')} className={`p-1.5 rounded ${toolMode === 'select' ? 'bg-[#333] text-white' : 'text-gray-400'}`}><MousePointer2 size={14}/></button>
                  <button onClick={() => setToolMode('razor')} className={`p-1.5 rounded ${toolMode === 'razor' ? 'bg-brand-primary text-white' : 'text-gray-400'}`}><Scissors size={14}/></button>
                  <div className="w-[1px] h-4 bg-[#333] mx-1"></div>
                  <button onClick={() => setSnappingEnabled(!snappingEnabled)} className={`p-1.5 rounded ${snappingEnabled ? 'text-brand-accent' : 'text-gray-400'}`}><Magnet size={14}/></button>
                  <button onClick={deleteSelected} className="p-1.5 hover:text-red-400 text-gray-400"><Trash2 size={14}/></button>
              </div>
              <div className="flex items-center gap-2">
                  <ZoomOut size={14} className="text-gray-500 cursor-pointer" onClick={() => setZoomLevel(z => Math.max(10, z - 5))}/>
                  <input type="range" min="10" max="200" value={zoomLevel} onChange={e => setZoomLevel(Number(e.target.value))} className="w-24 h-1 bg-[#333] rounded-lg appearance-none accent-brand-primary"/>
                  <ZoomIn size={14} className="text-gray-500 cursor-pointer" onClick={() => setZoomLevel(z => Math.min(200, z + 5))}/>
              </div>
          </div>

          <div className="flex-1 flex overflow-hidden">
              {/* TRACK HEADERS */}
              <div className="w-64 bg-[#111] border-r border-[#222] flex flex-col flex-shrink-0 pt-6 z-10">
                  {tracks.map(track => (
                      <div key={track.id} className="h-24 border-b border-[#222] px-3 flex flex-col justify-center gap-2" onClick={() => setSelectedTrackId(track.id)}>
                          <div className="flex items-center justify-between text-gray-400">
                              <span className="text-xs font-bold font-mono">{track.name}</span>
                              <div className="flex gap-1">
                                  <button className="hover:text-white"><Eye size={12}/></button>
                                  <button className="hover:text-white"><Lock size={12}/></button>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>

              {/* TIMELINE AREA */}
              <div className="flex-1 overflow-x-auto relative bg-[#0A0A0A] custom-scrollbar" ref={scrollContainerRef}>
                   <div style={{ width: Math.max(2000, totalDuration * zoomLevel + 500) }} className="h-full relative">
                        {/* RULER */}
                        <div 
                             className="h-6 bg-[#0F0F0F] border-b border-[#222] sticky top-0 z-20 cursor-pointer select-none"
                             onClick={(e) => {
                                 const rect = e.currentTarget.getBoundingClientRect();
                                 const x = e.clientX - rect.left;
                                 setCurrentTime(x / zoomLevel);
                             }}
                        >
                            {Array.from({ length: Math.ceil(totalDuration) }).map((_, i) => (
                                <div key={i} className="absolute top-0 bottom-0 border-l border-[#333] pl-1 text-[9px] text-gray-500" style={{ left: i * zoomLevel }}>
                                    {i}s
                                    {[1, 2, 3].map(j => (
                                        <div key={j} className="absolute bottom-0 h-1.5 border-l border-[#222]" style={{ left: j * (zoomLevel/4) }}></div>
                                    ))}
                                </div>
                            ))}
                        </div>

                        {/* PLAYHEAD */}
                        <div className="absolute top-0 bottom-0 w-[1px] bg-red-500 z-30 pointer-events-none" style={{ left: currentTime * zoomLevel }}>
                            <div className="w-3 h-3 bg-red-500 -ml-1.5 rotate-45 border border-black"></div>
                        </div>

                        {/* TRACKS */}
                        <div className="flex flex-col">
                            {tracks.map(track => (
                                <div 
                                    key={track.id} 
                                    className={`h-24 border-b border-[#222] relative group ${track.id === selectedTrackId ? 'bg-[#141414]' : ''}`}
                                    onDragOver={e => e.preventDefault()}
                                    onDrop={e => handleDropToTrack(e, track.id)}
                                >
                                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02]"></div>
                                    {track.clips.map(clip => (
                                        <div 
                                            key={clip.id}
                                            className={`absolute top-2 bottom-2 rounded-md border select-none overflow-hidden cursor-pointer
                                                ${selectedClipId === clip.id ? 'border-brand-primary ring-1 ring-brand-primary/50 z-10' : 'border-[#333] hover:border-gray-500'}
                                                ${track.type === 'video' ? 'bg-[#1E1E2E]' : track.type === 'audio' ? 'bg-green-900/20' : 'bg-purple-900/20'}
                                            `}
                                            style={{
                                                left: clip.startTime * zoomLevel,
                                                width: clip.duration * zoomLevel,
                                                cursor: toolMode === 'razor' ? 'cell' : 'move'
                                            }}
                                            onMouseDown={(e) => handleDragStart(e, clip, track.id, 'move')}
                                        >
                                            <div className="flex h-full w-full pointer-events-none">
                                                {track.type === 'video' && Array.from({ length: Math.ceil(clip.duration / 2) }).map((_, i) => (
                                                    <div key={i} className="flex-1 border-r border-white/5 bg-white/5 opacity-30 overflow-hidden">
                                                        {clip.src && <img src={clip.src} className="w-full h-full object-cover grayscale opacity-50"/>}
                                                    </div>
                                                ))}
                                                {track.type === 'audio' && (
                                                    <div className="w-full h-full flex items-center justify-center opacity-40">
                                                        <svg className="w-full h-full text-green-500" viewBox="0 0 100 20" preserveAspectRatio="none">
                                                            <path d="M0,10 Q5,0 10,10 T20,10 T30,10 T40,10 T50,10 T60,10 T70,10 T80,10 T90,10 T100,10" fill="none" stroke="currentColor" strokeWidth="0.5" />
                                                            {Array.from({length: 50}).map((_, i) => (
                                                                <rect key={i} x={i*2} y={5 + Math.random()*10} width="1" height={Math.random()*10} fill="currentColor" />
                                                            ))}
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute top-1 left-2 text-[10px] font-medium text-white drop-shadow-md truncate max-w-full pointer-events-none">
                                                {clip.name}
                                            </div>
                                            {toolMode === 'select' && selectedClipId === clip.id && (
                                                <>
                                                    <div className="absolute left-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 z-20" onMouseDown={(e) => handleDragStart(e, clip, track.id, 'trim-start')}/>
                                                    <div className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 z-20" onMouseDown={(e) => handleDragStart(e, clip, track.id, 'trim-end')}/>
                                                </>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                   </div>
              </div>
          </div>
      </div>
    </div>
  );
};
