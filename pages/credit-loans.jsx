import React, { useEffect, useState } from "react";
import TopNav from "../components/top-nav";
import Tesseract from "tesseract.js";

const CreditAndLoans = () => {
  // Updated modernStyle with dark mode support, matching AccountBalances
  const modernStyle = {
    mainBg: "bg-gray-100 dark:bg-gray-900 min-h-screen",
    cardBg: "bg-white dark:bg-gray-700 rounded-xl shadow-lg",
    primaryText: "text-gray-900 dark:text-gray-100",
    secondaryText: "text-gray-500 dark:text-gray-300",
    accentBlue: "bg-blue-600 text-white",
    accentBlueHover: "hover:bg-blue-700",
    button: "px-6 py-2 rounded-lg font-medium transition",
    input: "w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100",
    label: "block text-sm font-bold text-gray-900 dark:text-gray-100 mb-1",
    tableHead: "bg-gray-200 dark:bg-gray-600",
    tableRow: "border-t hover:bg-gray-100 dark:hover:bg-gray-800",
  };

  // State declarations
  const [loans, setLoans] = useState([]);
  const [totalLoans, setTotalLoans] = useState(0);
  const [newLoan, setNewLoan] = useState({
    AccountHolder: "",
    LoanType: "",
    Amount: "",
    Currency: "USD",
    InterestRate: "",
    DurationMonths: "",
    MonthlyPayment: "",
    Status: "Active",
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch loans data on component mount
  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await fetch("http://localhost:4001/credit-loans");
        if (!response.ok) throw new Error("Failed to fetch credit-loans data.");
        const data = await response.json();
        setLoans(data);
        const total = data.reduce(
          (acc, loan) => acc + parseFloat(loan.Amount || 0),
          0
        );
        setTotalLoans(total);
      } catch (error) {
        console.error("Error fetching credit-loans:", error.message);
      }
    };

    fetchLoans();
  }, []);

  // Handle input changes and calculate monthly payment when needed
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewLoan((prev) => {
      const updatedLoan = { ...prev, [name]: value };

      if (["Amount", "InterestRate", "DurationMonths"].includes(name)) {
        const principal = parseFloat(updatedLoan.Amount || 0);
        const rate = parseFloat(updatedLoan.InterestRate || 0) / 100 / 12;
        const duration = parseInt(updatedLoan.DurationMonths || 0, 10);

        if (principal > 0 && rate > 0 && duration > 0) {
          updatedLoan.MonthlyPayment = (
            (principal * rate) /
            (1 - Math.pow(1 + rate, -duration))
          ).toFixed(2);
        } else {
          updatedLoan.MonthlyPayment = "";
        }
      }
      return updatedLoan;
    });
  };

  // Submit a new loan via POST request
  const addNewLoan = async () => {
    try {
      const loanWithId = {
        LoanID: loans.length + 1,
        ...newLoan,
        Amount: parseFloat(newLoan.Amount),
        DurationMonths: parseInt(newLoan.DurationMonths, 10),
        MonthlyPayment: parseFloat(newLoan.MonthlyPayment),
      };

      const response = await fetch("http://localhost:4001/credit-loans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanWithId),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("Failed to add loan: " + errorData.error);
        return;
      }

      setLoans((prev) => [...prev, loanWithId]);
      setTotalLoans((prev) => prev + loanWithId.Amount);
      setNewLoan({
        AccountHolder: "",
        LoanType: "",
        Amount: "",
        Currency: "USD",
        InterestRate: "",
        DurationMonths: "",
        MonthlyPayment: "",
        Status: "Active",
      });
      setIsFormVisible(false);
      alert("Loan added successfully!");
    } catch (error) {
      alert("Failed to add loan: " + error.message);
    }
  };

  // Handle OCR image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      processImage(file);
    }
  };

  // Process image with Tesseract.js to extract text for pre-filling the form
  const processImage = (file) => {
    setIsProcessing(true);
    Tesseract.recognize(file, "eng", {
      logger: (info) => console.log(info),
    })
      .then(({ data: { text } }) => {
        const lines = text.split("\n");
        setNewLoan({
          AccountHolder: lines[0] || "",
          LoanType: lines[1] || "",
          Amount: lines[2] || "",
          InterestRate: lines[3] || "",
          DurationMonths: lines[4] || "",
          MonthlyPayment: "",
          Status: "Active",
          Currency: "USD",
        });
        setIsFormVisible(true);
      })
      .catch((error) =>
        console.error("Error processing image:", error.message)
      )
      .finally(() => setIsProcessing(false));
  };

  return (
    <div className={`${modernStyle.mainBg} p-6`}>
      <TopNav />

      <h1 className={`text-2xl font-bold ${modernStyle.primaryText} mb-6`}>
        Credit and Loans
      </h1>

      {/* Overview Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className={`${modernStyle.cardBg} p-4`}>
          <h3 className={`text-lg font-bold ${modernStyle.primaryText}`}>
            Total Loans
          </h3>
          <p className="text-2xl font-semibold text-green-600">
            ${totalLoans.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Toggle Add Loan Form */}
      <button
        onClick={() => setIsFormVisible(!isFormVisible)}
        className={`${modernStyle.button} ${modernStyle.accentBlue} ${modernStyle.accentBlueHover} mb-4`}
      >
        {isFormVisible ? "Close Add Loan Form" : "Add Loan"}
      </button>

      {/* Add Loan Form */}
      {isFormVisible && (
        <div className={`${modernStyle.cardBg} p-6 mb-6`}>
          <h2 className={`text-lg font-bold ${modernStyle.primaryText} mb-4`}>
            Add New Loan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.keys(newLoan).map((key) =>
              key !== "MonthlyPayment" ? (
                <div key={key}>
                  <label className={modernStyle.label}>{key}</label>
                  {key === "Currency" ? (
                    <select
                      name={key}
                      value={newLoan[key]}
                      onChange={handleInputChange}
                      className={modernStyle.input}
                    >
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="PLN">PLN</option>
                    </select>
                  ) : (
                    <input
                      name={key}
                      type={
                        ["Amount", "InterestRate", "DurationMonths"].includes(key)
                          ? "number"
                          : "text"
                      }
                      value={newLoan[key]}
                      onChange={handleInputChange}
                      className={modernStyle.input}
                    />
                  )}
                </div>
              ) : (
                <div key={key}>
                  <label className={modernStyle.label}>Monthly Payment</label>
                  <input
                    name={key}
                    value={newLoan[key]}
                    readOnly
                    className={`${modernStyle.input} bg-gray-200 dark:bg-gray-600`}
                  />
                </div>
              )
            )}
          </div>
          <button
            onClick={addNewLoan}
            className={`${modernStyle.button} ${modernStyle.accentBlue} ${modernStyle.accentBlueHover} mt-4`}
          >
            Submit Loan
          </button>
        </div>
      )}

      {/* Image Upload Section */}
      <div className={`${modernStyle.cardBg} p-6 mb-6`}>
        <h2 className={`text-lg font-bold ${modernStyle.primaryText} mb-4`}>
          Upload Document Image
        </h2>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
        />
        {uploadedImage && (
          <div className="mt-4">
            <h3 className="text-sm font-bold mb-2">Image Preview</h3>
            <img
              src={uploadedImage}
              alt="Uploaded Preview"
              className="w-64 rounded-lg shadow-md"
            />
          </div>
        )}
        {isProcessing && (
          <p className="text-blue-600 mt-4">Processing image...</p>
        )}
      </div>

      {/* Loans Table */}
      <div className={`${modernStyle.cardBg} overflow-hidden shadow-md`}>
        <table className="w-full table-auto text-left">
          <thead>
            <tr className={modernStyle.tableHead}>
              {["LoanID", ...Object.keys(newLoan)].map((key) => (
                <th key={key} className="px-4 py-2 text-sm font-bold text-gray-900 dark:text-gray-100">
                  {key}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.LoanID} className={modernStyle.tableRow}>
                {["LoanID", ...Object.keys(newLoan)].map((key) => (
                  <td key={key} className="px-4 py-2 text-sm text-gray-900 dark:text-gray-100">
                    {loan[key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CreditAndLoans;
