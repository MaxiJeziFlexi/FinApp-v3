import React from 'react';
import { TbBulb } from "react-icons/tb";

const EnhancedOverview = () => {
  return (
    <div className="bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-xl transition-all duration-300 ease-in-out">
      <h2 className="text-2xl font-extrabold mb-6 flex items-center text-gray-900 dark:text-gray-100">
        <TbBulb className="inline-block text-indigo-500 mr-3" />
        Financial Overview
      </h2>
      <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
        Welcome to your financial dashboard. Here, you can track your net worth, monitor expenses, and manage investments with ease. Our tools provide insights to help you make informed financial decisions and achieve your goals.
      </p>
    </div>
  );
};

export default EnhancedOverview;