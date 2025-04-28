import { useRouter } from 'next/router';

const Start = () => {
  const router = useRouter();

  const goToLogin = () => {
    router.push('/login');
  };

  const goToRegister = () => {
    router.push('/registration');
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-200 dark:bg-midnight-blue">
      <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-8">
        Welcome to the Fin App
      </h1>
      <div className="flex space-x-4">
        <button
          onClick={goToLogin}
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Log In
        </button>
        <button
          onClick={goToRegister}
          className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg"
        >
          Register
        </button>
      </div>
    </div>
  );
};

export default Start;
