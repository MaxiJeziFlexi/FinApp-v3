// pages/api/financial-chat.js

// Financial advisor personalities and expertise
const FINANCIAL_ADVISORS = {
  financial_planner: {
    name: "Emma Financial Planner",
    expertise: ["budgeting", "emergency_funds", "debt_management", "financial_planning"],
    personality: "practical, encouraging, detail-oriented",
    specialization: "Comprehensive financial planning and budgeting strategies"
  },
  investment_advisor: {
    name: "Robert Investment Advisor", 
    expertise: ["investments", "retirement_planning", "portfolio_management", "market_analysis"],
    personality: "analytical, data-driven, forward-thinking",
    specialization: "Investment strategies and long-term wealth building"
  },
  debt_specialist: {
    name: "Maria Debt Specialist",
    expertise: ["debt_elimination", "credit_repair", "debt_consolidation", "payment_strategies"],
    personality: "supportive, motivational, solution-focused",
    specialization: "Debt elimination and credit improvement strategies"
  },
  real_estate_expert: {
    name: "David Real Estate Expert",
    expertise: ["home_buying", "real_estate_investing", "mortgages", "property_analysis"],
    personality: "knowledgeable, market-savvy, strategic",
    specialization: "Real estate transactions and property investment"
  },
  tax_advisor: {
    name: "Lisa Tax Advisor",
    expertise: ["tax_planning", "tax_optimization", "deductions", "tax_strategies"],
    personality: "meticulous, thorough, compliance-focused",
    specialization: "Tax planning and optimization strategies"
  }
};

