import React from 'react';

interface AccountProfileHeaderProps {
  user: {
    displayName?: string | null;
    email?: string | null;
    photoURL?: string | null;
  } | null;
  customPhoto?: string | null;
  accentFrom?: string;
}

export function AccountProfileHeader({ user, customPhoto, accentFrom = '#3b82f6' }: AccountProfileHeaderProps) {
  const photo = customPhoto || user?.photoURL;
  const name = user?.displayName || 'Studio User';
  const email = user?.email || 'No email attached';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0' }}>
      {photo ? (
        <img
          src={photo}
          alt=""
          style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }}
          referrerPolicy="no-referrer"
        />
      ) : (
        <div
          style={{
            width: 52,
            height: 52,
            borderRadius: '50%',
            backgroundColor: accentFrom,
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
            fontWeight: 700,
          }}
        >
          {name.charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column' }}>
        <span style={{ fontSize: 16, fontWeight: 700, color: 'var(--c-text-primary)' }}>{name}</span>
        <span style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>{email}</span>
      </div>
    </div>
  );
}
