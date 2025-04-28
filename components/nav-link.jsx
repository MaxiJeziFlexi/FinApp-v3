import Link from 'next/link';
import { useRouter } from 'next/router';
import { useContext } from 'react';
import { DataContext } from '../utilities/DataContext';
import { useTranslation } from 'react-i18next';

const NavLink = ({ location, navIcon, href, aTag }) => {
  const router = useRouter();
  const { t } = useTranslation();
  const { pathname } = router;
  const splitLocation = pathname.split('/');
  const { setNavIsOpen } = useContext(DataContext);

  return (
    <li
      className={`flex items-center px-5 py-3 my-1 rounded-full ${
        splitLocation[1] === location ? 'bg-blue-600 dark:bg-blue-800' : ''
      }`}
      onClick={() => setNavIsOpen(false)}
    >
      <span
        className={`flex items-center text-2xl ${
          splitLocation[1] === location
            ? 'text-white'
            : 'text-slate-600 dark:text-slate-400'
        }`}
      >
        {navIcon}
      </span>
      <Link href={href} legacyBehavior>
        <a
          className={`ml-3 text-sm ${
            splitLocation[1] === location
              ? 'text-white'
              : 'transition-all delay-200 text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:font-bold'
          }`}
        >
          {t(aTag)}
        </a>
      </Link>
    </li>
  );
};

export default NavLink;
