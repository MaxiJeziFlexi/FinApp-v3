import { useState } from "react";
import { useRouter } from "next/router"; // Dodanie routera

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter(); // Inicjalizacja routera

  const handleLogin = async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("http://localhost:8000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        alert("Login successful!");
        localStorage.setItem("isLoggedIn", true); // Zapis zalogowania w localStorage
        router.push("/analytics"); // Przekierowanie do dashboardu
      } else {
        setError(data.message || "Invalid username or password");
      }
    } catch (error) {
      setError("Failed to connect to the server.");
      console.error("Error during login:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-slate-200 dark:bg-midnight-blue">
      <div className="w-full max-w-md bg-white dark:bg-night-blue rounded-lg shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center text-slate-800 dark:text-white mb-6">
          Log In
        </h1>
        <div className="mb-4">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="mb-6">
          <label className="block text-slate-600 dark:text-slate-400 text-sm font-bold mb-2">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {error && <p className="text-red-500 text-sm text-center mb-4">{error}</p>}
        {isLoading ? (
          <p className="text-blue-500 text-sm text-center mb-4">Processing...</p>
        ) : (
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
          >
            Log In
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
