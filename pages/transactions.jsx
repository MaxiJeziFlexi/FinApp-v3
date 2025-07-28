import { useEffect, useState } from "react";
import { jsPDF } from "jspdf"; // For PDF generation
import OCRUploader from "../components/ocr-uploader";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    Category: "",
    Type: "",
    Amount: "",
    Date: "",
    Description: "",
  });

  useEffect(() => {
    fetch("http://localhost:4001/transactions")
      .then((response) => {
        if (!response.ok) throw new Error("Failed to fetch transactions data.");
        return response.json();
      })
      .then((data) => {
        setTransactions(data);

        // Calculate summary
        const income = data
          .filter((tx) => tx.Type === "Income")
          .reduce((acc, tx) => acc + parseFloat(tx.Amount || 0), 0);
        const expenses = data
          .filter((tx) => tx.Type === "Expense")
          .reduce((acc, tx) => acc + parseFloat(tx.Amount || 0), 0);

        setSummary({ income, expenses });
      })
      .catch((error) =>
        console.error("Error fetching transactions:", error.message)
      );
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const addNewTransaction = async () => {
    const transactionWithId = {
      TransactionID: transactions.length + 1,
      ...newTransaction,
      Amount: parseFloat(newTransaction.Amount),
    };

    try {
      const response = await fetch("http://localhost:4001/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transactionWithId),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        alert("Failed to add transaction: " + errorData.error);
        return;
      }

      setTransactions((prev) => [...prev, transactionWithId]);
      setSummary((prev) => ({
        ...prev,
        income:
          transactionWithId.Type === "Income"
            ? prev.income + transactionWithId.Amount
            : prev.income,
        expenses:
          transactionWithId.Type === "Expense"
            ? prev.expenses + transactionWithId.Amount
            : prev.expenses,
      }));

      setNewTransaction({
        Category: "",
        Type: "",
        Amount: "",
        Date: "",
        Description: "",
      });
      setIsFormVisible(false);
    } catch (error) {
      console.error("Error adding transaction:", error.message);
      alert("Failed to add transaction: " + error.message);
    }
  };

  const generateInvoice = (transaction) => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Invoice", 20, 20);

    doc.setFontSize(12);
    doc.text(`Transaction ID: ${transaction.TransactionID}`, 20, 40);
    doc.text(`Date: ${transaction.Date}`, 20, 50);
    doc.text(`Category: ${transaction.Category}`, 20, 60);
    doc.text(`Type: ${transaction.Type}`, 20, 70);
    doc.text(`Amount: $${transaction.Amount.toLocaleString()}`, 20, 80);

    doc.text("Thank you for your transaction!", 20, 100);

    doc.save(`Invoice_${transaction.TransactionID}.pdf`);
  };

  const handleExtractedData = (data) => {
    const lines = data.split("\n");
    setNewTransaction({
      Category: lines[0] || "",
      Type: lines[1] || "",
      Amount: lines[2] || "",
      Date: lines[3] || "",
      Description: lines[4] || "",
    });
    setIsFormVisible(true);
  };

  return (
    <div className="h-full p-6">
      <h1 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">
        Transactions
      </h1>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-white dark:bg-night-blue rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Total Income
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            ${summary.income.toLocaleString()}
          </p>
        </div>
        <div className="p-4 bg-white dark:bg-night-blue rounded-lg shadow-md">
          <h3 className="text-lg font-bold text-slate-800 dark:text-white">
            Total Expenses
          </h3>
          <p className="text-2xl font-semibold text-red-600">
            ${summary.expenses.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Add Transaction Form */}
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 mb-4"
      >
        {isFormVisible ? "Hide Form" : "Add Transaction"}
      </button>
      {isFormVisible && (
        <div className="mb-6 p-4 bg-white dark:bg-night-blue rounded-lg shadow-md">
          <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4">
            Add New Transaction
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(newTransaction).map((key) => (
              <div key={key}>
                <label className="block text-sm font-bold text-slate-800 dark:text-white">
                  {key}
                </label>
                <input
                  name={key}
                  value={newTransaction[key]}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-800 dark:text-white"
                />
              </div>
            ))}
          </div>
          <button
            onClick={addNewTransaction}
            className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Add Transaction
          </button>
        </div>
      )}

      {/* OCR Upload */}
      <div className="mb-6 p-4 bg-white dark:bg-night-blue rounded-lg shadow-md">
        <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-4"></h2>
        <OCRUploader onExtractedData={handleExtractedData} />       
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-night-blue shadow-md rounded-lg overflow-hidden">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {transactions.map((tx, index) => (
            <li
              key={index}
              className="p-4 hover:bg-gray-50 dark:hover:bg-pre-midnight-blue flex justify-between items-center"
            >
              <div>
                <h3 className="text-sm font-semibold text-slate-800 dark:text-white">
                  {tx.Category}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {tx.Date}
                </p>
              </div>
              <div className="flex items-center space-x-4">
                <div>
                  <p
                    className={`text-sm rounded-full px-3 py-1 ${
                      tx.Type === "Income"
                        ? "text-green-600 bg-green-100"
                        : "text-red-600 bg-red-100"
                    }`}
                  >
                    {tx.Type}
                  </p>
                  <p className="text-sm font-bold text-slate-800 dark:text-white">
                    ${tx.Amount.toLocaleString()}
                  </p>
                </div>
                <button
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg"
                  onClick={() => generateInvoice(tx)}
                >
                  Generate Invoice
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default Transactions;