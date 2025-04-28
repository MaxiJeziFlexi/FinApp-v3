import { useState, useContext } from 'react';
import LineChart from './line-chart';
import { DataContext } from '../utilities/DataContext';
import TransactionsMenuList from './transactions-menu-list';

const TransactionsContainer = () => {
  const { daily, monthly, yearly, transactionsMenu } = useContext(DataContext);
  const [dailyTransactions, setDailyTransactions] = daily;
  const [monthlyTransactions, setMonthlyTransactions] = monthly;
  const [yearlyTransactions, setYearlyTransactions] = yearly;
  const [activeTransactionsMenu, setActiveTransactionsMenu] = transactionsMenu;

  const [dailyData, setDailyData] = useState({
    labels: dailyTransactions.map((data) => data.time),
    datasets: [
      {
        label: 'Income',
        data: dailyTransactions.map((data) => data.income),
        borderColor: '#14b8a6',
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: dailyTransactions.map((data) => data.expenses),
        borderColor: '#f43f5e',
        borderWidth: 2,
      },
    ],
  });

  const [monthlyData, setMonthlyData] = useState({
    labels: monthlyTransactions.map((data) => data.date),
    datasets: [
      {
        label: 'Income',
        data: monthlyTransactions.map((data) => data.income),
        borderColor: '#14b8a6',
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: monthlyTransactions.map((data) => data.expenses),
        borderColor: '#f43f5e',
        borderWidth: 2,
      },
    ],
  });

  const [yearlyData, setYearlyData] = useState({
    labels: yearlyTransactions.map((data) => data.month),
    datasets: [
      {
        label: 'Income',
        data: yearlyTransactions.map((data) => data.income),
        borderColor: '#14b8a6',
        borderWidth: 2,
      },
      {
        label: 'Expenses',
        data: yearlyTransactions.map((data) => data.expenses),
        borderColor: '#f43f5e',
        borderWidth: 2,
      },
    ],
  });

  return (
    <section>
      <div className="flex justify-between flex-wrap items-center mt-12">
        <div>
          <h2 className="font-bold text-slate-800 dark:text-white"> Transactions </h2>
          <p className="my-1 text-slate-600 dark:text-white text-sm">
            Here's an overview of your recent financial activity:
          </p>
        </div>
        <div className="mt-3 bg-white dark:bg-night-blue px-6 py-2 rounded-full">
          <ul className="text-xs flex justify-between">
            <TransactionsMenuList
              index="1"
              title="1D"
              activeTab={activeTransactionsMenu}
              setActiveTab={setActiveTransactionsMenu}
            />
            <TransactionsMenuList
              index="2"
              title="5D"
              activeTab={activeTransactionsMenu}
              setActiveTab={setActiveTransactionsMenu}
            />
            <TransactionsMenuList
              index="3"
              title="1M"
              activeTab={activeTransactionsMenu}
              setActiveTab={setActiveTransactionsMenu}
            />
            <TransactionsMenuList
              index="4"
              title="1Y"
              activeTab={activeTransactionsMenu}
              setActiveTab={setActiveTransactionsMenu}
            />
            <TransactionsMenuList
              index="5"
              title="Max"
              activeTab={activeTransactionsMenu}
              setActiveTab={setActiveTransactionsMenu}
            />
          </ul>
        </div>
      </div>

      <div className="my-4 bg-white dark:bg-night-blue p-5">
        <div className="flex justify-between flex-wrap">
          <div className="mt-2 w-full lg:w-2/6 flex">
            <div className="mr-20">
              <p className="uppercase font-medium text-xs text-slate-600 dark:text-slate-400">
                Income
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">$25,000</p>
            </div>
            <div>
              <p className="uppercase font-medium text-xs text-slate-600 dark:text-slate-400">
                Expenses
              </p>
              <p className="text-2xl font-bold text-slate-800 dark:text-white">$18,500</p>
            </div>
          </div>

          <div className="mt-2 w-full lg:w-2/6 flex">
            <div className="flex items-center mr-14">
              <div className="w-5 h-1.5 mr-3 bg-teal-500"></div>
              <p className="font-medium text-xs text-slate-600 dark:text-white"> Income </p>
            </div>
            <div className="flex items-center mr-5">
              <div className="w-5 h-1.5 mr-3 bg-red-500"></div>
              <p className="font-medium text-xs text-slate-600 dark:text-white"> Expenses </p>
            </div>
          </div>
        </div>

        <div className="mt-5">
          {activeTransactionsMenu === '1' ? (
            <LineChart chartData={dailyData} />
          ) : activeTransactionsMenu === '2' ? (
            <LineChart chartData={dailyData} />
          ) : activeTransactionsMenu === '4' ? (
            <LineChart chartData={yearlyData} />
          ) : (
            <LineChart chartData={monthlyData} />
          )}
        </div>
      </div>
    </section>
  );
};

export default TransactionsContainer;
