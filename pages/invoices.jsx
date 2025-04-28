import TopNav from '../components/top-nav';

const Invoices = () => {
  const invoices = [
    {
      id: 'INV-001',
      date: '2024-12-01',
      amount: '$1,200.00',
      status: 'Paid',
    },
    {
      id: 'INV-002',
      date: '2024-12-03',
      amount: '$2,450.00',
      status: 'Pending',
    },
    {
      id: 'INV-003',
      date: '2024-12-05',
      amount: '$800.00',
      status: 'Overdue',
    },
    {
      id: 'INV-004',
      date: '2024-12-10',
      amount: '$3,200.00',
      status: 'Paid',
    },
    {
      id: 'INV-005',
      date: '2024-12-15',
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
      case 'Overdue':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="h-full p-6">
      <TopNav />
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Invoices</h1>

      <div className="bg-white dark:bg-night-blue shadow-md rounded-lg overflow-hidden">
        <table className="table-auto w-full text-left">
          <thead>
            <tr className="bg-slate-200 dark:bg-evening-blue">
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Invoice ID</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Date</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Amount</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Status</th>
              <th className="px-4 py-2 text-sm font-bold text-slate-800 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody>
            {invoices.map((invoice) => (
              <tr key={invoice.id} className="border-t hover:bg-slate-100 dark:hover:bg-pre-midnight-blue">
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{invoice.id}</td>
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{invoice.date}</td>
                <td className="px-4 py-2 text-sm text-slate-800 dark:text-white">{invoice.amount}</td>
                <td className={`px-4 py-2 text-sm rounded-full ${getStatusStyle(invoice.status)}`}>
                  {invoice.status}
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

export default Invoices;
