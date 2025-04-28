import React, { useEffect, useState } from "react";
import TopNav from "../components/top-nav";

const SupportTickets = () => {
  const [userRole, setUserRole] = useState(null);
  const [authorized, setAuthorized] = useState(false);

  // Example tickets data
  const tickets = [
    {
      id: 1,
      subject: "Delay in shipment delivery",
      status: "Open",
      priority: "High",
      assignedTo: "John Doe",
      lastUpdated: "2024-12-20",
    },
    {
      id: 2,
      subject: "Billing issue with invoice #12345",
      status: "In Progress",
      priority: "Medium",
      assignedTo: "Jane Smith",
      lastUpdated: "2024-12-19",
    },
    {
      id: 3,
      subject: "Request for additional transport",
      status: "Resolved",
      priority: "Low",
      assignedTo: "Mark Lee",
      lastUpdated: "2024-12-18",
    },
  ];

  const getStatusStyle = (status) => {
    switch (status) {
      case "Open":
        return "text-red-600 bg-red-50";
      case "In Progress":
        return "text-yellow-600 bg-yellow-50";
      case "Resolved":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case "High":
        return "text-red-600";
      case "Medium":
        return "text-yellow-600";
      case "Low":
        return "text-green-600";
      default:
        return "text-gray-600";
    }
  };

  // Example: simulate fetching user role from an API or context
  const getUserRole = async () => {
    // Replace with real logic
    return "admin"; // for demonstration
  };

  useEffect(() => {
    (async () => {
      const role = await getUserRole();
      setUserRole(role);
      if (role === "admin" || role === "moderator") {
        setAuthorized(true);
      }
    })();
  }, []);

  // While fetching role
  if (userRole === null) {
    return (
      <div className="h-full p-6">
        <TopNav />
        <p className="mt-4 text-gray-700">Checking permissions...</p>
      </div>
    );
  }

  // If not authorized
  if (!authorized) {
    return (
      <div className="h-full p-6">
        <TopNav />
        <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
        <p className="mt-4 text-gray-700">
          You do not have permission to view this page. Only admin or moderator
          roles can access it.
        </p>
      </div>
    );
  }

  // Authorized view
  return (
    <div className="h-full p-6 bg-gray-100 dark:bg-gray-900">
      <TopNav />
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-4">
          Support Tickets
        </h1>
        <p className="text-gray-600 dark:text-gray-300">
          View and manage all support requests in one place.
        </p>
      </div>

      {/* Table container */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
        <table className="min-w-full table-auto">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                ID
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Subject
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Assigned To
              </th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wider">
                Last Updated
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {tickets.map((ticket) => (
              <tr
                key={ticket.id}
                className="hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                  {ticket.id}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                  {ticket.subject}
                </td>
                <td className="px-4 py-3 text-sm">
                  <span
                    className={`inline-block py-1 px-2 rounded-full text-xs font-semibold ${getStatusStyle(
                      ticket.status
                    )}`}
                  >
                    {ticket.status}
                  </span>
                </td>
                <td
                  className={`px-4 py-3 text-sm font-semibold ${getPriorityStyle(
                    ticket.priority
                  )}`}
                >
                  {ticket.priority}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                  {ticket.assignedTo}
                </td>
                <td className="px-4 py-3 text-sm text-gray-800 dark:text-gray-200">
                  {ticket.lastUpdated}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SupportTickets;
