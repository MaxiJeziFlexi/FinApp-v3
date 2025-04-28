import React, { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { RingLoader } from "react-spinners";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import '../i18n'; // Import konfiguracji i18next
const TopNav = dynamic(() => import("../components/top-nav"), { ssr: false });
const AIChatSection = dynamic(() => import("../components/AIChatSection"), { ssr: false });

const AnalyticsPage = () => {
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const userId = 1;

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await fetch(`/api/user-profile/${userId}`);
        const data = await res.json();
        setUserProfile(data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <RingLoader color="#007bff" size={60} />
        <p>{t("loadingData") || "Loading data..."}</p>
      </div>
    );
  }

  return (
    <div className="analytics-container p-0 bg-gray-100 dark:bg-gray-900 min-h-screen">
      <Toaster position="bottom-right" />
      <TopNav activeTab="analytics" />
      <h1 className="text-4xl font-extrabold text-gray-800 dark:text-white mb-6">
      </h1>

      {/* Sekcja z komponentem czatu AI */}
      <div className="mb-8 w-full">
        <AIChatSection userProfile={userProfile} userId={userId} />
      </div>
    </div>
  );
};

export default AnalyticsPage;