// Decision tree options for each advisor
const DECISION_TREES = {
  financial_planner: {
    steps: [
      {
        question: "What's your primary financial goal right now?",
        options: [
          { id: "emergency_fund", text: "Build an emergency fund", value: "emergency_fund" },
          { id: "debt_payoff", text: "Pay off debt", value: "debt_payoff" },
          { id: "save_goals", text: "Save for specific goals", value: "save_goals" },
          { id: "budget_control", text: "Get better control of my budget", value: "budget_control" }
        ]
      },
      {
        question: "How much do you currently have in savings?",
        options: [
          { id: "under_500", text: "Less than $500", value: "under_500" },
          { id: "500_2000", text: "$500 - $2,000", value: "500_2000" },
          { id: "2000_5000", text: "$2,000 - $5,000", value: "2000_5000" },
          { id: "over_5000", text: "More than $5,000", value: "over_5000" }
        ]
      },
      {
        question: "What's your biggest financial challenge?",
        options: [
          { id: "overspending", text: "Overspending/No budget", value: "overspending" },
          { id: "low_income", text: "Not earning enough", value: "low_income" },
          { id: "unexpected_expenses", text: "Unexpected expenses", value: "unexpected_expenses" },
          { id: "no_plan", text: "No clear financial plan", value: "no_plan" }
        ]
      }
    ]
  },
  investment_advisor: {
    steps: [
      {
        question: "What's your investment experience level?",
        options: [
          { id: "beginner", text: "Complete beginner", value: "beginner" },
          { id: "some_experience", text: "Some experience", value: "some_experience" },
          { id: "experienced", text: "Experienced investor", value: "experienced" },
          { id: "advanced", text: "Advanced/Professional", value: "advanced" }
        ]
      },
      {
        question: "What's your risk tolerance?",
        options: [
          { id: "conservative", text: "Conservative (low risk)", value: "conservative" },
          { id: "moderate", text: "Moderate (balanced)", value: "moderate" },
          { id: "aggressive", text: "Aggressive (high growth)", value: "aggressive" },
          { id: "very_aggressive", text: "Very aggressive (maximum growth)", value: "very_aggressive" }
        ]
      },
      {
        question: "What's your investment timeline?",
        options: [
          { id: "short_term", text: "Less than 5 years", value: "short_term" },
          { id: "medium_term", text: "5-15 years", value: "medium_term" },
          { id: "long_term", text: "15-30 years", value: "long_term" },
          { id: "retirement", text: "30+ years (retirement)", value: "retirement" }
        ]
      }
    ]
  },
  debt_specialist: {
    steps: [
      {
        question: "What type of debt is your biggest concern?",
        options: [
          { id: "credit_cards", text: "Credit card debt", value: "credit_cards" },
          { id: "student_loans", text: "Student loans", value: "student_loans" },
          { id: "auto_loans", text: "Auto loans", value: "auto_loans" },
          { id: "personal_loans", text: "Personal loans", value: "personal_loans" }
        ]
      },
      {
        question: "How much total debt do you have?",
        options: [
          { id: "under_5k", text: "Less than $5,000", value: "under_5k" },
          { id: "5k_15k", text: "$5,000 - $15,000", value: "5k_15k" },
          { id: "15k_50k", text: "$15,000 - $50,000", value: "15k_50k" },
          { id: "over_50k", text: "More than $50,000", value: "over_50k" }
        ]
      },
      {
        question: "What's your debt elimination strategy preference?",
        options: [
          { id: "snowball", text: "Debt Snowball (smallest first)", value: "snowball" },
          { id: "avalanche", text: "Debt Avalanche (highest interest first)", value: "avalanche" },
          { id: "consolidation", text: "Debt consolidation", value: "consolidation" },
          { id: "not_sure", text: "I'm not sure", value: "not_sure" }
        ]
      }
    ]
  },
  real_estate_expert: {
    steps: [
      {
        question: "What's your real estate goal?",
        options: [
          { id: "first_home", text: "Buy my first home", value: "first_home" },
          { id: "upgrade_home", text: "Upgrade to a bigger home", value: "upgrade_home" },
          { id: "investment_property", text: "Buy investment property", value: "investment_property" },
          { id: "refinance", text: "Refinance current home", value: "refinance" }
        ]
      },
      {
        question: "What's your budget for a home purchase?",
        options: [
          { id: "under_200k", text: "Under $200,000", value: "under_200k" },
          { id: "200k_400k", text: "$200,000 - $400,000", value: "200k_400k" },
          { id: "400k_600k", text: "$400,000 - $600,000", value: "400k_600k" },
          { id: "over_600k", text: "Over $600,000", value: "over_600k" }
        ]
      },
      {
        question: "How much do you have saved for a down payment?",
        options: [
          { id: "under_10k", text: "Less than $10,000", value: "under_10k" },
          { id: "10k_50k", text: "$10,000 - $50,000", value: "10k_50k" },
          { id: "50k_100k", text: "$50,000 - $100,000", value: "50k_100k" },
          { id: "over_100k", text: "More than $100,000", value: "over_100k" }
        ]
      }
    ]
  },
  tax_advisor: {
    steps: [
      {
        question: "What's your primary tax concern?",
        options: [
          { id: "reduce_taxes", text: "Reduce my tax burden", value: "reduce_taxes" },
          { id: "tax_planning", text: "Better tax planning", value: "tax_planning" },
          { id: "deductions", text: "Maximize deductions", value: "deductions" },
          { id: "business_taxes", text: "Business tax strategies", value: "business_taxes" }
        ]
      },
      {
        question: "What's your annual income range?",
        options: [
          { id: "under_50k", text: "Under $50,000", value: "under_50k" },
          { id: "50k_100k", text: "$50,000 - $100,000", value: "50k_100k" },
          { id: "100k_200k", text: "$100,000 - $200,000", value: "100k_200k" },
          { id: "over_200k", text: "Over $200,000", value: "over_200k" }
        ]
      },
      {
        question: "Do you have any of these?",
        options: [
          { id: "business", text: "Own a business", value: "business" },
          { id: "investments", text: "Investment income", value: "investments" },
          { id: "rental_property", text: "Rental property", value: "rental_property" },
          { id: "none", text: "None of the above", value: "none" }
        ]
      }
    ]
  }
};

