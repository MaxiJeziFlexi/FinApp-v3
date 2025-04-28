import React, { useState, useEffect } from 'react';

const InvitationsManagement = () => {
  const [invitations, setInvitations] = useState([]);
  const [count, setCount] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showUsed, setShowUsed] = useState(false);
  
  // Pobierz listę zaproszeń
  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się jako administrator.');
        setLoading(false);
        return;
      }
      
      const response = await fetch(`http://localhost:8000/invitations?show_used=${showUsed}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Brak dostępu lub błąd serwera');
      }
      
      const data = await response.json();
      setInvitations(data.invitations || []);
      setError('');
    } catch (err) {
      console.error('Błąd podczas pobierania zaproszeń:', err);
      setError('Nie udało się pobrać listy zaproszeń. Sprawdź uprawnienia administratora.');
    } finally {
      setLoading(false);
    }
  };
  
  // Generuj nowe zaproszenia
  const generateInvitations = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Brak autoryzacji. Zaloguj się jako administrator.');
        setLoading(false);
        return;
      }
      
      const response = await fetch('http://localhost:8000/invitations/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ count })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Błąd podczas generowania zaproszeń');
      }
      
      // Odśwież listę zaproszeń
      fetchInvitations();
      alert(`Wygenerowano ${count} nowych zaproszeń`);
    } catch (err) {
      console.error('Błąd podczas generowania zaproszeń:', err);
      setError('Nie udało się wygenerować zaproszeń. Sprawdź uprawnienia administratora.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchInvitations();
  }, [showUsed]);
  
  return (
    <div className="p-6 bg-white dark:bg-night-blue rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-6">Zarządzanie zaproszeniami</h2>
      
      {error && <div className="p-4 mb-4 text-red-700 bg-red-100 rounded-lg">{error}</div>}
      
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <label className="text-slate-600 dark:text-slate-400">Liczba zaproszeń:</label>
          <input
            type="number"
            min="1"
            max="50"
            value={count}
            onChange={(e) => setCount(parseInt(e.target.value) || 1)}
            className="w-20 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button 
            onClick={generateInvitations}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg disabled:opacity-50"
          >
            {loading ? "Generowanie..." : "Generuj zaproszenia"}
          </button>
        </div>
        
        <div className="flex items-center">
          <label className="inline-flex items-center text-slate-600 dark:text-slate-400">
            <input
              type="checkbox"
              checked={showUsed}
              onChange={() => setShowUsed(!showUsed)}
              className="mr-2"
            />
            Pokaż wykorzystane zaproszenia
          </label>
        </div>
      </div>
      
      <div>
        <h3 className="text-xl font-semibold text-slate-800 dark:text-white mb-4">Lista zaproszeń</h3>
        {loading ? (
          <p className="text-slate-600 dark:text-slate-400">Ładowanie...</p>
        ) : invitations.length === 0 ? (
          <p className="text-slate-600 dark:text-slate-400">Brak zaproszeń</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <th className="py-2 px-4 border-b">Kod</th>
                  <th className="py-2 px-4 border-b">Status</th>
                  <th className="py-2 px-4 border-b">Email</th>
                  <th className="py-2 px-4 border-b">Data utworzenia</th>
                  <th className="py-2 px-4 border-b">Data wykorzystania</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map(invitation => (
                  <tr key={invitation.id || invitation.invitation_code} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="py-2 px-4 border-b">{invitation.invitation_code}</td>
                    <td className="py-2 px-4 border-b">
                      <span className={`px-2 py-1 rounded-full text-xs ${invitation.is_used ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                        {invitation.is_used ? 'Wykorzystany' : 'Dostępny'}
                      </span>
                    </td>
                    <td className="py-2 px-4 border-b">{invitation.email || '-'}</td>
                    <td className="py-2 px-4 border-b">{invitation.created_at ? new Date(invitation.created_at).toLocaleString() : '-'}</td>
                    <td className="py-2 px-4 border-b">{invitation.used_at ? new Date(invitation.used_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvitationsManagement;