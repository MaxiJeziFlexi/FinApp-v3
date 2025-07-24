// pages/api/user-profile/[userId].js

// Mock user profiles for different financial situations
const mockUserProfiles = {
  1: {
    id: 1,
    name: "John Smith",
    email: "john.smith@email.com",
    financialGoal: "emergency_fund",
    timeframe: "6_months",
    currentSavings: "2500",
    monthlyIncome: "5000-7500",
    targetAmount: "12000",
    onboardingComplete: true,
    progress: 35,
    currentBabyStep: 2,
    achievements: ["first_goal", "savings_1000"],
    consents: {
      dataProcessing: true,
      profiling: true
    },
    financialProfile: {
      riskTolerance: "moderate",
      investmentExperience: "beginner",
      debtAmount: 15000,
      monthlyExpenses: 4200,
      emergencyFundGoal: 25200, // 6 months of expenses
      retirementContribution: 0.10
    },
    lastCompletedAdvisor: "debt_specialist",
    preferredAdvisor: "financial_planner",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: new Date().toISOString()
  },
  2: {
    id: 2,
    name: "Sarah Johnson",
    email: "sarah.johnson@email.com",
    financialGoal: "home_purchase",
    timeframe: "2_years",
    currentSavings: "15000",
    monthlyIncome: "7500-10000",
    targetAmount: "100000",
    onboardingComplete: true,
    progress: 60,
    currentBabyStep: 4,
    achievements: ["first_goal", "savings_1000", "debt_free", "emergency_fund"],
    consents: {
      dataProcessing: true,
      profiling: true
    },
    financialProfile: {
      riskTolerance: "aggressive",
      investmentExperience: "intermediate",
      debtAmount: 0,
      monthlyExpenses: 5500,
      emergencyFundGoal: 33000,
      retirementContribution: 0.15
    },
    lastCompletedAdvisor: "investment_advisor",
    preferredAdvisor: "real_estate_expert",
    createdAt: "2023-08-20T14:15:00Z",
    updatedAt: new Date().toISOString()
  },
  3: {
    id: 3,
    name: "Mike Rodriguez",
    email: "mike.rodriguez@email.com",
    financialGoal: "debt_reduction",
    timeframe: "18_months",
    currentSavings: "1000",
    monthlyIncome: "3000-5000",
    targetAmount: "20000",
    onboardingComplete: true,
    progress: 15,
    currentBabyStep: 1,
    achievements: ["first_goal"],
    consents: {
      dataProcessing: true,
      profiling: true
    },
    financialProfile: {
      riskTolerance: "conservative",
      investmentExperience: "none",
      debtAmount: 35000,
      monthlyExpenses: 3800,
      emergencyFundGoal: 22800,
      retirementContribution: 0.03
    },
    lastCompletedAdvisor: null,
    preferredAdvisor: "debt_specialist",
    createdAt: "2024-12-01T09:00:00Z",
    updatedAt: new Date().toISOString()
  }
};

export default async function handler(req, res) {
  const { userId } = req.query;

  if (req.method === "GET") {
    try {
      // Get user profile from mock data
      const userProfile = mockUserProfiles[userId];
      
      if (!userProfile) {
        // Create a default profile for new users
        const defaultProfile = {
          id: parseInt(userId),
          name: "",
          email: "",
          financialGoal: "",
          timeframe: "",
          currentSavings: "0",
          monthlyIncome: "",
          targetAmount: "10000",
          onboardingComplete: false,
          progress: 0,
          currentBabyStep: 1,
          achievements: [],
          consents: {
            dataProcessing: false,
            profiling: false
          },
          financialProfile: {
            riskTolerance: "moderate",
            investmentExperience: "none",
            debtAmount: 0,
            monthlyExpenses: 0,
            emergencyFundGoal: 0,
            retirementContribution: 0
          },
          lastCompletedAdvisor: null,
          preferredAdvisor: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        return res.status(200).json(defaultProfile);
      }

      return res.status(200).json(userProfile);
    } catch (error) {
      console.error("Error in /api/user-profile/[userId].js:", error.message);
      return res.status(500).json({ 
        error: "Failed to fetch user profile",
        details: error.message 
      });
    }
  } 
  
  else if (req.method === "PUT" || req.method === "POST") {
    try {
      // Update user profile
      const updatedData = req.body;
      const currentProfile = mockUserProfiles[userId] || {};
      
      // Merge the updated data with existing profile
      const updatedProfile = {
        ...currentProfile,
        ...updatedData,
        id: parseInt(userId),
        updatedAt: new Date().toISOString()
      };
      
      // Store the updated profile (in a real app, this would go to a database)
      mockUserProfiles[userId] = updatedProfile;
      
      return res.status(200).json(updatedProfile);
    } catch (error) {
      console.error("Error updating user profile:", error.message);
      return res.status(500).json({ 
        error: "Failed to update user profile",
        details: error.message 
      });
    }
  } 
  
  else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}