// Generate personalized recommendations based on advisor and decision path
function generateRecommendations(advisorId, decisionPath, userProfile) {
  const advisor = FINANCIAL_ADVISORS[advisorId];
  const recommendations = {
    advisor: advisor.name,
    summary: "",
    steps: [],
    timeline: "",
    expectedOutcome: "",
    nextActions: []
  };

  switch (advisorId) {
    case 'financial_planner':
      return generateFinancialPlannerRecommendations(decisionPath, userProfile);
    case 'investment_advisor':
      return generateInvestmentAdvisorRecommendations(decisionPath, userProfile);
    case 'debt_specialist':
      return generateDebtSpecialistRecommendations(decisionPath, userProfile);
    case 'real_estate_expert':
      return generateRealEstateExpertRecommendations(decisionPath, userProfile);
    case 'tax_advisor':
      return generateTaxAdvisorRecommendations(decisionPath, userProfile);
    default:
      return generateGenericRecommendations(decisionPath, userProfile);
  }
}

function generateFinancialPlannerRecommendations(decisionPath, userProfile) {
  const primaryGoal = decisionPath.find(d => d.step === 0)?.value;
  const savingsLevel = decisionPath.find(d => d.step === 1)?.value;
  const challenge = decisionPath.find(d => d.step === 2)?.value;

  let summary = `Based on your financial situation, I recommend focusing on ${primaryGoal === 'emergency_fund' ? 'building your emergency fund' : primaryGoal === 'debt_payoff' ? 'paying off your debt' : 'your specific savings goals'}.`;
  
  const steps = [];
  const nextActions = [];

  if (savingsLevel === 'under_500') {
    steps.push("Start with the $1,000 emergency fund as your first priority");
    steps.push("Create a strict budget to find extra money for savings");
    nextActions.push("Save $50-100 per week until you reach $1,000");
  } else if (savingsLevel === '500_2000') {
    steps.push("Complete your $1,000 emergency fund if not already done");
    steps.push("Focus on debt elimination using the debt snowball method");
    nextActions.push("List all debts from smallest to largest balance");
  }

  if (challenge === 'overspending') {
    steps.push("Implement the envelope budgeting method");
    steps.push("Track every expense for 30 days");
    nextActions.push("Download a budgeting app and set up categories");
  }

  return {
    advisor: "Emma Financial Planner",
    summary,
    steps,
    timeline: "3-6 months for initial goals",
    expectedOutcome: "Better financial control and emergency preparedness",
    nextActions
  };
}

function generateInvestmentAdvisorRecommendations(decisionPath, userProfile) {
  const experience = decisionPath.find(d => d.step === 0)?.value;
  const riskTolerance = decisionPath.find(d => d.step === 1)?.value;
  const timeline = decisionPath.find(d => d.step === 2)?.value;

  let summary = `Based on your ${experience} experience level and ${riskTolerance} risk tolerance, I recommend a ${timeline === 'long_term' ? 'growth-focused' : 'balanced'} investment approach.`;
  
  const steps = [];
  const nextActions = [];

  if (experience === 'beginner') {
    steps.push("Start with low-cost index funds");
    steps.push("Open a Roth IRA if eligible");
    steps.push("Invest 15% of income for retirement");
    nextActions.push("Research Vanguard, Fidelity, or Schwab for account opening");
  }

  if (riskTolerance === 'conservative') {
    steps.push("Focus on 60% stocks, 40% bonds allocation");
    steps.push("Consider target-date funds for simplicity");
  } else if (riskTolerance === 'aggressive') {
    steps.push("Consider 80-90% stock allocation");
    steps.push("Include international and small-cap funds");
  }

  return {
    advisor: "Robert Investment Advisor",
    summary,
    steps,
    timeline: timeline === 'long_term' ? "20+ years" : "5-15 years",
    expectedOutcome: "Long-term wealth building and financial independence",
    nextActions
  };
}

