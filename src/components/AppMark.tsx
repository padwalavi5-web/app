import { FiClock } from 'react-icons/fi';

interface AppMarkProps {
  compact?: boolean;
}

const AppMark = ({ compact = false }: AppMarkProps) => {
  const size = compact ? 'h-14 w-14' : 'h-20 w-20';
  const iconSize = compact ? 24 : 32;

  return (
    <div className={`relative inline-flex items-center justify-center rounded-[28px] ${size}`} aria-hidden="true">
      <div className="absolute inset-0 rounded-[28px] bg-[linear-gradient(145deg,#4c8a6f_0%,#6a86c4_100%)] shadow-[0_20px_38px_rgba(76,138,111,0.2)]" />
      <div className="absolute inset-[2px] rounded-[26px] border border-white/35 bg-white/14" />
      <div className="relative z-10 text-white">
        <FiClock size={iconSize} />
      </div>
    </div>
  );
};

export default AppMark;
