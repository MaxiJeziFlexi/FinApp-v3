import Image from "next/image";
import { useContext, useEffect, useState, useCallback, memo } from "react";
import { useRouter } from "next/router";
import { 
  TiHome, 
  TiCalculator 
} from "react-icons/ti";
import { 
  BsGraphUp, 
  BsWallet, 
  BsPersonCircle,
  BsShield,
  BsHouse,
  BsGear
} from "react-icons/bs";
import { 
  HiCreditCard,
  HiAcademicCap,
  HiDocumentReport
} from "react-icons/hi";
import { 
  FaExchangeAlt,
  FaChartLine,
  FaGraduationCap,
  FaHandHoldingUsd
} from "react-icons/fa";
import { 
  MdSupport, 
  MdClose, 
  MdKeyboardArrowDown, 
  MdKeyboardArrowUp,
  MdDashboard,
  MdAssessment
} from "react-icons/md";
import { 
  SiGoogleanalytics 
} from "react-icons/si";
import { 
  AiTwotoneSetting,
  AiOutlineRobot
} from "react-icons/ai";
import { 
  RiMoneyDollarCircleLine,
  RiPiggyBankLine
} from "react-icons/ri";
import NavLinkOptimized from "./nav-link-optimized";
import { DataContext } from "../utilities/DataContext";
import { usePerformanceMonitor } from "./optimized/PerformanceOptimizer";

// Navigation sections configuration
const NAVIGATION_SECTIONS = {
  main: {
    title: "Financial Journey",
    items: [
      { 
        location: "", 
        navIcon: <TiHome />, 
        href: "/analytics-optimized", 
        aTag: "Home",
        description: "Your financial dashboard"
      },
      { 
        location: "baby-steps", 
        navIcon: <FaChartLine />, 
        href: "/baby-steps", 
        aTag: "Baby Steps",
        description: "7 steps to financial freedom"
      },
      { 
        location: "budget", 
        navIcon: <TiCalculator />, 
        href: "/budget", 
        aTag: "Budget Planner",
        description: "Create and manage your budget"
      },
      { 
        location: "debt-snowball", 
        navIcon: <HiCreditCard />, 
        href: "/debt-snowball", 
        aTag: "Debt Snowball",
        description: "Pay off debt strategically"
      },
      { 
        location: "emergency-fund", 
        navIcon: <BsShield />, 
        href: "/emergency-fund", 
        aTag: "Emergency Fund",
        description: "Build your safety net"
      }
    ]
  },
  wealth: {
    title: "Wealth Building",
    items: [
      { 
        location: "investments", 
        navIcon: <BsGraphUp />, 
        href: "/investments", 
        aTag: "Investments",
        description: "Grow your wealth"
      },
      { 
        location: "retirement", 
        navIcon: <RiPiggyBankLine />, 
        href: "/retirement", 
        aTag: "Retirement Planning",
        description: "Plan for your future"
      },
      { 
        location: "real-estate", 
        navIcon: <BsHouse />, 
        href: "/real-estate", 
        aTag: "Real Estate",
        description: "Home buying & investing"
      },
      { 
        location: "insurance", 
        navIcon: <BsShield />, 
        href: "/insurance", 
        aTag: "Insurance",
        description: "Protect your assets"
      }
    ]
  },
  tools: {
    title: "Financial Tools",
    items: [
      { 
        location: "ai-advisor", 
        navIcon: <AiOutlineRobot />, 
        href: "/ai-advisor", 
        aTag: "AI Financial Advisor",
        description: "Get personalized advice"
      },
      { 
        location: "calculators", 
        navIcon: <TiCalculator />, 
        href: "/calculators", 
        aTag: "Calculators",
        description: "Financial calculators"
      },
      { 
        location: "reports", 
        navIcon: <HiDocumentReport />, 
        href: "/reports", 
        aTag: "Reports",
        description: "Generate financial reports"
      },
      { 
        location: "transactions", 
        navIcon: <FaExchangeAlt />, 
        href: "/transactions", 
        aTag: "Transactions",
        description: "Track your spending"
      }
    ]
  },
  education: {
    title: "Financial Education",
    items: [
      { 
        location: "courses", 
        navIcon: <HiAcademicCap />, 
        href: "/courses", 
        aTag: "Financial Courses",
        description: "Learn financial principles"
      },
      { 
        location: "articles", 
        navIcon: <MdAssessment />, 
        href: "/articles", 
        aTag: "Articles & Guides",
        description: "Educational content"
      },
      { 
        location: "success-stories", 
        navIcon: <FaHandHoldingUsd />, 
        href: "/success-stories", 
        aTag: "Success Stories",
        description: "Real transformation stories"
      }
    ]
  },
  account: {
    title: "Account Management",
    items: [
      { 
        location: "dashboard", 
        navIcon: <MdDashboard />, 
        href: "/dashboard", 
        aTag: "Admin Dashboard",
        description: "System overview"
      },
      { 
        location: "profile", 
        navIcon: <BsPersonCircle />, 
        href: "/profile", 
        aTag: "Profile",
        description: "Manage your account"
      },
      { 
        location: "settings", 
        navIcon: <BsGear />, 
        href: "/settings", 
        aTag: "Settings",
        description: "App preferences"
      },
      { 
        location: "support", 
        navIcon: <MdSupport />, 
        href: "/support-tickets", 
        aTag: "Support",
        description: "Get help"
      }
    ]
  }
};