function generateDebtSpecialistRecommendations(decisionPath, userProfile) {
  const debtType = decisionPath.find(d => d.step === 0)?.value;
  const debtAmount = decisionPath.find(d => d.step === 1)?.value;
  const strategy = decisionPath.find(d => d.step === 2)?.value;

  let summary = `For your ${debtType} debt totaling ${debtAmount}, I recommend the ${strategy === 'snowball' ? 'debt snowball' : strategy === 'avalanche' ? 'debt avalanche' : 'debt consolidation'} method.`;
  
  const steps = [];
  const nextActions = [];

  if (strategy === 'snowball') {
    steps.push("List all debts from smallest to largest balance");
    steps.push("Pay minimums on all debts except the smallest");
    steps.push("Attack the smallest debt with all extra money");
    nextActions.push("Make a complete debt list with balances and minimum payments");
  } else if (strategy === 'avalanche') {
    steps.push("List all debts from highest to lowest interest rate");
    steps.push("Pay minimums on all debts except highest interest");
    steps.push("Attack the highest interest debt with all extra money");
  }

  if (debtAmount === 'over_50k') {
    steps.push("Consider debt consolidation options");
    steps.push("Look into balance transfer cards for credit card debt");
    nextActions.push("Research debt consolidation loan rates");
  }

  return {
    advisor: "Maria Debt Specialist",
    summary,
    steps,
    timeline: debtAmount === 'under_5k' ? "6-12 months" : debtAmount === 'over_50k' ? "3-5 years" : "1-3 years",
    expectedOutcome: "Complete debt freedom and improved credit score",
    nextActions
  };
}

function generateRealEstateExpertRecommendations(decisionPath, userProfile) {
  const goal = decisionPath.find(d => d.step === 0)?.value;
  const budget = decisionPath.find(d => d.step === 1)?.value;
  const downPayment = decisionPath.find(d => d.step === 2)?.value;

  let summary = `For your goal to ${goal === 'first_home' ? 'buy your first home' : goal} with a budget of ${budget}, here's my recommendation.`;
  
  const steps = [];
  const nextActions = [];

  if (goal === 'first_home') {
    steps.push("Get pre-approved for a mortgage");
    steps.push("Save for 20% down payment to avoid PMI");
    steps.push("Research first-time homebuyer programs");
    nextActions.push("Contact 3 different lenders for rate quotes");
  }

  if (downPayment === 'under_10k' && budget !== 'under_200k') {
    steps.push("Focus on saving more for down payment");
    steps.push("Consider FHA loan with 3.5% down");
    steps.push("Look into down payment assistance programs");
    nextActions.push("Calculate how much you need to save monthly");
  }

  return {
    advisor: "David Real Estate Expert",
    summary,
    steps,
    timeline: downPayment === 'over_100k' ? "3-6 months" : "12-24 months",
    expectedOutcome: "Successful home purchase with favorable terms",
    nextActions
  };
}

function generateTaxAdvisorRecommendations(decisionPath, userProfile) {
  const concern = decisionPath.find(d => d.step === 0)?.value;
  const income = decisionPath.find(d => d.step === 1)?.value;
  const situation = decisionPath.find(d => d.step === 2)?.value;

  let summary = `Based on your ${income} income and focus on ${concern}, here are my tax optimization recommendations.`;
  
  const steps = [];
  const nextActions = [];

  if (concern === 'reduce_taxes') {
    steps.push("Maximize 401(k) contributions");
    steps.push("Consider Roth IRA conversion strategies");
    steps.push("Implement tax-loss harvesting");
    nextActions.push("Review current retirement contribution limits");
  }

  if (situation === 'business') {
    steps.push("Set up business retirement plan (SEP-IRA or Solo 401k)");
    steps.push("Track all business expenses meticulously");
    steps.push("Consider quarterly estimated tax payments");
    nextActions.push("Consult with a CPA for business tax planning");
  }

  return {
    advisor: "Lisa Tax Advisor",
    summary,
    steps,
    timeline: "Ongoing throughout the tax year",
    expectedOutcome: "Reduced tax liability and better tax planning",
    nextActions
  };
}

function generateGenericRecommendations(decisionPath, userProfile) {
  return {
    advisor: "Financial Advisor",
    summary: "Based on your responses, here are some general financial recommendations.",
    steps: [
      "Create a monthly budget",
      "Build an emergency fund",
      "Pay off high-interest debt",
      "Start investing for retirement"
    ],
    timeline: "6-12 months",
    expectedOutcome: "Improved financial stability",
    nextActions: ["Start tracking your expenses", "Open a high-yield savings account"]
  };
}

