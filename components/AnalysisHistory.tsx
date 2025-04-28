import { useEffect, useState } from "react";

const AnalysisHistory = () => {
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:8001/analyses")
      .then((res) => res.json())
      .then(setAnalyses)
      .catch(() => setAnalyses([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-lg">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">Moje analizy</h2>

      {loading ? (
        <p className="text-gray-500">Ładowanie historii analiz...</p>
      ) : analyses.length === 0 ? (
        <p className="text-gray-500">Brak zapisanych analiz.</p>
      ) : (
        <ul className="space-y-4">
          {analyses.map((item: any) => (
            <li key={item.id} className="border-b pb-4">
              <div className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-700 dark:text-gray-100">
                    Trend: <span className="font-semibold">{item.trend}</span>
                  </p>
                  <p className="text-sm text-gray-500">Dochód: ${item.income} / Wydatki: ${item.expenses}</p>
                  <p className="text-sm text-gray-500">Płynność: ${item.liquidity}</p>
                  <p className="text-sm text-gray-500">Sugestia: {item.suggestion}</p>
                </div>
                <p className="text-sm text-gray-400">{new Date(item.created_at).toLocaleString()}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default AnalysisHistory;
