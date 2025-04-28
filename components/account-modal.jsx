import React, { useContext } from 'react'; // Dodano brakujący import React
import { DataContext } from '../utilities/DataContext';
import { MdCancelPresentation } from 'react-icons/md'; // Upewnij się, że ta biblioteka jest poprawnie zainstalowana
import { useTranslation } from 'react-i18next'; // Upewnij się, że konfiguracja i18next jest poprawna

const ExampleComponent = () => {
  const { t } = useTranslation();
  return <h1>{t('welcome')}</h1>;
};

const AccountModal = () => {
  const { t } = useTranslation();
  const { trackedAccount, modal, isSearching } = useContext(DataContext) || {};
  const [toggleModal, setToggleModal] = modal || [false, () => {}]; // Fallback na wypadek braku modal
  const [searching, setSearching] = isSearching || [true, () => {}]; // Fallback na wypadek braku isSearching

  // Przykładowe opóźnienie symulujące pobieranie danych
  setTimeout(() => {
    setSearching(false);
  }, 10000);

  return (
    <div
      className={`fixed inset-0 bg-gray-600 bg-opacity-50 dark:bg-black dark:bg-opacity-70 overflow-y-auto h-full w-full ${
        toggleModal ? 'block' : 'hidden'
      }`}
    >
      <div className="relative top-24 bottom-12 mx-auto px-5 lg:px-10 py-5 w-4/5 lg:w-1/2 shadow-lg rounded-md bg-white dark:bg-midnight-blue">
        <div className="mb-3">
          <button
            onClick={() => setToggleModal(false)}
            className="float-right text-slate-800 dark:text-white text-xl rounded-full"
          >
            <MdCancelPresentation />
          </button>
        </div>
        <div className="text-center">
          <h2 className="font-bold dark:font-medium text-xl text-slate-800 dark:text-white">
            {searching ? t('fetchingAccountDetails') : t('accountDetails')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {searching
              ? t('pleaseWaitRetrievingAccountDetails')
              : t('detailsRetrievedSuccessfully')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountModal; // Upewnij się, że eksportujesz poprawnie komponent