// Collapsible section component
const CollapsibleSection = memo(({ section, sectionKey, expandedSections, toggleSection, currentPath }) => {
  const isExpanded = expandedSections[sectionKey];
  
  return (
    <div className="mb-4">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="flex items-center justify-between w-full px-5 py-3 text-left hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors duration-200"
        aria-expanded={isExpanded}
      >
        <span className="uppercase font-medium text-slate-600 dark:text-slate-400 text-xs">
          {section.title}
        </span>
        {isExpanded ? (
          <MdKeyboardArrowUp size={16} className="text-slate-600 dark:text-slate-400" />
        ) : (
          <MdKeyboardArrowDown size={16} className="text-slate-600 dark:text-slate-400" />
        )}
      </button>
      
      {isExpanded && (
        <ul className="mt-2 space-y-1">
          {section.items.map((item) => (
            <li key={item.location}>
              <NavLinkOptimized
                location={item.location}
                navIcon={item.navIcon}
                href={item.href}
                aTag={item.aTag}
                description={item.description}
                isActive={currentPath === item.href}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

CollapsibleSection.displayName = 'CollapsibleSection';

// Progress indicator component
const ProgressIndicator = memo(({ userProfile }) => {
  const progress = userProfile?.progress || 0;
  const currentStep = userProfile?.currentBabyStep || 1;
  
  return (
    <div className="px-5 py-4 mb-4 bg-gradient-to-r from-blue-50 to-green-50 dark:from-gray-800 dark:to-gray-700 rounded-lg mx-3">
      <div className="text-center">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
          Your Progress
        </h4>
        <div className="relative pt-1">
          <div className="flex mb-2 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-blue-600 bg-blue-200">
                Step {currentStep}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-blue-600">
                {progress}%
              </span>
            </div>
          </div>
          <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-blue-200">
            <div
              style={{ width: `${progress}%` }}
              className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-500"
            />
          </div>
        </div>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Keep going! You're on your way to financial freedom.
        </p>
      </div>
    </div>
  );
});

ProgressIndicator.displayName = 'ProgressIndicator';

// Main SideNav component
const SideNavOptimized = () => {
  usePerformanceMonitor('SideNavOptimized');
  
  const { setNavIsOpen } = useContext(DataContext);
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    main: true,
    wealth: false,
    tools: false,
    education: false,
    account: false
  });

  // Check if user is logged in and fetch profile
  useEffect(() => {
    const loginState = localStorage.getItem("isLoggedIn");
    setIsLoggedIn(loginState === "true");
    
    if (loginState === "true") {
      // Fetch user profile for progress tracking
      const fetchProfile = async () => {
        try {
          const res = await fetch('/api/user-profile/1');
          const data = await res.json();
          setUserProfile(data);
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      };
      fetchProfile();
    }
  }, []);

  // Close the navigation menu
  const closeNav = useCallback(() => {
    setNavIsOpen(false);
  }, [setNavIsOpen]);

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionKey]: !prev[sectionKey]
    }));
  }, []);

  // Hide menu if the user is not logged in
  if (!isLoggedIn) {
    return null;
  }

  return (
    <nav className="h-full bg-white dark:bg-gray-900 shadow-lg">
      {/* Close button for mobile */}
      <div
        className="flex justify-end lg:hidden mb-2 text-3xl font-extrabold text-slate-800 dark:text-white cursor-pointer p-4"
        onClick={closeNav}
      >
        <MdClose />
      </div>

      {/* Logo Section */}
      <div className="px-5 mb-6 text-center">
        <div className="flex items-center justify-center mb-2">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-green-500 rounded-full flex items-center justify-center">
            <RiMoneyDollarCircleLine className="text-white text-2xl" />
          </div>
        </div>
        <h2 className="text-lg font-bold text-gray-800 dark:text-white">
          Financial Freedom
        </h2>
        <p className="text-xs text-gray-600 dark:text-gray-400">
          Your Path to Wealth
        </p>
      </div>

      {/* Progress Indicator */}
      {userProfile && <ProgressIndicator userProfile={userProfile} />}

      {/* Navigation Sections */}
      <div className="flex-1 overflow-y-auto px-2">
        {Object.entries(NAVIGATION_SECTIONS).map(([sectionKey, section]) => (
          <CollapsibleSection
            key={sectionKey}
            section={section}
            sectionKey={sectionKey}
            expandedSections={expandedSections}
            toggleSection={toggleSection}
            currentPath={router.pathname}
          />
        ))}
      </div>

      {/* Quick Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="space-y-2">
          <button className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium hover:from-blue-700 hover:to-blue-800 transition-colors duration-200">
            Start Assessment
          </button>
          <button className="w-full bg-green-500 text-white py-2 px-4 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors duration-200">
            Chat with AI Advisor
          </button>
        </div>
      </div>

      {/* Footer */}
      <div className="p-4 text-center border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2025 Financial Freedom Platform
        </p>
      </div>
    </nav>
  );
};

export default memo(SideNavOptimized);