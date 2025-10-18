import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import { 
  Thermometer, 
  Fan, 
  Zap, 
  Battery, 
  X,
  TrendingUp,
  Gauge
} from 'lucide-react';

// Animation variants
const pageTransition = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] }
};

const cardStagger = {
  animate: { transition: { staggerChildren: 0.1 } }
};

const cardItem = {
  initial: { opacity: 0, y: 20, scale: 0.95 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] }
};

const slideIn = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 200 }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: 'easeInOut' as const
  }
};

// Animated Number Component
const AnimatedNumber: React.FC<{ value: number; decimals?: number }> = ({ value, decimals = 0 }) => {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => 
    decimals > 0 ? current.toFixed(decimals) : Math.round(current).toLocaleString()
  );

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
};

// Toggle Switch Component
const Toggle: React.FC<{ enabled: boolean; onChange: (v: boolean) => void }> = ({ enabled, onChange }) => (
  <motion.div
    className={`toggle-switch ${enabled ? 'active' : ''}`}
    onClick={() => onChange(!enabled)}
    whileTap={{ scale: 0.95 }}
  >
    <motion.div className="toggle-thumb" layout transition={{ type: 'spring', stiffness: 500, damping: 30 }} />
  </motion.div>
);

// Fluid Bar Component with dynamic color based on percentage
const FluidBar: React.FC<{ label: string; value: number; max: number; unit: string }> = 
  ({ label, value, max, unit }) => {
  const percentage = Math.min((value / max) * 100, 100);
  
  // More granular color transitions
  const getColorClass = () => {
    if (percentage < 20) return 'very-cool';
    if (percentage < 40) return 'cool';
    if (percentage < 60) return 'warm';
    if (percentage < 75) return 'hot';
    return 'very-hot';
  };
  
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        <span className="font-semibold">
          <AnimatedNumber value={value} />
          {unit}
        </span>
      </div>
      <div className="fluid-bar-container">
        <motion.div 
          className={`fluid-bar ${getColorClass()}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

// System Metrics Panel (Combined Temps & Fans)
const SystemMetricsPanel: React.FC<{ temps: number[]; fans: number[]; onClose: () => void }> = 
  ({ temps, fans, onClose }) => (
  <motion.div
    className="fixed inset-0 z-50 flex"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
    
    <motion.div
      className="ml-auto w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl h-full glass relative z-10 overflow-y-auto"
      variants={slideIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient-orange">System Metrics</h2>
          <motion.button
            className="p-2 rounded-xl hover:bg-white/10"
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} />
          </motion.button>
        </div>

        {/* Temperature Sensors */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
            <Thermometer size={18} className="sm:w-5 sm:h-5" />
            <span className="text-gradient-orange">Temperature Sensors</span>
          </h3>
          <div className="space-y-3">
            {temps.map((temp, i) => (
              <motion.div
                key={i}
                className="px-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <FluidBar label={`Sensor ${i + 1}`} value={temp} max={100} unit="°C" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Fan Speeds */}
        <div className="space-y-3">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold flex items-center gap-2">
            <Fan size={18} className="sm:w-5 sm:h-5" />
            <span className="text-gradient-green">Fan Speeds</span>
          </h3>
          <div className="space-y-3">
            {fans.map((fan, i) => (
              <motion.div
                key={i}
                className="px-2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: (temps.length + i) * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <FluidBar label={`Fan ${i + 1}`} value={fan} max={6370} unit=" RPM" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  </motion.div>
);

// Fan Curve Slide Panel
const FanCurvePanel: React.FC<{ onClose: () => void }> = ({ onClose }) => (
  <motion.div
    className="fixed inset-0 z-50 flex"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
  >
    <motion.div
      className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
    
    <motion.div
      className="ml-auto w-full max-w-sm sm:max-w-md lg:max-w-lg xl:max-w-xl h-full glass relative z-10 overflow-y-auto"
      variants={slideIn}
      initial="initial"
      animate="animate"
      exit="exit"
    >
      <div className="p-4 sm:p-6 lg:p-8 space-y-4 sm:space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gradient-green">Fan Curves</h2>
          <motion.button
            className="p-2 rounded-xl hover:bg-white/10"
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
          >
            <X size={24} />
          </motion.button>
        </div>

        <div className="space-y-4">
          {['Silent', 'Normal', 'Gaming'].map((mode, i) => (
            <motion.div
              key={mode}
              className="card p-4 sm:p-5 lg:p-6"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <h3 className="text-sm sm:text-base lg:text-lg font-semibold mb-3 flex items-center gap-2">
                <Fan size={16} className="sm:w-[18px] sm:h-[18px]" />
                <span className="text-gradient-green">{mode} Mode</span>
              </h3>
              <div className="space-y-2 text-xs sm:text-sm" style={{ color: 'var(--text-secondary)' }}>
                <div className="flex justify-between">
                  <span>30°C</span>
                  <span>{mode === 'Silent' ? '30%' : mode === 'Normal' ? '40%' : '50%'}</span>
                </div>
                <div className="flex justify-between">
                  <span>50°C</span>
                  <span>{mode === 'Silent' ? '50%' : mode === 'Normal' ? '60%' : '75%'}</span>
                </div>
                <div className="flex justify-between">
                  <span>70°C</span>
                  <span>{mode === 'Silent' ? '70%' : mode === 'Normal' ? '85%' : '100%'}</span>
                </div>
                <div className="flex justify-between">
                  <span>90°C</span>
                  <span>100%</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p className="text-xs sm:text-sm text-center" style={{ color: 'var(--text-tertiary)' }}>
          Idk if these are accurate yet LOL
        </p>
      </div>
    </motion.div>
  </motion.div>
);

// Notification Toast
const NotificationToast: React.FC<{ type: 'success' | 'error'; message: string; onClose: () => void }> = 
  ({ type, message, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      className="notification fixed top-4 right-4 sm:top-6 lg:top-8 sm:right-6 lg:right-8 z-50 p-3 sm:p-4 flex items-center gap-2 sm:gap-3 min-w-[250px] sm:min-w-[280px] lg:min-w-[300px] max-w-[calc(100vw-2rem)]"
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      transition={{ type: 'spring', damping: 20 }}
    >
      <div className={`p-0.5 px-1.5 rounded-lg ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
        <span className="text-xl font-bold">{type === 'success' ? '✓' : '✕'}</span>
      </div>
      <p className="flex-1 font-medium text-xs sm:text-sm lg:text-base">{message}</p>
      <motion.button
        onClick={onClose}
        className="p-1 hover:bg-white/10 rounded-lg"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <X size={14} className="sm:w-4 sm:h-4" />
      </motion.button>
    </motion.div>
  );
};

