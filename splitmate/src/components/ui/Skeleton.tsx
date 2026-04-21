interface SkProps {
  width?: string;
  height?: number;
  rounded?: number;
  className?: string;
}

export function Sk({ width = '100%', height = 16, rounded = 6, className = '' }: SkProps) {
  return (
    <div
      className={className}
      style={{
        width,
        height,
        borderRadius: rounded,
        background: 'linear-gradient(90deg, #E2E8F0 25%, #F1F5F9 50%, #E2E8F0 75%)',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s infinite',
      }}
    />
  );
}

export function SkeletonTable() {
  return (
    <div className="flex flex-col gap-3">
      {Array(5).fill(0).map((_, i) => (
        <div key={i} className="flex gap-4 items-center px-4 py-3.5 bg-white rounded-lg border border-slate-200">
          <Sk width="80px" height={14} />
          <Sk width="30%" height={14} />
          <Sk width="60px" height={22} rounded={99} />
          <Sk width="90px" height={14} />
          <Sk width="100px" height={14} />
          <Sk width="70px" height={28} rounded={8} />
        </div>
      ))}
    </div>
  );
}
