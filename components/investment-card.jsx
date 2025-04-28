import React from "react";
import { useTranslation } from "react-i18next";

const ExampleComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
};

const InvestmentCard = ({ type, data, marketData }) => {
  const { t } = useTranslation();

  // Oblicz zysk/stratę
  const calculateProfit = (investment) => {
    const currentPrice = marketData?.[investment.Ticker]?.price || investment.ExitPrice;
    return (currentPrice - investment.EntryPrice) * investment.Amount;
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-bold mb-2">{t(type)}</h3>
      <ul className="space-y-2">
        {data.map((inv, index) => (
          <li key={index} className="flex justify-between items-center">
            <span>{inv.Ticker}</span>
            <span className={`${calculateProfit(inv) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${calculateProfit(inv).toFixed(2)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default InvestmentCard;
