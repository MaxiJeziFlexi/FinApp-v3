import { useEffect, useState, useMemo } from "react";
import TopNav from "../components/top-nav";
import Tesseract from "tesseract.js";
import { useTranslation } from "react-i18next";
import { RingLoader } from "react-spinners";
import { Toaster, toast } from "react-hot-toast";

// Define modern UI styles as used in account-balances
const modernStyle = {
  mainBg: "bg-gray-100 dark:bg-gray-900 min-h-screen",
  container: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
  cardBg: "bg-white dark:bg-gray-700 rounded-xl shadow-lg",
  primaryText: "text-gray-900 dark:text-gray-100",
  secondaryText: "text-gray-500 dark:text-gray-300",
  accentBlue: "bg-blue-600 text-white",
  accentBlueHover: "hover:bg-blue-700",
  button: "px-6 py-2 rounded-lg font-medium transition",
  input: "w-full px-3 py-2 border rounded-lg focus:ring focus:ring-blue-300 dark:bg-gray-900 dark:border-gray-700 dark:text-white",
  label: "block text-sm font-semibold mb-1",
};

const worksheetToJson = (worksheet) => {
  const headers = [];
  // Get headers from the first row
  worksheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = cell.value;
  });
  const data = [];
  worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
    if (rowNumber === 1) return; // skip header row
    let rowData = {};
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      rowData[headers[colNumber]] = cell.value;
    });
    data.push(rowData);
  });
  return data;
};

