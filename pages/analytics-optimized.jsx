import React, { useState, useEffect, memo, useCallback } from "react";
import Head from "next/head";
import { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { LazyTopNav, LazyAIChatSection, SuspenseWrapper } from "../components/optimized/LazyComponents";
import { usePerformanceMonitor, ErrorBoundary } from "../components/optimized/PerformanceOptimizer";
import '../i18n';

// Hero section component inspired by Ramsey Solutions
const HeroSection = memo(() => {
  usePerformanceMonitor('HeroSection');
  
  return (
    <div className="bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Take Control of Your
            <span className="block text-blue-300">Financial Future</span>
          </h1>
          <p className="text-xl md:text-2xl mb-8 text-blue-100 max-w-3xl mx-auto">
            Get personalized financial guidance, create actionable plans, and achieve your money goals with our AI-powered financial advisor.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-green-500 hover:bg-green-600 text-white font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200">
              Start Your Financial Journey
            </button>
            <button className="border-2 border-white text-white hover:bg-white hover:text-blue-900 font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200">
              Learn More
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});

HeroSection.displayName = 'HeroSection';

// Financial steps section
const FinancialSteps = memo(() => {
  usePerformanceMonitor('FinancialSteps');
  
  const steps = [
    {
      number: "1",
      title: "Emergency Fund",
      description: "Save $1,000 for your starter emergency fund",
      icon: "🛡️"
    },
    {
      number: "2", 
      title: "Debt Freedom",
      description: "Pay off all debt (except the house) using our proven method",
      icon: "⛓️‍💥"
    },
    {
      number: "3",
      title: "Full Emergency Fund", 
      description: "Save 3-6 months of expenses in a fully funded emergency fund",
      icon: "💰"
    },
    {
      number: "4",
      title: "Invest for Retirement",
      description: "Invest 15% of your household income in retirement",
      icon: "📈"
    },
    {
      number: "5",
      title: "Children's College Fund",
      description: "Save for your children's college education",
      icon: "🎓"
    },
    {
      number: "6",
      title: "Pay Off Home Early",
      description: "Pay off your home mortgage early",
      icon: "🏠"
    },
    {
      number: "7",
      title: "Build Wealth & Give",
      description: "Build wealth and give generously",
      icon: "🌟"
    }
  ];

  return (
    <div className="bg-gray-50 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            The 7 Steps to Financial Freedom
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Follow our proven plan that has helped millions of people take control of their money and build wealth.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {steps.map((step, index) => (
            <div 
              key={step.number}
              className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-3">
                  {step.number}
                </div>
                <span className="text-2xl">{step.icon}</span>
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-600 text-sm">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

FinancialSteps.displayName = 'FinancialSteps';

// Features section
const FeaturesSection = memo(() => {
  usePerformanceMonitor('FeaturesSection');
  
  const features = [
    {
      title: "AI-Powered Decision Tree",
      description: "Get personalized recommendations based on your unique financial situation",
      icon: "🤖"
    },
    {
      title: "PDF Report Generation", 
      description: "Download comprehensive financial reports with actionable insights",
      icon: "📄"
    },
    {
      title: "Real-time Chat Support",
      description: "Chat with our AI financial advisor powered by OpenAI for instant guidance",
      icon: "💬"
    },
    {
      title: "Progress Tracking",
      description: "Monitor your financial journey with detailed progress tracking and milestones",
      icon: "📊"
    }
  ];

  return (
    <div className="bg-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Tools for Your Financial Success
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Our platform combines cutting-edge AI technology with proven financial principles to give you the tools you need to succeed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

FeaturesSection.displayName = 'FeaturesSection';

// Statistics section
const StatsSection = memo(() => {
  usePerformanceMonitor('StatsSection');
  
  const stats = [
    { number: "10M+", label: "Lives Changed" },
    { number: "30+", label: "Years of Experience" },
    { number: "95%", label: "Success Rate" },
    { number: "$2.5B+", label: "Debt Eliminated" }
  ];

  return (
    <div className="bg-blue-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Proven Results That Speak for Themselves
          </h2>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-4xl md:text-5xl font-bold text-blue-300 mb-2">
                {stat.number}
              </div>
              <div className="text-lg text-blue-100">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

StatsSection.displayName = 'StatsSection';

// Main Analytics Page Component
const AnalyticsPageOptimized = () => {
  usePerformanceMonitor('AnalyticsPageOptimized');
  
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  const [showAISection, setShowAISection] = useState(false);
  const userId = 1;

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`/api/user-profile/${userId}`);
      const data = await res.json();
      setUserProfile(data);
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleStartJourney = useCallback(() => {
    setShowAISection(true);
    // Smooth scroll to AI section
    setTimeout(() => {
      document.getElementById('ai-section')?.scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
      });
    }, 100);
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">{t("loadingData") || "Loading your financial dashboard..."}</p>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-white">
        <Head>
          <title>Financial Freedom Platform - Take Control of Your Money</title>
          <meta name="description" content="AI-powered financial guidance platform helping you achieve financial freedom through proven strategies and personalized advice." />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="true" />
        </Head>

        <Toaster 
          position="bottom-right" 
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
          }}
        />

        <SuspenseWrapper>
          <LazyTopNav activeTab="analytics" />
        </SuspenseWrapper>

        {/* Hero Section */}
        <HeroSection />

        {/* Financial Steps Section */}
        <FinancialSteps />

        {/* Features Section */}
        <FeaturesSection />

        {/* Statistics Section */}
        <StatsSection />

        {/* CTA Section */}
        <div className="bg-green-500 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to Change Your Financial Future?
            </h2>
            <p className="text-xl text-green-100 mb-8 max-w-2xl mx-auto">
              Start your journey to financial freedom today with our AI-powered financial advisor.
            </p>
            <button 
              onClick={handleStartJourney}
              className="bg-white text-green-600 hover:bg-gray-100 font-bold py-4 px-8 rounded-lg text-lg transition-colors duration-200 shadow-lg"
            >
              Get Started Now - It's Free!
            </button>
          </div>
        </div>

        {/* AI Chat Section */}
        {showAISection && (
          <div id="ai-section" className="bg-gray-50">
            <SuspenseWrapper fallback={
              <div className="flex justify-center items-center py-16">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <span className="ml-4 text-gray-600">Loading your personal financial advisor...</span>
              </div>
            }>
              <LazyAIChatSection userProfile={userProfile} userId={userId} />
            </SuspenseWrapper>
          </div>
        )}

        {/* Footer */}
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <h3 className="text-lg font-bold mb-4">Financial Freedom Platform</h3>
                <p className="text-gray-400">
                  Empowering millions to take control of their financial future through proven strategies and AI-powered guidance.
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Quick Links</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Get Started</a></li>
                  <li><a href="#" className="hover:text-white">Financial Tools</a></li>
                  <li><a href="#" className="hover:text-white">Success Stories</a></li>
                  <li><a href="#" className="hover:text-white">Support</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Resources</h4>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white">Financial Education</a></li>
                  <li><a href="#" className="hover:text-white">Debt Calculator</a></li>
                  <li><a href="#" className="hover:text-white">Budget Planner</a></li>
                  <li><a href="#" className="hover:text-white">Investment Guide</a></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-4">Contact</h4>
                <ul className="space-y-2 text-gray-400">
                  <li>support@financialfreedom.com</li>
                  <li>1-800-FREEDOM</li>
                  <li>Mon-Fri 8AM-8PM EST</li>
                </ul>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2025 Financial Freedom Platform. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    </ErrorBoundary>
  );
};

export default memo(AnalyticsPageOptimized);