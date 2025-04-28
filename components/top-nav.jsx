import React from 'react';
import { useRouter } from 'next/router';

const TopNav = ({ title, showBackButton }) => {
  const router = useRouter();

  return (
    <div className="top-">
      {showBackButton && (
        <button onClick={() => router.back()} className="text-blue-500">
          Back
        </button>
      )}
      <h1 className="font-bold text-lg">{title}</h1>
    </div>
  );
};

export default TopNav;
