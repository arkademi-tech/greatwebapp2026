import { MEMBERS } from '../../data';
import { memberColors } from '../../utils';

interface AvatarProps {
  name: string;
  size?: number;
}

export function Avatar({ name, size = 28 }: AvatarProps) {
  const idx = MEMBERS.indexOf(name);
  const color = memberColors[idx >= 0 ? idx % memberColors.length : 0];
  return (
    <div
      className="rounded-full flex items-center justify-center font-bold text-white shrink-0"
      style={{ width: size, height: size, background: color, fontSize: size * 0.42 }}
    >
      {(name || '?')[0]}
    </div>
  );
}
