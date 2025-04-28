import React, { useState, useEffect, useMemo } from "react";
import TopNav from "../components/top-nav";
import { TbPigMoney, TbWallet, TbCurrencyDollar, TbCreditCard } from "react-icons/tb";
import { useTranslation } from "react-i18next";

const AccountBalances = () => {
  const { t } = useTranslation();
  const [accounts, setAccounts] = useState([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const transactionsPerPage = 10;

  // Fetch account balances on mount
  useEffect(() => {
    const fetchAccounts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await fetch("http://localhost:4001/account-balances");
        
        if (!response.ok) {
          let errorMessage;
          if (response.status === 400) {
            errorMessage = t("badRequestError");
          } else if (response.status === 401) {
            errorMessage = t("unauthorizedError");
          } else if (response.status === 404) {
            errorMessage = t("notFoundError");
          } else if (response.status >= 500) {
            errorMessage = t("serverError");
          } else {
            errorMessage = `${t("failedToFetchAccountBalances")} (HTTP ${response.status}: ${response.statusText})`;
          }
          throw new Error(errorMessage);
        }
        
        const data = await response.json();
        setAccounts(data);
      } catch (err) {
        console.error("Error fetching account balances:", err);
        
        // Check if it's a network error
        if (err.name === 'TypeError' && err.message === 'Failed to fetch') {
          setError(t("networkError"));
        } else {
          setError(`${t("error")}: ${err.message}`);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAccounts();
  }, [t]);

  // Memoized function to calculate totals by category
  const calculateTotals = useMemo(() => {
    return (type) =>
      accounts
        .filter((acc) => type === "All" || acc.Type === type)
        .reduce((sum, acc) => sum + (acc.Balance || 0), 0);
  }, [accounts]);

  const getAccountIcon = (type, size = "text-2xl") => {
    const icons = {
      Savings: <TbPigMoney className={size} />,
      Checking: <TbCreditCard className={size} />,
      Currency: <TbCurrencyDollar className={size} />,
    };
    return type === "All" ? <TbWallet className={size} /> : icons[type] || <TbWallet className={size} />;
  };

  // Get the status style for an account (Active, Inactive, etc.)
  const getStatusStyle = (status) => {
    const styles = {
      Active: "bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300",
      Inactive: "bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300",
      default: "bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300",
    };
    return styles[status] || styles.default;
  };

  // Modern styling object inspired by Revolut/PayPal with dark mode support
  const modernStyle = {
    mainBg: "bg-gray-100 dark:bg-gray-900 min-h-screen",
    container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
    cardBg: "bg-white dark:bg-gray-700 rounded-xl shadow-lg",
    primaryText: "text-gray-900 dark:text-gray-100",
    secondaryText: "text-gray-500 dark:text-gray-300",
    accentBlue: "bg-blue-600 text-white",
    tabInactive: "bg-gray-200 text-gray-700 dark:bg-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500",
    iconWrapper: "p-2 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200",
    activeBorder: "ring-2 ring-blue-600"
  };

  // Category Total Card acts as a clickable filter without textual labels
  const CategoryTotalCard = ({ category }) => (
    <div
      onClick={() => setActiveCategory(category)}
      className={`
        ${modernStyle.cardBg} p-4 flex items-center justify-center min-w-[100px] transition transform 
        hover:scale-105 cursor-pointer ${activeCategory === category ? modernStyle.activeBorder : ""}
      `}
    >
      <div className="flex flex-col items-center">
        <div className={modernStyle.iconWrapper}>{getAccountIcon(category)}</div>
        <p className="font-bold text-lg mt-2">${calculateTotals(category).toLocaleString()}</p>
      </div>
    </div>
  );

  // Card component for displaying individual account details
  const AccountCard = ({ account }) => (
    <div className={`${modernStyle.cardBg} p-4 mb-4 transition transform hover:scale-105`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={modernStyle.iconWrapper}>{getAccountIcon(account.Type)}</div>
          <div>
            <h3 className="font-semibold">{account.Type}</h3>
            <p className={`text-sm ${modernStyle.secondaryText}`}>{account.AccountName}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-lg">${account.Balance?.toLocaleString()}</p>
          <span className={`text-xs px-2 py-1 rounded-full ${getStatusStyle(account.Status)}`}>
            {account.Status}
          </span>
        </div>
      </div>
    </div>
  );

  // Filter accounts based on active category selection
  const filteredAccounts = useMemo(() => {
    if (activeCategory === "All") return accounts;
    return accounts.filter((acc) => acc.Type === activeCategory);
  }, [activeCategory, accounts]);

  // Reset pagination to page 1 when active category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  // Calculate total pages
  const totalPages = Math.ceil(filteredAccounts.length / transactionsPerPage);

  // Ensure currentPage is not greater than totalPages (e.g. when filtering leads to fewer pages)
  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Pagination logic: slice the filtered array for current page
  const paginatedAccounts = useMemo(() => {
    const startIndex = (currentPage - 1) * transactionsPerPage;
    return filteredAccounts.slice(startIndex, startIndex + transactionsPerPage);
  }, [filteredAccounts, currentPage]);

  return (
    <div className={modernStyle.mainBg}>
      <TopNav />
      <div className={`${modernStyle.container} py-8`}>
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-lg mb-4 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {t("An error occurred while fetching account balances. Please try again later.")}
            <button onClick={() => setError(null)} className="ml-auto text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100">
              ✕
            </button>
          </div>
        )}
        {loading ? (
          <div className="text-center text-gray-600 dark:text-gray-300 py-6 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p>{t("Loading account balances, please wait...")}</p>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap gap-6 mb-8 justify-center">
              {["All", "Savings", "Checking", "Currency"].map((category) => (
                <CategoryTotalCard key={category} category={category} />
              ))}
            </div>
            <div className="space-y-4">
              {paginatedAccounts.length > 0 ? (
                paginatedAccounts.map((account, idx) => <AccountCard key={idx} account={account} />)
              ) : (
                <p className={`${modernStyle.secondaryText} text-center`}>{t("No accounts available for the selected category.")}</p>
              )}
            </div>
            {totalPages > 1 && (
              <div className="flex justify-center items-center mt-8 space-x-4">
                <button
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  disabled={currentPage === 1}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white disabled:opacity-50"
                >
                  {t("Previous Page")}
                </button>
                <span className="font-medium">
                  {t("Page {current} of {total}", { current: currentPage, total: totalPages })}
                </span>
                <button
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 rounded-full bg-blue-600 text-white disabled:opacity-50"
                >
                  {t("Next Page")}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AccountBalances;
