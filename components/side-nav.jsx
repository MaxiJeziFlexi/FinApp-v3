import Image from "next/image"; // Import Image for logo
import { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { TiHome } from "react-icons/ti";
import { BsGraphUp, BsWallet, BsPersonCircle } from "react-icons/bs";
import { HiCreditCard } from "react-icons/hi";
import { FaExchangeAlt } from "react-icons/fa";
import { MdSupport, MdClose, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { SiGoogleanalytics } from "react-icons/si";
import { AiTwotoneSetting } from "react-icons/ai";
import NavLink from "./nav-link";
import { DataContext } from "../utilities/DataContext";

const SideNav = () => {
  const { setNavIsOpen } = useContext(DataContext);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInternal, setShowInternal] = useState(true);

  // Check if user is logged in
  useEffect(() => {
    const loginState = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loginState === "true");
  }, []);

  // Close the navigation menu
  const closeNav = useCallback(() => {
    setNavIsOpen(false);
  }, [setNavIsOpen]);

  // Toggle internal tools section
  const toggleInternal = () => {
    setShowInternal((prev) => !prev);
  };

  // Hide menu if the user is not logged in
  if (!isLoggedIn) {
    return null; // Do not render the menu
  }

  return (
    <nav className="h-full">
      <div
        className="flex justify-end lg:hidden mb-2 text-3xl font-extrabold text-slate-800 dark:text-white cursor-pointer"
        onClick={closeNav}
      >
        <MdClose />
      </div>
      {/* Logo Section */}
      <div className="px-5 mb-5">
        <Image
          src="/images/logos/default_logo" // Path to your logo
          alt="Youngster Logo"
          width={150} // Adjust width
          height={50} // Adjust height
          className="object-contain"
        />
      </div>
      <ul className="scroll-smooth">
        <p className="uppercase font-medium text-slate-600 dark:text-slate-400 text-xs px-5 py-3">
          Main menu
        </p>
        {/* Zamiana ścieżki home z analytics */}
        <NavLink location="" navIcon={<TiHome />} href="/analytics" aTag="Home" />
        <NavLink location="account-balances" navIcon={<BsWallet />} href="/account-balances" aTag="Account Balances" />
        <NavLink location="credit-loans" navIcon={<HiCreditCard />} href="/credit-loans" aTag="Credit & Loans" />
        <NavLink location="investments" navIcon={<BsGraphUp />} href="/investments" aTag="Investments" />
        <NavLink location="transactions" navIcon={<FaExchangeAlt />} href="/transactions" aTag="Transactions" />
      </ul>

      {/* Internal Tools Section with Dropdown */}
      <ul className="mt-5">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="uppercase font-medium text-slate-600 dark:text-slate-400 text-xs">
            Internal tools
          </p>
          <button 
            onClick={toggleInternal} 
            aria-label="Toggle internal tools" 
            className="text-slate-600 dark:text-slate-400"
          >
            {showInternal ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
          </button>
        </div>
        {showInternal && (
          <>
            {/* Zamiana ścieżki analytics z dashboard */}
            <NavLink location="dashboard" navIcon={<SiGoogleanalytics />} href="/dashboard" aTag="Dashboard" />
            <NavLink location="support-tickets" navIcon={<MdSupport />} href="/support-tickets" aTag="Support Tickets" />
            <NavLink location="settings" navIcon={<AiTwotoneSetting />} href="/settings" aTag="Settings" />
            <NavLink location="profile" navIcon={<BsPersonCircle />} href="/profile" aTag="Profile" />
          </>
        )}
      </ul>
    </nav>
  );
};

export default SideNav;