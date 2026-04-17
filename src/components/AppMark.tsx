import { FiCalendar, FiClock, FiDollarSign, FiEdit3 } from 'react-icons/fi';

interface AppMarkProps {
  compact?: boolean;
}

const AppMark = ({ compact = false }: AppMarkProps) => {
  return (
    <div className={`relative ${compact ? 'h-14 w-14' : 'h-20 w-20'}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(145deg,#0f766e_0%,#1d4ed8_60%,#f59e0b_100%)] shadow-[0_24px_50px_rgba(29,78,216,0.28)]" />
      <div className="absolute inset-[2px] rounded-[26px] border border-white/35 bg-slate-950/12 backdrop-blur-sm" />
      <div className="absolute left-3 top-3 text-white/95">
        <FiClock size={compact ? 18 : 22} />
      </div>
      <div className="absolute right-3 top-3 text-white/90">
        <FiCalendar size={compact ? 17 : 21} />
      </div>
      <div className="absolute bottom-3 left-3 text-white/90">
        <FiEdit3 size={compact ? 17 : 21} />
      </div>
      <div className="absolute bottom-3 right-3 text-white/95">
        <FiDollarSign size={compact ? 18 : 22} />
      </div>
      <div className="absolute inset-[26%] rounded-2xl border border-white/30 bg-white/14 backdrop-blur-sm" />
    </div>
  );
};

export default AppMark;