// Generate personalized chat responses
function generateChatResponse(message, advisorId, userProfile, chatHistory) {
  const advisor = FINANCIAL_ADVISORS[advisorId];
  const userName = userProfile?.name || "there";
  
  // Analyze the message for financial keywords
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('budget') || lowerMessage.includes('spending')) {
    return generateBudgetAdvice(advisorId, userProfile, advisor);
  } else if (lowerMessage.includes('debt') || lowerMessage.includes('loan')) {
    return generateDebtAdvice(advisorId, userProfile, advisor);
  } else if (lowerMessage.includes('invest') || lowerMessage.includes('retirement')) {
    return generateInvestmentAdvice(advisorId, userProfile, advisor);
  } else if (lowerMessage.includes('save') || lowerMessage.includes('emergency')) {
    return generateSavingsAdvice(advisorId, userProfile, advisor);
  } else if (lowerMessage.includes('house') || lowerMessage.includes('home')) {
    return generateRealEstateAdvice(advisorId, userProfile, advisor);
  } else {
    return generateGeneralAdvice(advisorId, userProfile, advisor, message);
  }
}

function generateBudgetAdvice(advisorId, userProfile, advisor) {
  const monthlyIncome = userProfile?.monthlyIncome || "your income";
  const currentSavings = userProfile?.currentSavings || "0";
  
  switch (advisorId) {
    case 'financial_planner':
      return `Hi! As your financial planner, I recommend the 50/30/20 budget rule. With ${monthlyIncome} monthly income, allocate 50% to needs, 30% to wants, and 20% to savings and debt repayment. Since you have $${currentSavings} saved, let's focus on building that emergency fund first!`;
    
    case 'debt_specialist':
      return `Great question about budgeting! Since you're working on debt elimination, I suggest a modified budget: 50% needs, 20% wants, and 30% toward debt payoff. Every extra dollar should go toward your smallest debt first using the debt snowball method.`;
    
    default:
      return `Budgeting is crucial for financial success! Start by tracking all expenses for a month, then create categories for needs, wants, and savings. The key is consistency and regular review.`;
  }
}

function generateDebtAdvice(advisorId, userProfile, advisor) {
  const debtAmount = userProfile?.financialProfile?.debtAmount || 0;
  
  switch (advisorId) {
    case 'debt_specialist':
      return `Let's tackle your debt strategically! With $${debtAmount} in debt, I recommend the debt snowball method: list all debts from smallest to largest, pay minimums on all except the smallest, then attack that smallest debt with everything you've got. The psychological wins will keep you motivated!`;
    
    case 'financial_planner':
      return `Debt elimination should be your priority after building a $1,000 emergency fund. Focus on high-interest debt first, and consider consolidation if it lowers your interest rates. Remember, every payment brings you closer to financial freedom!`;
    
    default:
      return `Debt can feel overwhelming, but you can overcome it! Start by listing all your debts, their balances, and interest rates. Then choose either the snowball (smallest first) or avalanche (highest interest first) method.`;
  }
}

function generateInvestmentAdvice(advisorId, userProfile, advisor) {
  const riskTolerance = userProfile?.financialProfile?.riskTolerance || "moderate";
  const retirementContribution = userProfile?.financialProfile?.retirementContribution || 0;
  
  switch (advisorId) {
    case 'investment_advisor':
      return `Excellent question about investing! With your ${riskTolerance} risk tolerance and current ${(retirementContribution * 100).toFixed(0)}% retirement contribution, I recommend increasing to 15% of income. Start with low-cost index funds - they're perfect for long-term wealth building. Consider a mix of domestic and international funds.`;
    
    case 'financial_planner':
      return `Investing is Baby Step 4! First, make sure you have your emergency fund and are debt-free (except the house). Then invest 15% of income in retirement accounts. Start with your employer's 401(k) match, then Roth IRA, then back to 401(k).`;
    
    default:
      return `Investing is key to building wealth! Start with retirement accounts like 401(k) and IRA. Focus on low-cost index funds and maintain a diversified portfolio based on your risk tolerance and timeline.`;
  }
}

