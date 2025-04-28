import TopNav from '../components/top-nav';

const Payments = () => {
  const transactions = [
    {
      id: 'TXN-001',
      date: '2024-12-01',
      customer: 'Johnson Transport Co.',
      amount: '$1,200.00',
      status: 'Paid',
    },
    {
      id: 'TXN-002',
      date: '2024-12-03',
      customer: 'Lagos Freight Ltd.',
      amount: '$2,450.00',
      status: 'Pending',
    },
    {
      id: 'TXN-003',
      date: '2024-12-05',
      customer: 'Abuja Logistics',
      amount: '$800.00',
      status: 'Failed',
    },
    {
      id: 'TXN-004',
      date: '2024-12-10',
      customer: 'Port Harcourt Express',
      amount: '$3,200.00',
      status: 'Paid',
    },
    {
      id: 'TXN-005',
      date: '2024-12-15',
      customer: 'Global Transport Solutions',
      amount: '$1,500.00',
      status: 'Pending',
    },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Paid':
        return 'text-green-600 bg-green-100';
      case 'Pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'Failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full p-6">
      <TopNav />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Payments</h1>

      <div className="bg-white dark:bg-night-blue shadow-md rounded-lg overflow-hidden">
        <table className="table-auto w-full text-left">
          <thead>
            <tr className="bg-slate-200 dark:bg-evening-blue">
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Transaction ID</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Date</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Customer</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Amount</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Status</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((transaction) => (
              <tr key={transaction.id} className="border-t hover:bg-slate-100 dark:hover:bg-pre-midnight-blue">
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{transaction.id}</td>
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{transaction.date}</td>
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{transaction.customer}</td>
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{transaction.amount}</td>
                <td className={`px-4 py-2 text-sm rounded-full ${getStatusStyle(transaction.status)}`}>
                  {transaction.status}
                </td>
                <td className="px-4 py-2 text-sm text-blue-500 hover:underline cursor-pointer">
                  View Details
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Payments;
