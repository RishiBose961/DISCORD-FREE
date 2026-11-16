import React from 'react';

interface AvatarProps {
  username?: string;
  color?: string;
  size?: number;
  status?: 'online' | 'idle' | 'dnd' | 'offline';
  fontSize?: number;
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  username = 'User',
  color = '#5865F2',
  size = 36,
  status,
  fontSize,
  className = ''
}) => {
  const initial = username.charAt(0).toUpperCase();
  const calculatedFontSize = fontSize || Math.floor(size * 0.45);

  return (
    <div
      className={`avatar-wrapper ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          backgroundColor: color,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#ffffff',
          fontWeight: 700,
          fontSize: calculatedFontSize,
          userSelect: 'none'
        }}
      >
        {initial}
      </div>
      {status && <div className={`avatar-badge ${status}`} />}
    </div>
  );
};
