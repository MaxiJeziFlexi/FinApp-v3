import { useContext } from "react";
import { DataContext } from "../utilities/DataContext";
import dynamic from 'next/dynamic';
import SideNav from "./side-nav";
import AccountModal from "./account-modal";

const DarkModeToggler = dynamic(() => import('./dark-mode-toggler'), { ssr: false });

const Layout = ({ children }) => {
  const context = useContext(DataContext);
  if (!context) {
    console.error("DataContext is not provided. Ensure that DataContext.Provider wraps the Layout component.");
    return null; // Return null if DataContext is not available
  }

  const { navIsOpen } = context;

  return (
    <>
      <div
        className={`min-h-screen flex bg-slate-200 dark:bg-midnight-blue ${
          navIsOpen ? "relative" : ""
        }`}
      >
        {/* Sidebar */}
        <div
          className={`${
            navIsOpen
              ? "absolute z-10 w-80 h-full shadow-xl shadow-slate-600 left-0 duration-500 ease-in-out"
              : "z-10 absolute -left-full lg:left-0 lg:relative duration-300 ease-in-out"
          } transition delay-75 lg:block lg:w-1/5 container mx-auto p-6 bg-white dark:bg-night-blue`}
        >
          <SideNav />
        </div>

        {/* Main Content - REMOVED THE DUPLICATE HEADER */}
        <div className="w-full lg:w-4/5">
          <main className="h-full">
            {/* All header/navigation is now handled by individual page components or a separate TopNav component */}
            {children}
          </main>
        </div>
      </div>

      <DarkModeToggler />
      <AccountModal />
    </>
  );
};

export default Layout;