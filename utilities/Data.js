export const fetchFinancialData = async () => {
  try {
    // Fetch data from relevant endpoints
    const [accountBalancesRes, loansRes, investmentsRes, transactionsRes] = await Promise.all([
      fetch("http://localhost:4001/account-balances"),
      fetch("http://localhost:4001/credit-loans"),
      fetch("http://localhost:4001/investments"),
      fetch("http://localhost:4001/transactions"),
    ]);

    const [accountBalances, loans, investments, transactions] = await Promise.all([
      accountBalancesRes.json(),
      loansRes.json(),
      investmentsRes.json(),
      transactionsRes.json(),
    ]);

    // Calculate totals
    const totalSavings = accountBalances
      .filter((account) => account.Type === "Savings")
      .reduce((acc, curr) => acc + parseFloat(curr.Balance || 0), 0);

    const totalChecking = accountBalances
      .filter((account) => account.Type === "Checking")
      .reduce((acc, curr) => acc + parseFloat(curr.Balance || 0), 0);

    const totalCurrency = accountBalances
      .filter((account) => account.Type === "Currency")
      .reduce((acc, curr) => acc + parseFloat(curr.Balance || 0), 0);

    const totalLoans = loans.reduce((acc, curr) => acc + parseFloat(curr.Amount || 0), 0);
    const totalInvestments = investments.reduce((acc, curr) => acc + parseFloat(curr.AmountInvested || 0), 0);
    const totalTransactions = transactions.reduce((acc, curr) => acc + parseFloat(curr.Amount || 0), 0);

    return {
      totalSavings,
      totalChecking,
      totalCurrency,
      totalLoans,
      totalInvestments,
      totalTransactions,
    };
  } catch (error) {
    console.error("Error fetching financial data:", error);
    return {
      totalSavings: 0,
      totalChecking: 0,
      totalCurrency: 0,
      totalLoans: 0,
      totalInvestments: 0,
      totalTransactions: 0,
    };
  }
};
