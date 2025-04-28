import React from "react";
import { useTranslation } from "react-i18next";

const AccountMenuList = ({ title, index, activeTab, setActiveTab }) => {
  const { t } = useTranslation();

  const toggleMenu = () => {
    setActiveTab(index);
  };

  return (
    <li
      onClick={toggleMenu}
      className={`uppercase text-xs px-3 py-5 mx-2 ${
        activeTab === index
          ? "border-b-4 border-b-blue-500 text-blue-500"
          : "text-slate-500 dark:text-white cursor-pointer"
      }`}
    >
      {t(title)}
    </li>
  );
};

export default AccountMenuList;
