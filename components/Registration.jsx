import { useState } from "react";
import { useRouter } from "next/router";

const Registration = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [invitationCode, setInvitationCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!username || !password || !email) {
      setError("Wymagane pola: email, nazwa użytkownika i hasło");
      setIsLoading(false);
      return;
    }

    try {
      // Jeśli masz kod zaproszeniowy, użyj endpointu z zaproszeniem
      let response;
      
      if (invitationCode) {
        response = await fetch("http://localhost:8000/register/with-invitation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            email,
            invitation_code: invitationCode
          }),
        });
      } else {
        // Standardowa rejestracja bez kodu
        response = await fetch("http://localhost:8000/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            email
          }),
        });
      }

      const data = await response.json();

      if (response.ok) {
        alert("Rejestracja udana! Możesz się teraz zalogować.");
        router.push("/login");
      } else {
        setError(data.detail || "Rejestracja nie powiodła się. Sprawdź wprowadzone dane.");
      }
    } catch (error) {
      console.error("Error during registration:", error);
      setError("Nie można połączyć się z serwerem. Sprawdź, czy serwer API działa.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-200 dark:bg-midnight-blue">
      <div className="w-full max-w-md bg-white dark:bg-night-blue rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Register
        </h1>
        <form onSubmit={handleRegister}>
          <div className="mb-4">
            <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>
          <div className="mb-6">
            <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
              Invitation Code (opcjonalnie)
            </label>
            <input
              type="text"
              value={invitationCode}
              onChange={(e) => setInvitationCode(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            {isLoading ? "Processing..." : "Register"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Registration;