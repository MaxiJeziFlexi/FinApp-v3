import Image from "next/image";
import { useContext, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/router";
import { TiHome } from "react-icons/ti";
import { BsGraphUp, BsWallet, BsPersonCircle } from "react-icons/bs";
import { HiCreditCard } from "react-icons/hi";
import { FaExchangeAlt, FaCrown, FaLock } from "react-icons/fa";
import { MdSupport, MdClose, MdKeyboardArrowDown, MdKeyboardArrowUp } from "react-icons/md";
import { SiGoogleanalytics } from "react-icons/si";
import { AiTwotoneSetting } from "react-icons/ai";
import { RiVipCrownFill } from "react-icons/ri";
import NavLink from "./nav-link";
import { DataContext } from "../utilities/DataContext";

const SideNav = () => {
  const { setNavIsOpen } = useContext(DataContext);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showInternal, setShowInternal] = useState(true);
  const [showPremium, setShowPremium] = useState(true);
  const [isPremiumUser, setIsPremiumUser] = useState(false);

  // Check if user is logged in and has premium access
  useEffect(() => {
    const loginState = localStorage.getItem("isLoggedIn");
    const premiumState = localStorage.getItem("isPremiumUser");
    setIsLoggedIn(loginState === "true");
    setIsPremiumUser(premiumState === "true");
  }, []);

  // Close the navigation menu
  const closeNav = useCallback(() => {
    setNavIsOpen(false);
  }, [setNavIsOpen]);

  // Toggle internal tools section
  const toggleInternal = () => {
    setShowInternal((prev) => !prev);
  };

  // Toggle premium section
  const togglePremium = () => {
    setShowPremium((prev) => !prev);
  };

  // Handle premium upgrade
  const handlePremiumUpgrade = () => {
    // Redirect to premium upgrade page or show modal
    router.push("/premium-upgrade");
  };

  // Hide menu if the user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  // Premium NavLink component with lock icon for non-premium users
  const PremiumNavLink = ({ location, navIcon, href, aTag, locked = false }) => {
    if (locked && !isPremiumUser) {
      return (
        <li className="relative">
          <div 
            className="flex items-center justify-between px-5 py-3 text-slate-400 cursor-not-allowed opacity-60"
            title="Premium feature - Upgrade to access"
          >
            <div className="flex items-center gap-3">
              {navIcon}
              <span className="text-sm">{aTag}</span>
            </div>
            <FaLock className="text-xs text-amber-500" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-50/20 to-transparent opacity-50"></div>
        </li>
      );
    }
    
    return <NavLink location={location} navIcon={navIcon} href={href} aTag={aTag} />;
  };

  return (
    <nav className="h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700">
      {/* Close button for mobile */}
      <div
        className="flex justify-end lg:hidden mb-2 text-3xl font-extrabold text-slate-800 dark:text-white cursor-pointer p-4"
        onClick={closeNav}
      >
        <MdClose />
      </div>

      {/* Main Menu Section */}
      <ul className="scroll-smooth">
        <p className="uppercase font-medium text-slate-600 dark:text-slate-400 text-xs px-5 py-3">
          Main menu
        </p>
        {/* FIXED: Changed from /home to /analytics */}
        <NavLink location="analytics" navIcon={<TiHome />} href="/analytics" aTag="Home" />
        <NavLink location="dashboard" navIcon={<SiGoogleanalytics />} href="/dashboard" aTag="Dashboard" />
        <NavLink location="settings" navIcon={<AiTwotoneSetting />} href="/settings" aTag="Settings" />
        <NavLink location="support-tickets" navIcon={<MdSupport />} href="/support-tickets" aTag="Support Tickets" />
        <NavLink location="profile" navIcon={<BsPersonCircle />} href="/profile" aTag="Profile" />
      </ul>

      {/* Premium Features Section */}
      <ul className="mt-5">
        <div className="flex items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <p className="uppercase font-medium text-slate-600 dark:text-slate-400 text-xs">
              Premium Features
            </p>
            <RiVipCrownFill className="text-amber-500 text-sm" />
          </div>
          <button 
            onClick={togglePremium} 
            aria-label="Toggle premium features" 
            className="text-slate-600 dark:text-slate-400 hover:text-amber-500 transition-colors"
          >
            {showPremium ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
          </button>
        </div>
        
        {showPremium && (
          <>
            <PremiumNavLink 
              location="investments" 
              navIcon={<BsGraphUp />} 
              href="/investments" 
              aTag="Investments" 
              locked={!isPremiumUser}
            />
            <PremiumNavLink 
              location="transactions" 
              navIcon={<FaExchangeAlt />} 
              href="/transactions" 
              aTag="Transactions" 
              locked={!isPremiumUser}
            />
            <PremiumNavLink 
              location="credit-loans" 
              navIcon={<HiCreditCard />} 
              href="/credit-loans" 
              aTag="Credit & Loans" 
              locked={!isPremiumUser}
            />
            <PremiumNavLink 
              location="account-balances" 
              navIcon={<BsWallet />} 
              href="/account-balances" 
              aTag="Account Balances" 
              locked={!isPremiumUser}
            />
            
            {/* Premium Upgrade Button for non-premium users */}
            {!isPremiumUser && (
              <li className="px-5 py-3">
                <button
                  onClick={handlePremiumUpgrade}
                  className="w-full bg-gradient-to-r from-amber-400 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <FaCrown className="text-sm" />
                  <span className="text-sm">Upgrade to Premium</span>
                </button>
              </li>
            )}
            
            {/* Premium Status Badge for premium users */}
            {isPremiumUser && (
              <li className="px-5 py-2">
                <div className="bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20 border border-amber-200 dark:border-amber-700 rounded-lg p-3 flex items-center justify-center gap-2">
                  <RiVipCrownFill className="text-amber-600 dark:text-amber-400" />
                  <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">
                    Premium Active
                  </span>
                </div>
              </li>
            )}
          </>
        )}
      </ul>

      {/* Internal Tools Section */}
      <ul className="mt-5">
        <div className="flex items-center justify-between px-5 py-3">
          <p className="uppercase font-medium text-slate-600 dark:text-slate-400 text-xs">
            Internal tools
          </p>
          <button 
            onClick={toggleInternal} 
            aria-label="Toggle internal tools" 
            className="text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
          >
            {showInternal ? <MdKeyboardArrowUp size={20} /> : <MdKeyboardArrowDown size={20} />}
          </button>
        </div>
        {showInternal && (
          <>
            {/* Additional internal tools can be added here if needed */}
            <li className="px-5 py-2">
              <div className="text-xs text-slate-500 dark:text-slate-400 italic">
                Advanced tools coming soon...
              </div>
            </li>
          </>
        )}
      </ul>

      {/* User Avatar Section */}
      <div className="absolute bottom-5 left-5 right-5">
        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="w-8 h-8 bg-slate-600 dark:bg-slate-400 rounded-full flex items-center justify-center text-white dark:text-slate-900 font-semibold text-sm">
            N
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
              User Name
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {isPremiumUser ? 'Premium User' : 'Free User'}
            </p>
          </div>
          {isPremiumUser && (
            <RiVipCrownFill className="text-amber-500 text-lg flex-shrink-0" />
          )}
        </div>
      </div>
    </nav>
  );
};

export default SideNav;