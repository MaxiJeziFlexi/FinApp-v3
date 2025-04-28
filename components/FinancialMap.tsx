import React from "react";
import { TbTrendingUp, TbTrendingDown, TbWallet, TbBulb } from "react-icons/tb";

interface Transaction {
  Type: string;
  Amount?: number;
}

interface FinancialMapProps {
  data?: {
    transactions?: Transaction[];
  };
  netWorthHistory?: { value: number }[];
}

const FinancialMap: React.FC<FinancialMapProps> = ({ data, netWorthHistory }) => {
  // Return a fallback if the required data is missing
  if (!data || !data.transactions) {
    return (
      <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
        <p className="text-gray-500 text-center">Loading financial data...</p>
      </div>
    );
  }

  const transactions = data.transactions;
  const totalIncome = transactions
    .filter(t => t.Type === "income")
    .reduce((sum, t) => sum + (t.Amount || 0), 0);
  const totalExpenses = transactions
    .filter(t => t.Type === "expense")
    .reduce((sum, t) => sum + (t.Amount || 0), 0);
  const liquidity = totalIncome - totalExpenses;

  const trend =
    netWorthHistory && netWorthHistory.length > 0 && netWorthHistory[netWorthHistory.length - 1].value > netWorthHistory[0].value
      ? "Bull"
      : "Bear";

  const suggestion =
    liquidity < 0
      ? "Zredukuj wydatki lub zwiększ dochody."
      : "Twoja sytuacja finansowa wygląda stabilnie.";

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg mb-8">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-3">
        <TbWallet className="text-indigo-600" /> Mapa finansowa
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Miesięczny Cashflow</h4>
          <p className={`text-2xl font-bold ${liquidity >= 0 ? "text-green-600" : "text-red-600"}`}>
            {liquidity >= 0 ? "+" : "-"}${Math.abs(liquidity).toLocaleString()}
          </p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">Trend</h4>
          <p className="text-2xl font-bold flex items-center gap-2">
            {trend === "Bull" ? (
              <TbTrendingUp className="text-green-600" />
            ) : (
              <TbTrendingDown className="text-red-600" />
            )}
            <span className={trend === "Bull" ? "text-green-600" : "text-red-600"}>{trend}</span>
          </p>
        </div>
        <div className="bg-indigo-50 dark:bg-indigo-900/30 p-5 rounded-lg">
          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-300 mb-1">AI Sugestia</h4>
          <p className="text-gray-700 dark:text-gray-100 flex items-start gap-2">
            <TbBulb className="mt-1 text-indigo-600" /> {suggestion}
          </p>
        </div>
      </div>
    </div>
  );
};

export default FinancialMap;