// Main App
const App: React.FC = () => {
  const [showSystemMetrics, setShowSystemMetrics] = useState(false);
  const [showFanCurve, setShowFanCurve] = useState(false);
  const [temps, setTemps] = useState([0, 0, 0]);
  const [fans, setFans] = useState([0, 0]);
  
  // Separate UI state from loaded settings
  const [fanProfile, setFanProfile] = useState('Normal');
  const [customSpeed, setCustomSpeed] = useState(50);
  const [chargeMode, setChargeMode] = useState(false);
  const [chargeLimit, setChargeLimit] = useState(100);
  const [gpuBoost, setGpuBoost] = useState(false);
  
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // Track if we should update UI from loaded data
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [t, f, , settings] = await Promise.all([
          window.electron.readTemps(),
          window.electron.readFans(),
          window.electron.readSystemState(),
          window.electron.loadSettings(),
        ]);
        setTemps(t);
        setFans(f.slice(0, 2));
        
        // Only update UI settings on initial load
        if (isInitialLoad.current) {
          setFanProfile(settings.fan_profile);
          setCustomSpeed(settings.custom_speed);
          setChargeMode(settings.charge_mode);
          setChargeLimit(settings.charge_limit);
          setGpuBoost(settings.gpu_boost);
          isInitialLoad.current = false;
        }
      } catch (err) {
        console.error('Failed to load data:', err);
      }
    };

    loadData();
    const interval = setInterval(loadData, 2000);
    return () => clearInterval(interval);
  }, []);

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
  };

  const handleSave = async () => {
    try {
      const settings = { 
        fan_profile: fanProfile, 
        custom_speed: customSpeed, 
        charge_mode: chargeMode, 
        charge_limit: chargeLimit, 
        gpu_boost: gpuBoost 
      };
      const [applyRes, saveRes] = await Promise.all([
        window.electron.applySettings(settings),
        window.electron.saveSettings(settings),
      ]);

      if (applyRes.success && saveRes.success) {
        showNotification('success', 'Settings saved successfully');
      } else {
        showNotification('error', applyRes.error || saveRes.error || 'Failed to save settings');
      }
    } catch (err: any) {
      showNotification('error', err.message || 'Unknown error');
    }
  };

  const avgTemp = temps.length ? (temps.reduce((a, b) => a + b, 0) / temps.length) : 0;
  const avgFan = fans.length ? Math.round(fans.reduce((a, b) => a + b, 0) / fans.length) : 0;
  const fanProfiles = ['Normal', 'Silent', 'Gaming', 'Auto', 'Fixed'];

  const tempPercentage = Math.min((avgTemp / 100) * 100, 100);
  const fanPercentage = Math.min((avgFan / 6370) * 100, 100);

  const showCustomSpeed = fanProfile === 'Auto' || fanProfile === 'Fixed';

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <motion.div
        className="glass border-b border-white/10 px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-4 lg:py-6"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-gradient-orange">Aorus Control</h1>
        <p className="text-xs sm:text-sm lg:text-base" style={{ color: 'var(--text-secondary)' }}>Manage your laptop's performance</p>
      </motion.div>

      {/* Content */}
      <motion.div
        variants={pageTransition}
        initial="initial"
        animate="animate"
        className="p-4 sm:p-6 lg:p-8 xl:p-10 space-y-4 sm:space-y-5 lg:space-y-6 overflow-y-auto flex-1 max-w-[1600px] mx-auto w-full"
      >
        {/* Temperature & Fan Overview with Fluid Backgrounds */}
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6"
          variants={cardStagger}
          initial="initial"
          animate="animate"
        >
          {/* Average Temperature */}
          <motion.div 
            className="fluid-stat-card"
            variants={cardItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="fluid-stat-background temp"
              initial={{ height: 0 }}
              animate={{ height: `${tempPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <div className="fluid-stat-content">
              <div className="flex items-center gap-3 lg:gap-4 mb-3">
                <motion.div 
                  className="p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br from-orange-500 to-red-500"
                >
                  <Thermometer size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" color="white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>Average Temp</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                    <AnimatedNumber value={avgTemp} decimals={1} />°C
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg lg:rounded-xl bg-white/10 backdrop-blur text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                  onClick={() => setShowSystemMetrics(true)}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Gauge size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  <span className="inline">Metrics</span>
                </motion.button>
                <motion.button
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg lg:rounded-xl bg-white/10 backdrop-blur text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                  onClick={() => setShowFanCurve(true)}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  <span className="inline">Curves</span>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* Average Fan Speed */}
          <motion.div 
            className="fluid-stat-card"
            variants={cardItem}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <motion.div 
              className="fluid-stat-background fan"
              initial={{ height: 0 }}
              animate={{ height: `${fanPercentage}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
            <div className="fluid-stat-content">
              <div className="flex items-center gap-3 lg:gap-4 mb-3">
                <motion.div 
                  className="p-2 sm:p-2.5 lg:p-3 rounded-xl lg:rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500"
                >
                  <Fan size={18} className="sm:w-5 sm:h-5 lg:w-6 lg:h-6" color="white" />
                </motion.div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>Average Fan Speed</p>
                  <p className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold">
                    <AnimatedNumber value={avgFan} /> RPM
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <motion.button
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg lg:rounded-xl bg-white/10 backdrop-blur text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                  onClick={() => setShowSystemMetrics(true)}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Gauge size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  <span className="inline">Metrics</span>
                </motion.button>
                <motion.button
                  className="flex-1 px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg lg:rounded-xl bg-white/10 backdrop-blur text-xs sm:text-sm font-medium flex items-center justify-center gap-1"
                  onClick={() => setShowFanCurve(true)}
                  whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.15)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <TrendingUp size={12} className="sm:w-3.5 sm:h-3.5 lg:w-4 lg:h-4" />
                  <span className="inline">Curves</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Fan Profile with Animated Background */}
        <motion.div 
          className="card p-4 sm:p-5 lg:p-6 space-y-4" 
          variants={cardItem}
        >
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <motion.div animate={pulseAnimation}>
              <Fan size={16} className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5 text-gradient-green" />
            </motion.div>
            Fan Profile
          </h3>
          <div className="segment">
            {fanProfiles.map((profile) => (
              <button
                key={profile}
                className={`segment-btn-animated text-xs sm:text-sm ${fanProfile === profile ? '' : 'hover:text-white/60'}`}
                onClick={() => setFanProfile(profile)}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {fanProfile === profile && (
                  <motion.span
                    layoutId="activeProfile"
                    className="absolute inset-0 bg-gradient-to-br from-green-500/20 to-emerald-500/20 backdrop-blur-sm"
                    style={{ borderRadius: 10 }}
                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-10">{profile}</span>
              </button>
            ))}
          </div>

          {/* Custom Speed Slider - Inline with same animation as Battery */}
          <AnimatePresence mode="wait">
            {showCustomSpeed && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: 'auto',
                  opacity: 1,
                  transition: { 
                    height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.2, delay: 0.1 }
                  }
                }}
                exit={{ 
                  height: 0,
                  opacity: 0,
                  transition: { 
                    height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.2 }
                  }
                }}
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  className="space-y-2 pt-2"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="text-xs sm:text-sm font-medium">
                    Custom Fan Speed: <AnimatedNumber value={customSpeed} />%
                  </label>
                  <input
                    type="range"
                    min="25"
                    max="100"
                    step="5"
                    value={customSpeed}
                    onChange={(e) => setCustomSpeed(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Battery Settings */}
        <motion.div 
          className="card p-4 sm:p-5 lg:p-6 space-y-4" 
          variants={cardItem}
        >
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <motion.div animate={pulseAnimation}>
              <Battery size={16} className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5 text-gradient-orange" />
            </motion.div>
            Battery
          </h3>
          
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">Battery Care Mode</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>Limit charge to extend lifespan</p>
            </div>
            <Toggle enabled={chargeMode} onChange={setChargeMode} />
          </div>

          <AnimatePresence mode="wait">
            {chargeMode && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ 
                  height: 'auto',
                  opacity: 1,
                  transition: { 
                    height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.2, delay: 0.1 }
                  }
                }}
                exit={{ 
                  height: 0,
                  opacity: 0,
                  transition: { 
                    height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.2 }
                  }
                }}
                style={{ overflow: 'hidden' }}
              >
                <motion.div
                  className="space-y-2 pt-2"
                  initial={{ scale: 0.95 }}
                  animate={{ scale: 1 }}
                  exit={{ scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <label className="text-xs sm:text-sm font-medium">
                    Charge Limit: <AnimatedNumber value={chargeLimit} />%
                  </label>
                  <input
                    type="range"
                    min="60"
                    max="100"
                    step="5"
                    value={chargeLimit}
                    onChange={(e) => setChargeLimit(Number(e.target.value))}
                    className="w-full mt-2"
                  />
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* GPU Boost */}
        <motion.div 
          className="card p-4 sm:p-5 lg:p-6" 
          variants={cardItem}
        >
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
            <motion.div 
              animate={{
                rotate: [0, 10, -10, 0],
                transition: {
                  duration: 2,
                  repeat: Infinity,
                  ease: 'easeInOut' as const
                }
              }}
            >
              <Zap size={16} className="sm:w-[18px] sm:h-[18px] lg:w-5 lg:h-5 text-gradient-green" />
            </motion.div>
            Performance
          </h3>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm sm:text-base">GPU Boost</p>
              <p className="text-xs sm:text-sm truncate" style={{ color: 'var(--text-secondary)' }}>Overclock GPU for better gaming</p>
            </div>
            <Toggle enabled={gpuBoost} onChange={setGpuBoost} />
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.button
          className="w-full btn-primary text-sm sm:text-base lg:text-lg"
          onClick={handleSave}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Save Settings
        </motion.button>
      </motion.div>

      {/* Panels */}
      <AnimatePresence>
        {showSystemMetrics && <SystemMetricsPanel temps={temps} fans={fans} onClose={() => setShowSystemMetrics(false)} />}
        {showFanCurve && <FanCurvePanel onClose={() => setShowFanCurve(false)} />}
      </AnimatePresence>

      {/* Notification */}
      <AnimatePresence>
        {notification && (
          <NotificationToast
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;