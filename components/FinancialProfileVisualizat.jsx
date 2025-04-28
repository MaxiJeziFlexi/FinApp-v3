import React, { useState, useEffect } from 'react';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

const FinancialProfileVisualization = ({ advisorInsights, selectedAdvisor, generateReport }) => {
  const [activeTab, setActiveTab] = useState('profile');
  
  // Konwersja danych wejściowych na format odpowiedni dla wykresów
  const prepareChartData = () => {
    if (!advisorInsights || !selectedAdvisor) return { pieData: [], barData: [] };
    
    // Dane dla wykresu kołowego (profil)
    let pieData = [];
    let barData = [];
    
    switch(selectedAdvisor) {
      case 'financial':
        // Dane dotyczące stylu zarządzania budżetem
        pieData = [
          { name: 'Impulsywny', value: advisorInsights.financial.traits.includes('impulsive') ? 60 : 10 },
          { name: 'Planujący', value: advisorInsights.financial.traits.includes('planner') ? 60 : 10 },
          { name: 'Oszczędny', value: advisorInsights.financial.traits.includes('saver') ? 60 : 10 }
        ];
        
        // Dane do wykresu słupkowego - struktura wydatków (przykładowe)
        barData = [
          { name: 'Mieszkanie', value: 35 },
          { name: 'Jedzenie', value: 25 },
          { name: 'Transport', value: 15 },
          { name: 'Rozrywka', value: 10 },
          { name: 'Oszczędności', value: 15 }
        ];
        break;
        
      case 'investment':
        // Dane dotyczące podejścia do inwestycji
        pieData = [
          { name: 'Konserwatywny', value: advisorInsights.investment.profile === 'Konserwatywny' ? 70 : 10 },
          { name: 'Zrównoważony', value: advisorInsights.investment.profile === 'Zrównoważony' ? 70 : 10 },
          { name: 'Dynamiczny', value: advisorInsights.investment.profile === 'Dynamiczny' ? 70 : 10 }
        ];
        
        // Dane do alokacji aktywów
        barData = advisorInsights.investment.profile === 'Konserwatywny' 
          ? [
              { name: 'Obligacje', value: 50 },
              { name: 'Lokaty', value: 20 },
              { name: 'Akcje', value: 20 },
              { name: 'Gotówka', value: 10 }
            ]
          : advisorInsights.investment.profile === 'Zrównoważony'
          ? [
              { name: 'Akcje', value: 40 },
              { name: 'Obligacje', value: 25 },
              { name: 'Nieruchomości', value: 20 },
              { name: 'Gotówka', value: 15 }
            ]
          : [
              { name: 'Akcje', value: 60 },
              { name: 'Alternatywne', value: 20 },
              { name: 'Obligacje', value: 10 },
              { name: 'Gotówka', value: 10 }
            ];
        break;
        
      case 'legal':
        // Dane dotyczące podejścia prawnego
        pieData = [
          { name: 'Formalny', value: advisorInsights.legal.profile === 'Formalny' ? 70 : 10 },
          { name: 'Pragmatyczny', value: advisorInsights.legal.profile === 'Pragmatyczny' ? 70 : 10 },
          { name: 'Ryzykujący', value: advisorInsights.legal.profile === 'Ryzykujący' ? 70 : 10 }
        ];
        
        // Dane do struktury dokumentacji
        barData = advisorInsights.legal.profile === 'Formalny'
          ? [
              { name: 'Umowy pisemne', value: 70 },
              { name: 'Konsultacje', value: 20 },
              { name: 'Nieformalne', value: 10 }
            ]
          : advisorInsights.legal.profile === 'Pragmatyczny'
          ? [
              { name: 'Umowy pisemne', value: 40 },
              { name: 'Konsultacje', value: 40 },
              { name: 'Nieformalne', value: 20 }
            ]
          : [
              { name: 'Umowy pisemne', value: 20 },
              { name: 'Konsultacje', value: 30 },
              { name: 'Nieformalne', value: 50 }
            ];
        break;
        
      case 'tax':
        // Dane dotyczące podejścia podatkowego
        pieData = [
          { name: 'Zachowawczy', value: advisorInsights.tax.profile === 'Zachowawczy' ? 70 : 10 },
          { name: 'Optymalizujący', value: advisorInsights.tax.profile === 'Optymalizujący' ? 70 : 10 },
          { name: 'Agresywny', value: advisorInsights.tax.profile === 'Agresywny' ? 70 : 10 }
        ];
        
        // Dane do strategii podatkowych
        barData = advisorInsights.tax.profile === 'Zachowawczy'
          ? [
              { name: 'Zgodność', value: 70 },
              { name: 'Ulgi podstawowe', value: 20 },
              { name: 'Optymalizacja', value: 10 }
            ]
          : advisorInsights.tax.profile === 'Optymalizujący'
          ? [
              { name: 'Zgodność', value: 40 },
              { name: 'Ulgi podstawowe', value: 30 },
              { name: 'Optymalizacja', value: 30 }
            ]
          : [
              { name: 'Zgodność', value: 30 },
              { name: 'Ulgi podstawowe', value: 20 },
              { name: 'Optymalizacja', value: 50 }
            ];
        break;
        
      default:
        pieData = [];
        barData = [];
    }
    
    return { pieData, barData };
  };
  
  const { pieData, barData } = prepareChartData();
  
  // Kolory dla wykresu kołowego
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A569BD'];
  
  const getAdvisorTitle = () => {
    switch(selectedAdvisor) {
      case 'financial': return 'Profil Finansowy';
      case 'investment': return 'Profil Inwestycyjny';
      case 'legal': return 'Profil Prawny';
      case 'tax': return 'Profil Podatkowy';
      default: return 'Profil Doradczy';
    }
  };
  
  const getAdvisorDescription = () => {
    if (!advisorInsights || !selectedAdvisor) return 'Brak danych profilowych.';
    
    switch(selectedAdvisor) {
      case 'financial':
        return advisorInsights.financial.latestInsight || 'Analiza finansowa w toku...';
      case 'investment':
        return advisorInsights.investment.latestInsight || 'Analiza inwestycyjna w toku...';
      case 'legal':
        return advisorInsights.legal.latestInsight || 'Analiza prawna w toku...';
      case 'tax':
        return advisorInsights.tax.latestInsight || 'Analiza podatkowa w toku...';
      default:
        return 'Wybierz doradcę, aby zobaczyć analizę.';
    }
  };
  
  const renderTabContent = () => {
    switch(activeTab) {
      case 'profile':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">{getAdvisorTitle()}</h3>
            <p className="text-gray-700 mb-4">{getAdvisorDescription()}</p>
            
            {pieData.length > 0 && (
              <div className="mb-6">
                <h4 className="text-md font-medium mb-2">Twój profil preferencji</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {barData.length > 0 && (
              <div>
                <h4 className="text-md font-medium mb-2">Rekomendowana struktura</h4>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={barData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => `${value}%`} />
                      <Legend />
                      <Bar dataKey="value" name="Procent" fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'recommendations':
        return (
          <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3">Rekomendacje dla Twojego profilu</h3>
            
            {selectedAdvisor === 'financial' && (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 className="font-medium text-blue-800 mb-2">Strategia budżetowa:</h4>
                  <ul className="list-disc pl-5 text-blue-700 space-y-1">
                    {advisorInsights.financial.profile === 'Oszczędny' ? (
                      <>
                        <li>Zrównoważenie oszczędzania z jakością życia</li>
                        <li>Rozważenie aktywnego inwestowania nadwyżek</li>
                        <li>Utrzymanie celu oszczędnościowego na poziomie 15-20% dochodów</li>
                      </>
                    ) : advisorInsights.financial.profile === 'Planujący' ? (
                      <>
                        <li>Regularna rewizja długoterminowych celów</li>
                        <li>Budżet kategorialny z jasno określonymi limitami</li>
                        <li>System śledzenia wydatków i oszczędności</li>
                      </>
                    ) : (
                      <>
                        <li>Wprowadzenie automatycznego oszczędzania</li>
                        <li>Budżetowanie metodą kopertową dla wydatków impulsowych</li>
                        <li>Reguła 24h przed większymi zakupami</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={generateReport}
                  className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
                >
                  Generuj pełny raport finansowy
                </button>
              </div>
            )}
            
            {selectedAdvisor === 'investment' && (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded-lg border border-green-100">
                  <h4 className="font-medium text-green-800 mb-2">Strategia inwestycyjna:</h4>
                  <ul className="list-disc pl-5 text-green-700 space-y-1">
                    {advisorInsights.investment.profile === 'Konserwatywny' ? (
                      <>
                        <li>Portfel bazujący na obligacjach i lokatach (70-80%)</li>
                        <li>Niewielki udział akcji dużych spółek dywidendowych (15-20%)</li>
                        <li>Utrzymywanie rezerwy gotówkowej (10-15%)</li>
                      </>
                    ) : advisorInsights.investment.profile === 'Zrównoważony' ? (
                      <>
                        <li>Zdywersyfikowany portfel akcji i obligacji (po ok. 40-45%)</li>
                        <li>Ekspozycja na rynek nieruchomości (10-15%)</li>
                        <li>Regularne rebalansowanie portfela (co 6-12 miesięcy)</li>
                      </>
                    ) : (
                      <>
                        <li>Portfel ukierunkowany na wzrost z dominacją akcji (60-70%)</li>
                        <li>Udział aktywów alternatywnych (15-25%)</li>
                        <li>Aktywne zarządzanie z comiesięcznym przeglądem portfela</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={generateReport}
                  className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all"
                >
                  Generuj pełny raport inwestycyjny
                </button>
              </div>
            )}
            
            {selectedAdvisor === 'legal' && (
              <div className="space-y-3">
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-100">
                  <h4 className="font-medium text-purple-800 mb-2">Rekomendacje prawne:</h4>
                  <ul className="list-disc pl-5 text-purple-700 space-y-1">
                    {advisorInsights.legal.profile === 'Formalny' ? (
                      <>
                        <li>Kompleksowa dokumentacja prawna dla kluczowych aktywów</li>
                        <li>Regularne konsultacje z prawnikiem (co kwartał)</li>
                        <li>Cyfrowy system archiwizacji dokumentów prawnych</li>
                      </>
                    ) : advisorInsights.legal.profile === 'Pragmatyczny' ? (
                      <>
                        <li>Formalizacja kluczowych obszarów, elastyczność w pozostałych</li>
                        <li>Konsultacje prawne przy istotnych zmianach życiowych/biznesowych</li>
                        <li>Prosta lista kontrolna dla standardowych sytuacji prawnych</li>
                      </>
                    ) : (
                      <>
                        <li>Minimalne zabezpieczenia prawne dla głównych aktywów</li>
                        <li>Identyfikacja obszarów wysokiego ryzyka prawnego</li>
                        <li>Szablony podstawowych dokumentów do samodzielnego użycia</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={generateReport}
                  className="w-full mt-4 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-all"
                >
                  Generuj pełny raport prawny
                </button>
              </div>
            )}
            
            {selectedAdvisor === 'tax' && (
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <h4 className="font-medium text-amber-800 mb-2">Strategia podatkowa:</h4>
                  <ul className="list-disc pl-5 text-amber-700 space-y-1">
                    {advisorInsights.tax.profile === 'Zachowawczy' ? (
                      <>
                        <li>Wykorzystanie podstawowych ulg podatkowych</li>
                        <li>Dokumentacja wszystkich wydatków podlegających odliczeniu</li>
                        <li>Konserwatywne podejście do interpretacji przepisów</li>
                      </>
                    ) : advisorInsights.tax.profile === 'Optymalizujący' ? (
                      <>
                        <li>Analiza wszystkich dostępnych ulg i zwolnień podatkowych</li>
                        <li>Planowanie podatkowe z wyprzedzeniem</li>
                        <li>Rozważenie konsultacji z doradcą podatkowym</li>
                      </>
                    ) : (
                      <>
                        <li>Kompleksowe wykorzystanie możliwości optymalizacji</li>
                        <li>Regularne konsultacje z doradcą podatkowym</li>
                        <li>Międzynarodowe strategie podatkowe (jeśli dostępne)</li>
                      </>
                    )}
                  </ul>
                </div>
                
                <button
                  onClick={generateReport}
                  className="w-full mt-4 bg-amber-600 text-white py-2 px-4 rounded-lg hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-all"
                >
                  Generuj pełny raport podatkowy
                </button>
              </div>
            )}
          </div>
        );
        
      default:
        return <div>Wybierz zakładkę, aby zobaczyć więcej informacji</div>;
    }
  };
  
  return (
    <div className="w-full">
      {/* Tabs */}
      <div className="mb-4 border-b border-gray-200">
        <ul className="flex flex-wrap -mb-px text-sm font-medium text-center">
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'profile'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('profile')}
            >
              Twój Profil
            </button>
          </li>
          <li className="mr-2">
            <button
              className={`inline-block p-4 rounded-t-lg ${
                activeTab === 'recommendations'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-500 hover:text-gray-600 hover:border-gray-300'
              }`}
              onClick={() => setActiveTab('recommendations')}
            >
              Rekomendacje
            </button>
          </li>
        </ul>
      </div>
      
      {/* Tab Content */}
      {renderTabContent()}
    </div>
  );
};

export default FinancialProfileVisualization;