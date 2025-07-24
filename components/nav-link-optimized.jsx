import Link from "next/link";
import { useRouter } from "next/router";
import { memo, useState } from "react";
import { usePerformanceMonitor } from "./optimized/PerformanceOptimizer";

const NavLinkOptimized = memo(({ 
  location, 
  navIcon, 
  href, 
  aTag, 
  description,
  isActive,
  badge,
  isNew = false,
  onClick
}) => {
  usePerformanceMonitor('NavLinkOptimized');
  
  const router = useRouter();
  const [isHovered, setIsHovered] = useState(false);
  
  // Determine if this link is active
  const active = isActive || router.pathname === href || router.pathname.includes(location);

  const handleClick = (e) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <li className="relative">
      <Link href={href} legacyBehavior>
        <a
          onClick={handleClick}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`
            group flex items-center px-4 py-3 mx-2 rounded-lg transition-all duration-200 ease-in-out
            ${active 
              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg transform scale-105' 
              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-blue-600 dark:hover:text-blue-400'
            }
            ${isHovered ? 'shadow-md' : ''}
          `}
          aria-current={active ? 'page' : undefined}
        >
          {/* Icon */}
          <span className={`
            flex-shrink-0 text-lg mr-3 transition-transform duration-200
            ${active ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}
            ${isHovered ? 'transform scale-110' : ''}
          `}>
            {navIcon}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className={`
                font-medium text-sm truncate
                ${active ? 'text-white' : 'text-gray-900 dark:text-gray-100'}
              `}>
                {aTag}
              </span>
              
              {/* Badges */}
              <div className="flex items-center space-x-1 ml-2">
                {isNew && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    New
                  </span>
                )}
                {badge && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    {badge}
                  </span>
                )}
              </div>
            </div>
            
            {/* Description */}
            {description && (
              <p className={`
                text-xs mt-1 truncate transition-opacity duration-200
                ${active 
                  ? 'text-blue-100' 
                  : 'text-gray-500 dark:text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                }
                ${isHovered ? 'opacity-100' : 'opacity-75'}
              `}>
                {description}
              </p>
            )}
          </div>

          {/* Active indicator */}
          {active && (
            <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-1 h-8 bg-white rounded-r-full shadow-lg" />
          )}

          {/* Hover effect */}
          {isHovered && !active && (
            <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-transparent dark:from-blue-900/20 rounded-lg pointer-events-none" />
          )}
        </a>
      </Link>

      {/* Tooltip for truncated text */}
      {isHovered && (description || aTag.length > 20) && (
        <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 shadow-lg max-w-xs">
            <div className="font-medium">{aTag}</div>
            {description && (
              <div className="text-gray-300 mt-1">{description}</div>
            )}
            {/* Arrow */}
            <div className="absolute right-full top-1/2 transform -translate-y-1/2">
              <div className="border-4 border-transparent border-r-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </li>
  );
});

NavLinkOptimized.displayName = 'NavLinkOptimized';

export default NavLinkOptimized;