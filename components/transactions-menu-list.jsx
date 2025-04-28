import React from 'react';

const TransactionsMenuList = ({ index, title, activeTab, setActiveTab }) => {
  const handleIndex = () => {
    setActiveTab(index);
  };

  return (
    <li
      onClick={handleIndex}
      className={`font-medium px-2 py-1 mx-1 ${
        activeTab === index
          ? 'bg-green-500 text-white' // Highlight for the active tab
          : 'text-slate-600 dark:text-white cursor-pointer' // Default styles
      }`}
    >
      {title}
    </li>
  );
};

export default TransactionsMenuList;