function generateSavingsAdvice(advisorId, userProfile, advisor) {
  const currentSavings = parseInt(userProfile?.currentSavings || "0");
  const monthlyExpenses = userProfile?.financialProfile?.monthlyExpenses || 4000;
  const emergencyGoal = monthlyExpenses * 6;
  
  switch (advisorId) {
    case 'financial_planner':
      return `Great focus on savings! You currently have $${currentSavings} saved. Your first goal should be $1,000 for a starter emergency fund, then work toward $${emergencyGoal.toLocaleString()} (6 months of expenses). Open a high-yield savings account and automate your savings!`;
    
    case 'investment_advisor':
      return `Savings are the foundation before investing! Ensure you have 3-6 months of expenses saved before putting money in the market. With $${monthlyExpenses} monthly expenses, aim for $${emergencyGoal.toLocaleString()} in emergency savings.`;
    
    default:
      return `Building savings is crucial for financial security! Start with a $1,000 emergency fund, then work toward 3-6 months of expenses. Automate your savings and keep emergency funds in a separate, easily accessible account.`;
  }
}

function generateRealEstateAdvice(advisorId, userProfile, advisor) {
  const targetAmount = parseInt(userProfile?.targetAmount || "100000");
  
  switch (advisorId) {
    case 'real_estate_expert':
      return `Real estate can be a great investment! For your $${targetAmount.toLocaleString()} goal, make sure you have 20% down payment plus closing costs. Don't buy a house unless you're debt-free with a full emergency fund. Your mortgage payment should be no more than 25% of take-home pay.`;
    
    case 'financial_planner':
      return `Home buying is Baby Step 6! First, complete steps 1-5: emergency fund, debt freedom, full emergency fund, 15% retirement investing, and kids' college funding. Then you can pay extra on your mortgage to pay it off early.`;
    
    default:
      return `Buying a home is a major financial decision! Ensure you have stable income, good credit, and 20% down payment. Factor in all costs: mortgage, insurance, taxes, maintenance, and utilities.`;
  }
}

function generateGeneralAdvice(advisorId, userProfile, advisor, message) {
  const userName = userProfile?.name || "there";
  
  return `Hi ${userName}! I'm ${advisor.name}, and I specialize in ${advisor.specialization}. I'd be happy to help you with your financial question. Based on your profile, I can see you're working toward ${userProfile?.financialGoal || 'your financial goals'}. What specific aspect would you like to discuss further?`;
}

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { 
        message, 
        advisorId, 
        userProfile, 
        chatHistory = [],
        decisionPath = [],
        action = 'chat' 
      } = req.body;

      if (action === 'get_decision_options') {
        const currentStep = req.body.currentStep || 0;
        const advisorDecisionTree = DECISION_TREES[advisorId];
        
        if (!advisorDecisionTree || currentStep >= advisorDecisionTree.steps.length) {
          return res.status(200).json({
            options: [],
            shouldGenerateRecommendation: true
          });
        }

        const stepData = advisorDecisionTree.steps[currentStep];
        return res.status(200).json({
          question: stepData.question,
          options: stepData.options,
          shouldGenerateRecommendation: false
        });
      }

      if (action === 'generate_recommendation') {
        const recommendations = generateRecommendations(advisorId, decisionPath, userProfile);
        return res.status(200).json(recommendations);
      }

      if (action === 'chat') {
        const response = generateChatResponse(message, advisorId, userProfile, chatHistory);
        
        return res.status(200).json({
          response,
          advisor: FINANCIAL_ADVISORS[advisorId]?.name || "Financial Advisor",
          timestamp: new Date().toISOString()
        });
      }

      return res.status(400).json({ error: "Invalid action specified" });

    } catch (error) {
      console.error("Error in /api/financial-chat.js:", error.message);
      return res.status(500).json({
        error: "Failed to process financial chat request",
        details: error.message
      });
    }
  } else {
    return res.status(405).json({ error: "Method not allowed" });
  }
}