const DebtOptimizer = ({ loans }) => {
  const { t } = useTranslation();

  const calculateSavings = (loan) => {
    const extraPayment = (loan.MinimumPayment || 0) * 0.3;
    const monthsSaved =
      (loan.RemainingBalance || 0) /
      ((loan.MinimumPayment || 0) + extraPayment || 1);

    return {
      extraPayment: extraPayment.toFixed(2),
      interestSaved: (
        (loan.InterestRate || 0) *
        (loan.RemainingBalance || 0) *
        0.01
      ).toFixed(2),
      monthsSaved: Math.max(Math.ceil(monthsSaved), 0),
    };
  };

  return (
    <div className="space-y-4">
      {loans.map((loan, index) => {
        const savings = calculateSavings(loan);
        return (
          <div key={index} className={`${modernStyle.cardBg} p-4 bg-red-50 dark:bg-red-900 rounded-lg`}>
            <h3 className="font-bold text-lg">
              {loan.Name || t("unknownLoan")}
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <p className="text-sm">
                  {t("currentPayment")}: ${loan.MinimumPayment?.toLocaleString() || 0}
                </p>
                <p className="text-green-600">
                  {t("proposedPayment")}: ${savings.extraPayment}
                </p>
              </div>
              <div>
                <p className="text-sm">
                  {t("interestSavings")}: ${savings.interestSaved}
                </p>
                <p className="text-sm">
                  {t("shortenedPeriod")}: {savings.monthsSaved} {t("months")}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const GoalTracker = ({ goal }) => {
  const { t } = useTranslation();
  const progress = ((goal.current || 0) / (goal.target || 1)) * 100;
  const monthsLeft = Math.ceil(
    (new Date(goal.date) - new Date()) / (1000 * 60 * 60 * 24 * 30) || 0
  );

  return (
    <div className={`${modernStyle.cardBg} p-4 rounded-xl shadow-lg mb-4`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-bold text-lg">{goal.name}</h3>
          <p className={`text-sm ${modernStyle.secondaryText}`}>
            {t("deadline")}: {goal.date} (
            {monthsLeft > 0
              ? `${monthsLeft} ${t("monthsRemaining")}`
              : t("deadlinePassed")}
          </p>
        </div>
        <div className="w-1/3">
          <div className="flex justify-between mb-1">
            <span className="text-sm">${(goal.current || 0).toLocaleString()}</span>
            <span className="text-sm">${(goal.target || 0).toLocaleString()}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-green-600 rounded-full h-2"
              style={{ width: `${Math.min(progress, 100)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

const Investments = () => {
  const { t } = useTranslation();
  const [investments, setInvestments] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const [totalInvestments, setTotalInvestments] = useState({
    totalInvested: 0,
    totalCurrentValue: 0,
  });
  const [newInvestment, setNewInvestment] = useState({
    InvestorName: "",
    InvestmentType: "",
    AmountInvested: "",
    CurrentValue: "",
    Currency: "USD",
    ReturnRate: "",
    StartDate: "",
    MaturityDate: "",
    Status: "Active",
    Broker: "",
    Portfolio: "",
  });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch investments data
  useEffect(() => {
    const fetchInvestments = async () => {
      try {
        const response = await fetch("http://localhost:4001/investments");
        if (!response.ok) throw new Error(t("failedToFetchInvestments"));
        const data = await response.json();
        setInvestments(data);

        const totalInvested = data.reduce(
          (acc, inv) => acc + parseFloat(inv.AmountInvested || 0),
          0
        );
        const totalCurrentValue = data.reduce(
          (acc, inv) => acc + parseFloat(inv.CurrentValue || 0),
          0
        );

        setTotalInvestments({
          totalInvested,
          totalCurrentValue,
        });
      } catch (error) {
        console.error("Error fetching investments:", error.message);
      }
    };

    fetchInvestments();
  }, [t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvestment((prev) => ({ ...prev, [name]: value }));
  };

  const addNewInvestment = async () => {
    const investmentWithId = {
      InvestmentID: investments.length + 1,
      ...newInvestment,
      AmountInvested: parseFloat(newInvestment.AmountInvested),
      CurrentValue: parseFloat(newInvestment.CurrentValue),
    };

    try {
      const response = await fetch("http://localhost:4001/investments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(investmentWithId),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Server error:", errorData);
        toast.error(t("failedToAddInvestment") + ": " + errorData.error);
        return;
      }

      setInvestments((prev) => [...prev, investmentWithId]);
      setTotalInvestments((prev) => ({
        totalInvested: prev.totalInvested + investmentWithId.AmountInvested,
        totalCurrentValue:
          prev.totalCurrentValue + investmentWithId.CurrentValue,
      }));

      setNewInvestment({
        InvestorName: "",
        InvestmentType: "",
        AmountInvested: "",
        CurrentValue: "",
        Currency: "USD",
        ReturnRate: "",
        StartDate: "",
        MaturityDate: "",
        Status: "Active",
        Broker: "",
        Portfolio: "",
      });
      toast.success(t("investmentAddedSuccessfully"));
    } catch (error) {
      console.error("Error adding investment:", error.message);
      toast.error(t("failedToAddInvestment") + ": " + error.message);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(URL.createObjectURL(file));
      processImage(file);
    }
  };

  const processImage = (file) => {
    setIsProcessing(true);
    Tesseract.recognize(file, "eng", { logger: (info) => console.log(info) })
      .then(({ data: { text } }) => {
        const lines = text.split("\n");
        setNewInvestment({
          InvestorName: lines[0] || "",
          InvestmentType: lines[1] || "",
          AmountInvested: lines[2] || "",
          CurrentValue: lines[3] || "",
          Currency: "USD",
          ReturnRate: lines[4] || "",
          StartDate: lines[5] || "",
          MaturityDate: lines[6] || "",
          Status: "Active",
          Broker: lines[7] || "",
          Portfolio: lines[8] || "",
        });
      })
      .catch((error) =>
        console.error("Error processing image:", error.message)
      )
      .finally(() => setIsProcessing(false));
  };

  const handleChangePage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const displayedRows = useMemo(
    () =>
      investments.slice(
        (currentPage - 1) * rowsPerPage,
        currentPage * rowsPerPage
      ),
    [investments, currentPage, rowsPerPage]
  );

  return (
    <div className={modernStyle.mainBg}>
      <TopNav />
      <div className={`${modernStyle.container} py-8`}>
        <div className="mb-8">
          <h1 className={`text-3xl font-extrabold ${modernStyle.primaryText} mb-4`}>
            {t("investments")}
          </h1>
          <p className={modernStyle.secondaryText}>
            {t("investmentsDescription")}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className={`${modernStyle.cardBg} p-4`}>
            <h3 className={`text-lg font-bold ${modernStyle.primaryText}`}>
              {t("totalInvested")}
            </h3>
            <p className="text-2xl font-semibold text-blue-600 mt-2">
              ${totalInvestments.totalInvested.toLocaleString()}
            </p>
          </div>
          <div className={`${modernStyle.cardBg} p-4`}>
            <h3 className={`text-lg font-bold ${modernStyle.primaryText}`}>
              {t("totalCurrentValue")}
            </h3>
            <p className="text-2xl font-semibold text-green-600 mt-2">
              ${totalInvestments.totalCurrentValue.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => setIsFormVisible(!isFormVisible)}
            className={`${modernStyle.button} ${modernStyle.accentBlue} ${modernStyle.accentBlueHover}`}
          >
            {isFormVisible ? t("hideForm") : t("addInvestment")}
          </button>
        </div>

        {isFormVisible && (
          <div className={`${modernStyle.cardBg} mb-6 p-4`}>
            <h2 className={`text-lg font-bold ${modernStyle.primaryText} mb-4`}>
              {t("addNewInvestment")}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {Object.keys(newInvestment).map((key) => (
                <div key={key}>
                  <label className={`${modernStyle.label} ${modernStyle.secondaryText}`}>
                    {t(key)}
                  </label>
                  <input
                    name={key}
                    value={newInvestment[key]}
                    onChange={handleInputChange}
                    className={modernStyle.input}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={addNewInvestment}
              className={`${modernStyle.button} ${modernStyle.accentBlue} ${modernStyle.accentBlueHover} mt-4`}
            >
              {t("submitInvestment")}
            </button>
          </div>
        )}

        <div className={`${modernStyle.cardBg} mb-6 p-4`}>
          <h2 className={`text-lg font-bold ${modernStyle.primaryText} mb-4`}>
            {t("uploadDocumentImage")}
          </h2>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="block w-full text-sm text-gray-500 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white file:font-semibold hover:file:bg-blue-700 focus:outline-none"
          />
          {uploadedImage && (
            <div className="mt-4">
              <img
                src={uploadedImage}
                alt={t("uploadedPreview")}
                className="w-64 h-auto rounded-lg shadow-md"
              />
            </div>
          )}
          {isProcessing && (
            <p className="text-blue-600 mt-4">{t("processingImage")}</p>
          )}
        </div>

        <div className={`${modernStyle.cardBg} rounded-xl shadow-lg overflow-auto`}>
          <table className="min-w-full table-auto">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                {["InvestmentID", ...Object.keys(newInvestment)].map((key) => (
                  <th
                    key={key}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider"
                  >
                    {t(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {displayedRows.map((investment, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  {[
                    investment.InvestmentID,
                    ...Object.keys(newInvestment).map((key) => investment[key]),
                  ].map((value, i) => (
                    <td key={i} className="px-4 py-2 text-sm text-gray-800 dark:text-gray-200">
                      {value}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="mt-4 flex justify-center">
          {Array.from({ length: Math.ceil(investments.length / rowsPerPage) }, (_, i) => (
            <button
              key={i}
              onClick={() => handleChangePage(i + 1)}
              className={`mx-1 px-3 py-1 rounded-md ${
                currentPage === i + 1
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>
      <Toaster position="bottom-right" />
    </div>
  );
};

export default Investments; 