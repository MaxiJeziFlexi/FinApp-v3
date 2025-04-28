import React, { useState, useEffect } from 'react';
import { 
  Button, 
  Dialog,
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Typography,
  Box,
  Grid,
  FormControl,
  FormControlLabel,
  Checkbox,
  TextField,
  CircularProgress,
  Divider,
  Switch,
  IconButton,
  Tooltip,
  MenuItem,
  Select,
  InputLabel,
  Paper
} from '@mui/material';
import { 
  PictureAsPdf, 
  Close,
  InfoOutlined,
  PersonOutline,
  AccessTime,
  AttachMoney,
  Description,
  CheckCircleOutline,
  BarChart,
  Business,
  LocationOn,
  People,
  TrendingUp,
  TrendingDown,
  VerifiedUser,
  Favorite,
  EmojiEvents,
  Group
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Define colors for the PWC-style report
const COLORS = {
  pwc: {
    primary: '#DC6900',    // PWC orange
    secondary: '#2D2E83',  // PWC deep blue
    tertiary: '#FFB600',   // PWC yellow
    lightText: '#474C55',
    darkBackground: '#222222',
    accentLight: '#FFF1E1',
    positive: '#e83b4b',   // For positive growth
    negative: '#e87a1c',   // For negative growth
    neutral: '#888888'     // For neutral results
  },
  jpmorgan: {
    primary: '#0F2B5B',    // JP Morgan deep navy blue
    secondary: '#2A52BE',  // Brighter blue for accents
    tertiary: '#A32020',   // JP Morgan's deep red
    lightText: '#46505A',
    darkBackground: '#0A1930',
    accentLight: '#E6EBF5',
    positive: '#4CAF50',   // For positive growth
    negative: '#F44336',   // For negative growth
    neutral: '#9E9E9E'     // For neutral results
  }
};

/**
 * PWC/JP Morgan Style Financial Report Generator with enhanced data visualization
 */
const ProfessionalFinancialReportGenerator = ({ 
  userProfile, 
  currentAdvisor, 
  recommendation, 
  onReportGenerated,
  financialData,
  clientName,
  companyLogo,
  decisionPath = [] // Decision path from AIChatSection
}) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportOptions, setReportOptions] = useState({
    includeBranding: true,
    includeChart: true,
    includeAdvisorInfo: true,
    includeFullProfile: true,
    includeTimeline: true,
    includeExecutiveSummary: true,
    includeDecisionPath: true,
    reportTitle: 'Financial Advisory Report',
    additionalNotes: '',
    brandStyle: 'pwc', // 'pwc' or 'jpmorgan'
    confidentialityLevel: 'confidential',
    includeAppendix: true,
    compact: false,
    darkMode: true // Default to dark mode for PWC style
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleOptionChange = (event) => {
    setReportOptions({
      ...reportOptions,
      [event.target.name]: event.target.checked
    });
  };

  const handleTextChange = (event) => {
    setReportOptions({
      ...reportOptions,
      [event.target.name]: event.target.value
    });
  };

  const handleSelectChange = (event) => {
    setReportOptions({
      ...reportOptions,
      [event.target.name]: event.target.value
    });
  };

  /**
   * Format decision values into readable text
   */
  const formatDecisionValue = (value) => {
    // Map common decision values to human-readable formats
    const valueMap = {
      // Time horizons
      'short': 'Short term',
      'medium': 'Medium term',
      'long': 'Long term',
      'very_long': 'Very long term',
      
      // Emergency fund amounts
      'three': '3 months of expenses',
      'six': '6 months of expenses',
      'twelve': '12 months of expenses',
      
      // Saving methods
      'automatic': 'Automatic fixed amount',
      'percentage': 'Percentage of income',
      'surplus': 'Budget surplus allocation',
      
      // Debt types
      'credit_card': 'Credit cards & high-interest debt',
      'consumer': 'Consumer loans',
      'mortgage': 'Mortgage',
      'multiple': 'Multiple debt obligations',
      
      // Debt strategies
      'avalanche': 'Debt avalanche (highest interest first)',
      'snowball': 'Debt snowball (smallest balances first)',
      'consolidation': 'Debt consolidation',
      
      // Down payment percentages
      'ten': '10% down payment',
      'twenty': '20% down payment',
      'thirty_plus': '30%+ down payment',
      'full': '100% cash purchase',
      
      // General amount scales
      'small': 'Small amount',
      'medium': 'Medium amount',
      'large': 'Large amount',
      'very_large': 'Very large amount',
      
      // Retirement
      'early': 'Early retirement',
      'standard': 'Standard retirement age',
      'late': 'Delayed retirement',
      'mid': 'Mid-career',
      
      // Retirement vehicles
      'ike_ikze': 'Retirement accounts',
      'investment': 'Personal investments',
      'real_estate': 'Real estate investments',
      'combined': 'Combined strategy'
    };
    
    return valueMap[value] || value;
  };

  /**
   * Get default question text based on step and goal type
   */
  const getDefaultQuestionByStep = (step, goalType) => {
    if (step === 0) {
      return "Financial goal selection";
    }
    
    switch(goalType) {
      case 'emergency_fund':
        if (step === 1) return "Timeframe for emergency fund";
        if (step === 2) return "Emergency fund coverage";
        if (step === 3) return "Savings method";
        break;
      case 'debt_reduction':
        if (step === 1) return "Type of debt";
        if (step === 2) return "Total debt amount";
        if (step === 3) return "Debt reduction strategy";
        break;
      case 'home_purchase':
        if (step === 1) return "Home purchase timeframe";
        if (step === 2) return "Down payment percentage";
        if (step === 3) return "Property budget";
        break;
      case 'retirement':
        if (step === 1) return "Retirement age";
        if (step === 2) return "Current career stage";
        if (step === 3) return "Retirement savings vehicles";
        break;
    }
    
    return `Decision step ${step + 1}`;
  };

  /**
   * Get question text from decision path
   */
  const getQuestionFromDecisionPath = (index) => {
    if (decisionPath && decisionPath.length > index) {
      return decisionPath[index].question || getDefaultQuestionByStep(index, currentAdvisor?.goal);
    }
    return getDefaultQuestionByStep(index, currentAdvisor?.goal);
  };

  /**
   * Calculate financial metrics based on data and user profile
   */
  const calculateFinancialMetrics = (financialData, userProfile) => {
    // If no data, return empty array
    if (!financialData || financialData.length === 0) {
      return [];
    }
    
    // Calculate metrics
    const metrics = [];
    
    try {
      // Calculate average monthly savings
      const amounts = financialData.map(item => item.amount);
      const lastAmount = amounts[amounts.length - 1];
      const firstAmount = amounts[0];
      const totalSavings = lastAmount;
      const savingsGrowth = lastAmount - firstAmount;
      const monthlyAverage = savingsGrowth / (financialData.length - 1);
      
      metrics.push(['Current Total Savings', `${lastAmount.toLocaleString()} ${getCurrencySymbol()}`]);
      metrics.push(['Average Monthly Savings', `${Math.round(monthlyAverage).toLocaleString()} ${getCurrencySymbol()}`]);
      
      // Add monthly income if available
      if (userProfile?.monthlyIncome) {
        // Convert coded income to actual value
        let incomeValue = 0;
        
        switch(userProfile.monthlyIncome) {
          case 'below_2000': incomeValue = 1500; break;
          case '2000_4000': incomeValue = 3000; break;
          case '4000_6000': incomeValue = 5000; break;
          case '6000_8000': incomeValue = 7000; break;
          case 'above_8000': incomeValue = 10000; break;
          default:
            // Try to parse as number if it's a direct value
            incomeValue = parseInt(userProfile.monthlyIncome) || 0;
        }
        
        if (incomeValue > 0) {
          metrics.push(['Monthly Income', `${incomeValue.toLocaleString()} ${getCurrencySymbol()}`]);
          
          // Calculate savings rate
          if (monthlyAverage > 0) {
            const savingsRate = Math.round((monthlyAverage / incomeValue) * 100);
            metrics.push(['Current Savings Rate', `${savingsRate}%`]);
          }
        }
      }
      
      // Add goal progress if target amount exists
      if (userProfile?.targetAmount) {
        const targetAmount = parseInt(userProfile.targetAmount);
        const progressPercent = Math.round((lastAmount / targetAmount) * 100);
        metrics.push(['Goal Progress', `${progressPercent}%`]);
        
        // Calculate estimated completion time
        if (monthlyAverage > 0) {
          const remainingAmount = targetAmount - lastAmount;
          const remainingMonths = Math.ceil(remainingAmount / monthlyAverage);
          
          if (remainingMonths > 0) {
            const currentDate = new Date();
            const targetDate = new Date(currentDate.setMonth(currentDate.getMonth() + remainingMonths));
            const formattedDate = targetDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
            
            metrics.push(['Estimated Completion Date', formattedDate]);
          }
        }
      }
      
      // Add growth rate
      const growthRate = financialData.length > 1 ? 
        ((lastAmount / firstAmount) - 1) * 100 : 0;
      
      metrics.push(['Growth Rate', `${Math.round(growthRate)}%`]);
      
    } catch (error) {
      console.error('Error calculating metrics:', error);
    }
    
    return metrics;
  };

  /**
   * Get color for growth percentage display
   */
  const getGrowthColor = (value, colorScheme) => {
    if (value > 0) return colorScheme.positive;
    if (value < 0) return colorScheme.negative;
    return colorScheme.neutral;
  };

  /**
   * Extract key points from a text summary
   */
  const extractKeyPoints = (summary) => {
    if (!summary) return [];
    
    // Split by sentences and filter out short ones
    const sentences = summary.split(/[.!?]+/).filter(s => s.trim().length > 20);
    
    if (sentences.length <= 2) return sentences;
    
    // Return the first 2-3 sentences as key points
    return sentences.slice(0, Math.min(3, sentences.length));
  };

  /**
   * Generate analysis summary based on data and metrics
   */
  const generateAnalysisSummary = (financialData, userProfile, metrics) => {
    try {
      // Handle case with no data
      if (!financialData || financialData.length === 0) {
        return "Insufficient data available to perform detailed financial analysis. We recommend establishing regular savings tracking to enable more comprehensive insights.";
      }
      
      // Get relevant metrics for summary
      const targetAmount = userProfile?.targetAmount ? parseInt(userProfile.targetAmount) : 0;
      const lastAmount = financialData[financialData.length - 1].amount;
      const goalType = userProfile?.financialGoal || currentAdvisor?.goal || "savings";
      
      // Find monthly average savings from metrics
      let monthlyAverage = 0;
      let progressPercent = 0;
      let monthsRemaining = 0;
      let incomeValue = 0;
      let savingsRate = 0;
      
      for (const metric of metrics) {
        if (metric[0] === 'Average Monthly Savings') {
          monthlyAverage = parseInt(metric[1].replace(/[^0-9]/g, ''));
        } else if (metric[0] === 'Goal Progress') {
          progressPercent = parseInt(metric[1].replace('%', ''));
        } else if (metric[0] === 'Estimated Completion Date') {
          // Extract months remaining from completion date
          const completionDate = new Date(metric[1]);
          const currentDate = new Date();
          monthsRemaining = (completionDate.getFullYear() - currentDate.getFullYear()) * 12 + 
                            completionDate.getMonth() - currentDate.getMonth();
        } else if (metric[0] === 'Monthly Income') {
          incomeValue = parseInt(metric[1].replace(/[^0-9]/g, ''));
        } else if (metric[0] === 'Current Savings Rate') {
          savingsRate = parseInt(metric[1].replace('%', ''));
        }
      }
      
      // Generate summary based on goal type
      let summary = "";
      
      // Add goal-specific analysis
      if (goalType === "emergency_fund") {
        summary = `Based on our analysis of your financial data, your emergency fund building strategy ${progressPercent >= 50 ? 'is progressing well' : 'requires attention'}. `;
        
        if (progressPercent < 30) {
          summary += `With only ${progressPercent}% of your target emergency fund established, your financial resilience against unexpected expenses is currently limited. `;
        } else if (progressPercent < 60) {
          summary += `Having achieved ${progressPercent}% of your target emergency fund, you have established a foundation of financial security, but remain vulnerable to extended periods of financial hardship. `;
        } else if (progressPercent < 100) {
          summary += `With ${progressPercent}% of your target emergency fund in place, you have established substantial financial security against most common emergencies. `;
        } else {
          summary += `Having fully funded your emergency fund, you have established an excellent foundation for financial security. `;
        }
        
        // Add savings rate analysis if available
        if (savingsRate > 0) {
          const recommendedRate = progressPercent < 50 ? 20 : 15;
          if (savingsRate < recommendedRate) {
            summary += `Your current savings rate of ${savingsRate}% is below the recommended ${recommendedRate}% for efficient emergency fund building. `;
          } else {
            summary += `Your current savings rate of ${savingsRate}% is appropriate for your emergency fund objectives. `;
          }
        }
      } 
      else if (goalType === "debt_reduction") {
        summary = `Our analysis of your debt reduction strategy indicates ${progressPercent >= 40 ? 'steady progress' : 'opportunities for optimization'}. `;
        
        if (incomeValue > 0 && lastAmount > 0) {
          const debtToIncomeRatio = Math.round((lastAmount / (incomeValue * 12)) * 100);
          
          if (debtToIncomeRatio > 40) {
            summary += `Your debt-to-annual-income ratio of approximately ${debtToIncomeRatio}% is above recommended levels, suggesting a focus on accelerated debt reduction would be beneficial. `;
          } else if (debtToIncomeRatio > 20) {
            summary += `Your debt-to-annual-income ratio of approximately ${debtToIncomeRatio}% is within manageable levels, though continued focus on debt reduction is recommended. `;
          } else {
            summary += `Your debt-to-annual-income ratio of approximately ${debtToIncomeRatio}% is favorable, indicating your debt level is well controlled relative to income. `;
          }
        }
        
        if (monthlyAverage > 0) {
          summary += `With a monthly debt reduction rate of ${monthlyAverage.toLocaleString()} ${getCurrencySymbol()}, your projected debt-free date aligns with strategic financial planning objectives. `;
        }
      }
      else if (goalType === "home_purchase") {
        summary = `Analysis of your home purchase savings strategy indicates ${progressPercent >= 30 ? 'positive momentum' : 'potential for enhancement'}. `;
        
        if (progressPercent < 25) {
          summary += `With ${progressPercent}% of your target down payment accumulated, your home purchase timeline may need recalibration based on current savings trajectory. `;
        } else if (progressPercent < 50) {
          summary += `Having accumulated ${progressPercent}% of your target down payment, you are making measurable progress toward your home purchase goal. `;
        } else if (progressPercent < 80) {
          summary += `With ${progressPercent}% of your target down payment saved, you are approaching a position where pre-approval and active property searching may be appropriate. `;
        } else {
          summary += `Having accumulated ${progressPercent}% of your target down payment, you are well-positioned to proceed with formal mortgage applications and property selection. `;
        }
        
        // Add market timing consideration
        summary += `Current market conditions should be evaluated alongside your savings progress to determine optimal timing for property acquisition. `;
      }
      else if (goalType === "retirement") {
        summary = `Our analysis of your retirement savings strategy indicates ${progressPercent >= 20 ? 'appropriate long-term planning' : 'opportunities for enhanced preparation'}. `;
        
        // Add age-appropriate analysis if available from user profile or decisionPath
        let ageGroup = "mid"; // Default to mid-career
        
        if (decisionPath && decisionPath.length > 0) {
          // Try to find age group from decision path
          const ageDecision = decisionPath.find(d => d.selection === "early" || d.selection === "mid" || d.selection === "late");
          if (ageDecision) {
            ageGroup = ageDecision.selection;
          }
        }
        
        if (ageGroup === "early") {
          summary += `As you are in the early stage of your career, your current savings rate of ${savingsRate || "unspecified"}% ${savingsRate >= 15 ? 'adequately leverages the advantage of long-term compounding' : 'could be increased to better leverage long-term compounding'}. `;
        } else if (ageGroup === "mid") {
          summary += `At the mid-career stage, your current savings rate of ${savingsRate || "unspecified"}% ${savingsRate >= 20 ? 'demonstrates appropriate retirement planning discipline' : 'should be increased to accelerate retirement fund accumulation'}. `;
        } else { // late
          summary += `In the later stage of your career, your current savings rate of ${savingsRate || "unspecified"}% ${savingsRate >= 25 ? 'reflects appropriate prioritization of retirement preparation' : 'requires significant enhancement to meet retirement objectives'}. `;
        }
        
        summary += `Continued diversification and regular portfolio rebalancing are recommended to optimize risk-adjusted returns aligned with your retirement horizon. `;
      }
      else {
        // Generic analysis for other goal types or no specific goal
        if (targetAmount > 0 && progressPercent > 0) {
          // For goals with progress
          if (progressPercent < 25) {
            summary = `Financial analysis indicates you're in the early stages of your savings journey, having achieved ${progressPercent}% of your financial goal. `;
          } else if (progressPercent < 50) {
            summary = `You have made good initial progress toward your financial goal, having achieved ${progressPercent}% of your target. `;
          } else if (progressPercent < 75) {
            summary = `You have made significant progress toward your financial goal, having achieved ${progressPercent}% of your target. `;
          } else if (progressPercent < 100) {
            summary = `You are approaching your financial goal, having achieved ${progressPercent}% of your target. `;
          } else {
            summary = `Congratulations, you have reached or exceeded your financial goal! `;
          }
          
          // Add information about monthly savings
          if (monthlyAverage > 0) {
            summary += `With average monthly savings of ${monthlyAverage.toLocaleString()} ${getCurrencySymbol()}, `;
            
            if (monthsRemaining > 0) {
              if (monthsRemaining <= 3) {
                summary += `you are on track to reach your target in the very near future. `;
              } else if (monthsRemaining <= 12) {
                summary += `you are on track to reach your target within a year. `;
              } else {
                const yearsRemaining = Math.round(monthsRemaining / 12 * 10) / 10;
                summary += `you are projected to reach your target in approximately ${yearsRemaining} years. `;
              }
            } else if (progressPercent < 100) {
              summary += `your savings trajectory is positive, though the completion timeline may need reassessment. `;
            }
          }
        } else {
          // Generic analysis without specific goal tracking
          if (financialData.length > 3) {
            const firstAmount = financialData[0].amount;
            const growth = lastAmount - firstAmount;
            const growthPercent = Math.round((growth / firstAmount) * 100);
            
            if (growthPercent > 0) {
              summary = `Analysis of your financial data shows a positive savings trend with ${growthPercent}% growth over the tracked period. `;
              
              if (monthlyAverage > 0) {
                summary += `Your average monthly savings of ${monthlyAverage.toLocaleString()} ${getCurrencySymbol()} demonstrates consistent financial discipline. `;
              }
            } else {
              summary = `Analysis of your financial data indicates challenges in savings growth over the tracked period. We recommend a comprehensive review of your income sources, expenses, and potential opportunities for expense optimization. `;
            }
          } else {
            summary = `Limited historical data is available for comprehensive analysis. We recommend continued tracking of your financial progress to enable more detailed insights and personalized recommendations in future assessments. `;
          }
        }
      }
      
      // Add final recommendations based on overall progress
      if (progressPercent < 50 && monthlyAverage > 0) {
        const suggestedIncrease = Math.round(monthlyAverage * 0.25);
        summary += `Consider increasing your monthly savings by approximately ${suggestedIncrease.toLocaleString()} ${getCurrencySymbol()} to accelerate progress toward your goal.`;
      } else if (progressPercent >= 100) {
        summary += `Now may be an appropriate time to reassess your financial priorities and consider establishing new financial objectives.`;
      } else if (summary.length > 0) {
        summary += `Maintaining your current savings rate should enable you to achieve your financial objective within the projected timeframe.`;
      }
      
      return summary;
    } catch (error) {
      console.error('Error generating analysis summary:', error);
      return "Analysis of your financial situation indicates opportunities for optimization. Please consult with your financial advisor for a detailed discussion of strategies tailored to your specific circumstances.";
    }
  };

  /**
   * Generate recommendations based on user profile and advisor
   */
  const determineRiskApproach = (userProfile, advisor) => {
    // Determine risk profile based on goal type and user inputs
    let profile = 'moderate';
    let emphasis = 'balanced growth and capital preservation';
    let needs = 'long-term growth';
    
    // Get financial goal type
    const goalType = advisor?.goal || userProfile?.financialGoal || 'emergency_fund';
    
    // Get timeframe if available
    const timeframe = userProfile?.timeframe || 'medium';
    
    // Adjust risk profile based on goal type
    if (goalType === 'emergency_fund') {
      profile = 'conservative';
      emphasis = 'capital preservation and liquidity';
      needs = 'immediate access to funds in case of emergencies';
    } else if (goalType === 'debt_reduction') {
      profile = 'conservative to moderate';
      emphasis = 'stable cash flow for consistent debt servicing';
      needs = 'debt reduction and interest minimization';
    } else if (goalType === 'home_purchase') {
      // Adjust based on timeframe
      if (timeframe === 'short') {
        profile = 'conservative';
        emphasis = 'capital preservation for near-term use';
        needs = 'liquidity for down payment in the near future';
      } else if (timeframe === 'medium') {
        profile = 'moderate';
        emphasis = 'balanced growth with moderate risk';
        needs = 'capital accumulation for medium-term home purchase';
      } else {
        profile = 'moderate to growth-oriented';
        emphasis = 'long-term appreciation with prudent risk management';
        needs = 'substantial capital accumulation for future home purchase';
      }
    } else if (goalType === 'retirement') {
      // For retirement, try to find career stage from decision path if available
      let careerStage = 'mid'; // Default
      
      if (decisionPath && decisionPath.length > 0) {
        const stageDecision = decisionPath.find(d => d.selection === "early" || d.selection === "mid" || d.selection === "late");
        if (stageDecision) {
          careerStage = stageDecision.selection;
        }
      }
      
      if (careerStage === 'early') {
        profile = 'growth-oriented';
        emphasis = 'long-term capital appreciation with higher equity allocation';
        needs = 'retirement savings growth over an extended time horizon';
      } else if (careerStage === 'mid') {
        profile = 'moderate to growth-oriented';
        emphasis = 'balanced accumulation with strategic risk management';
        needs = 'retirement savings growth with increasing focus on preservation';
      } else {
        profile = 'moderate to conservative';
        emphasis = 'preservation with modest growth opportunities';
        needs = 'retirement income security with inflation protection';
      }
    }
    
    return { profile, emphasis, needs };
  };

  /**
   * Generate rationale for recommendation based on decisions
   */
  const generateRationale = (step, userProfile, advisor) => {
    // Default rationale
    return "This recommendation is aligned with your financial goals and risk profile, providing an optimal balance between capital preservation and growth potential based on your timeline and objectives.";
  };

  /**
   * Generate default recommendations based on financial goal and decision path
   */
  const generateDefaultRecommendations = (userProfile, advisor) => {
    const recommendations = [];
    const goalType = advisor?.goal || userProfile?.financialGoal || 'emergency_fund';
    const timeframe = userProfile?.timeframe || 'medium';
    
    // Extract relevant decision information from decision path if available
    let specificOptions = {};
    
    if (decisionPath && decisionPath.length > 0) {
      // Try to extract specific choices from the decision path
      decisionPath.forEach(decision => {
        if (decision.selection) {
          specificOptions[decision.selection] = true;
        }
      });
    }
    
    // Generate primary recommendation based on goal type
    if (goalType === 'emergency_fund') {
      // Determine amount based on decision path or default
      let months = specificOptions.three ? '3' : 
                  specificOptions.six ? '6' : 
                  specificOptions.twelve ? '12' : '3-6';
      
      // Determine savings method
      let methodText = specificOptions.automatic ? 'automated transfers' : 
                      specificOptions.percentage ? 'percentage-based allocation' : 
                      specificOptions.surplus ? 'budget surplus allocation' : 
                      'systematic savings';
      
      recommendations.push({
        title: `Establish ${months}-Month Emergency Reserve`,
        details: `Create a dedicated high-yield savings account specifically for your emergency fund, separate from day-to-day banking accounts. Target an emergency fund of ${months} months of essential expenses using ${methodText}.`,
        rationale: `A dedicated account reduces the temptation to use these funds for non-emergencies and provides immediate access to capital when needed. High-yield savings accounts optimize return while maintaining liquidity.`
      });
      
      // Add second recommendation based on timeframe
      if (timeframe === 'short') {
        recommendations.push({
          title: 'Accelerated Emergency Fund Strategy',
          details: 'Temporarily increase monthly savings allocation to 20-30% of income to rapidly establish your emergency reserve, then reallocate to other financial goals once completed.',
          rationale: 'An accelerated approach ensures financial security is established quickly, creating a foundation for pursuing other objectives with reduced financial vulnerability.'
        });
      } else {
        recommendations.push({
          title: 'Balanced Emergency Fund Development',
          details: 'Allocate 10-15% of monthly income to emergency fund while simultaneously pursuing other financial objectives at a measured pace.',
          rationale: 'This balanced approach ensures steady progress toward building financial security while allowing continued advancement of other important financial goals.'
        });
      }
    } 
    else if (goalType === 'debt_reduction') {
      // Determine debt type based on decision path or default
      let debtType = specificOptions.credit_card ? 'high-interest debt' : 
                    specificOptions.consumer ? 'consumer loans' : 
                    specificOptions.mortgage ? 'mortgage debt' : 
                    specificOptions.multiple ? 'multiple debt obligations' : 
                    'outstanding debt';
      
      // Determine strategy based on decision path
      let strategyText = specificOptions.avalanche ? 'Debt Avalanche (highest interest first)' : 
                        specificOptions.snowball ? 'Debt Snowball (smallest balances first)' : 
                        specificOptions.consolidation ? 'Debt Consolidation' : 
                        'optimal debt reduction';
      
      recommendations.push({
        title: `Strategic ${debtType.charAt(0).toUpperCase() + debtType.slice(1)} Reduction Plan`,
        details: `Implement a structured ${strategyText} approach to systematically reduce your ${debtType}, accelerating financial freedom and minimizing interest costs.`,
        rationale: `This structured approach optimizes debt reduction efficiency by ${specificOptions.avalanche ? 'minimizing total interest paid' : specificOptions.snowball ? 'building psychological momentum through quick wins' : specificOptions.consolidation ? 'simplifying multiple payments and potentially reducing interest rates' : 'aligning with your specific debt profile and cash flow capabilities'}.`
      });
      
      // Add budget optimization recommendation
      recommendations.push({
        title: 'Cash Flow Optimization for Debt Reduction',
        details: 'Restructure monthly budget to allocate 15-20% of net income (or more if feasible) specifically to accelerated debt payments beyond minimum requirements.',
        rationale: 'Dedicated debt reduction allocation creates consistent progress and significantly reduces total interest paid over the life of the debt while maintaining necessary liquidity for current expenses.'
      });
    }
    else if (goalType === 'home_purchase') {
      // Determine down payment percentage based on decision path
      let downPayment = specificOptions.ten ? '10%' : 
                       specificOptions.twenty ? '20%' : 
                       specificOptions.thirty_plus ? '30% or more' : 
                       specificOptions.full ? '100% (cash purchase)' : 
                       '20%';
      
      // Determine timeframe-specific strategy
      let timeframeStrategy = timeframe === 'short' ? 'high-yield savings vehicles' : 
                             timeframe === 'medium' ? 'balanced investment portfolio' : 
                             'diversified growth-oriented investment strategy';
      
      recommendations.push({
        title: `${downPayment} Down Payment Accumulation Strategy`,
        details: `Establish a dedicated home purchase fund utilizing ${timeframeStrategy}, with systematic monthly contributions of 15-25% of income to achieve your target down payment within your desired timeframe.`,
        rationale: `A ${downPayment} down payment ${downPayment === '20%' ? 'eliminates private mortgage insurance requirements' : downPayment === '10%' ? 'minimizes initial capital requirements while maintaining reasonable mortgage terms' : downPayment === '30% or more' ? 'reduces overall mortgage costs and improves loan terms' : 'eliminates mortgage interest entirely'}, optimizing long-term homeownership economics.`
      });
      
      // Add property market research recommendation
      recommendations.push({
        title: 'Strategic Property Market Analysis',
        details: 'Begin systematic research of target real estate markets, including price trends, neighborhood development, and property appreciation rates to identify optimal timing and location for purchase.',
        rationale: 'Comprehensive market analysis allows for identification of value opportunities and potential appreciation corridors, maximizing return on real estate investment while meeting primary housing objectives.'
      });
    }
    else if (goalType === 'retirement') {
      // Determine retirement age approach based on decision path
      let retirementType = specificOptions.early ? 'early retirement' : 
                          specificOptions.standard ? 'traditional retirement' : 
                          specificOptions.late ? 'delayed retirement' : 
                          'retirement';
      
      // Determine career stage
      let careerStage = specificOptions.early ? 'early-career' : 
                       specificOptions.mid ? 'mid-career' : 
                       specificOptions.late ? 'late-career' : 
                       'current career';
      
      // Determine vehicle based on decision path
      let vehicleStrategy = specificOptions.ike_ikze ? 'tax-advantaged retirement accounts' : 
                           specificOptions.investment ? 'diversified investment portfolio' : 
                           specificOptions.real_estate ? 'income-producing real estate' : 
                           specificOptions.combined ? 'multi-asset retirement strategy' : 
                           'comprehensive retirement vehicles';
      
      recommendations.push({
        title: `Optimized ${retirementType.charAt(0).toUpperCase() + retirementType.slice(1)} Portfolio Construction`,
        details: `Implement a strategically diversified ${careerStage} retirement portfolio utilizing ${vehicleStrategy} with systematic contribution strategy aligned with your retirement timeline and objectives.`,
        rationale: `This approach leverages your ${careerStage} position to optimize the balance between growth potential and risk management, creating a resilient retirement funding strategy appropriate for your time horizon.`
      });
      
      // Add age-appropriate secondary recommendation
      if (specificOptions.early) {
        recommendations.push({
          title: 'Growth-Oriented Asset Allocation',
          details: 'Establish retirement portfolio with 80-90% allocation to diversified equity investments to maximize long-term growth potential over your extended investment horizon.',
          rationale: 'Your long time horizon enables higher equity allocation to capture maximum growth potential and overcome short-term market volatility through time diversification.'
        });
      } else if (specificOptions.mid) {
        recommendations.push({
          title: 'Balanced Growth and Protection Strategy',
          details: 'Implement retirement portfolio with 60-70% diversified equity allocation balanced with 30-40% fixed income and alternative assets to provide growth with increasing capital protection.',
          rationale: 'This balanced approach provides continued growth opportunity while beginning to protect accumulated retirement assets as your time horizon moderates.'
        });
      } else {
        recommendations.push({
          title: 'Capital Preservation and Income Strategy',
          details: 'Transition retirement portfolio to 40-50% equity, 40-50% fixed income, and 10-20% alternatives to protect accumulated assets while maintaining inflation-adjusted growth potential.',
          rationale: 'This conservative allocation prioritizes capital preservation while providing sufficient growth potential to maintain purchasing power throughout retirement.'
        });
      }
    }
    else {
      // Generic recommendations for other goals
      recommendations.push({
        title: 'Structured Savings Plan Implementation',
        details: `Establish automated transfers to designated savings and investment accounts aligned with your priority financial goals, calibrated to achieve your target of ${userProfile?.targetAmount ? parseInt(userProfile.targetAmount).toLocaleString() + ' ' + getCurrencySymbol() : 'your savings goal'}.`,
        rationale: 'Automation eliminates decision fatigue and ensures consistent progress toward financial goals regardless of market conditions or other variables. This approach leverages behavioral finance principles to optimize long-term outcomes.'
      });
      
      // Add a second recommendation based on timeframe
      if (timeframe === 'short') {
        recommendations.push({
          title: 'Short-Term Liquidity Optimization',
          details: 'Structure your savings using a tiered approach with laddered certificates of deposit and high-yield savings accounts to maximize returns while maintaining appropriate liquidity for your short-term goals.',
          rationale: 'This strategy balances the need for capital preservation and access with modest yield enhancement, appropriate for your timeline of less than one year. The laddered approach provides liquidity at regular intervals.'
        });
      } else if (timeframe === 'medium') {
        recommendations.push({
          title: 'Mid-Term Investment Strategy',
          details: 'Implement a balanced investment approach with 40% in quality fixed income, 50% in diversified equities, and 10% in cash equivalents to provide a combination of growth and stability over your 1-5 year time horizon.',
          rationale: 'This allocation balances moderate growth potential with sufficient stability to accommodate your medium-term time horizon, reducing the impact of market volatility while still providing returns above inflation.'
        });
      } else {
        recommendations.push({
          title: 'Long-Term Growth Optimization',
          details: 'Maximize long-term growth potential with a strategic asset allocation weighted toward equities (75%) and complemented by fixed income (20%) and alternative investments (5%).',
          rationale: 'Your extended time horizon of over 5 years allows for a higher equity allocation to capture market growth while providing sufficient time to weather market cycles and volatility. This approach prioritizes long-term capital appreciation.'
        });
      }
    }
    
  // Add a third general recommendation
recommendations.push({
  title: 'Comprehensive Financial Protection Strategy',
  details: 'Implement appropriate insurance coverage (health, life, disability, property) and legal protections (will, power of attorney) to safeguard financial progress and protect against unforeseen risks.',
  rationale: 'A robust protection strategy secures your financial foundation against catastrophic risks, ensuring that progress toward financial goals continues uninterrupted despite life\'s uncertainties.'
});

return recommendations;
};

  /**
   * Extract recommendation title from step text
   */
  const getRecommendationTitle = (step) => {
    // Simple extraction of first sentence or phrase as title
    const title = step.split('.')[0];
    return title.length > 50 ? title.substring(0, 50) + '...' : title;
  };

  /**
   * Extract recommendation details from step text
   */
  const getRecommendationDetails = (step) => {
    // Return full step or extract details after first sentence
    if (step.indexOf('.') === -1) return step;
    return step.substring(step.indexOf('.') + 1).trim();
  };

  /**
   * Generate implementation timeline based on recommendations
   */
  const generateTimeline = (recommendationSteps, userProfile) => {
    const timeline = [];
    
    // Get goal type and timeframe
    const goalType = userProfile?.financialGoal || 'general';
    const timeframe = userProfile?.timeframe || 'medium';
    
    // Adjust timeline phases based on goal type and timeframe
    if (goalType === 'emergency_fund') {
      // Emergency fund typically has shorter implementation timeline
      timeline.push({
        title: 'Budget Analysis & Fund Setup',
        timeframe: 'Immediate (0-2 weeks)',
        description: recommendationSteps[0] || 'Analyze current expenses to determine target emergency fund amount and establish dedicated savings account.'
      });
      
      timeline.push({
        title: 'Initial Funding & Automation',
        timeframe: '2-4 weeks',
        description: recommendationSteps[1] || 'Make initial deposit and establish automated savings transfers to consistently build emergency fund.'
      });
      
      timeline.push({
        title: 'Review & Optimization',
        timeframe: '3 months',
        description: 'Evaluate progress, adjust savings rate if necessary, and ensure fund is appropriately accessible while maximizing yield.'
      });
      
      timeline.push({
        title: 'Completion & Maintenance',
        timeframe: timeframe === 'short' ? '6 months' : timeframe === 'medium' ? '12 months' : '18 months',
        description: 'Complete funding of emergency reserve and establish protocol for fund replenishment following any withdrawals.'
      });
    } 
    else if (goalType === 'debt_reduction') {
      timeline.push({
        title: 'Debt Analysis & Strategy Selection',
        timeframe: 'Immediate (0-2 weeks)',
        description: recommendationSteps[0] || 'Catalog all outstanding debts with balances, interest rates, and minimum payments to establish complete picture of obligations.'
      });
      
      timeline.push({
        title: 'Budget Restructuring',
        timeframe: '2-4 weeks',
        description: recommendationSteps[1] || 'Reorganize monthly budget to maximize debt servicing capacity while maintaining essential expenses.'
      });
      
      timeline.push({
        title: 'Implementation of Reduction Strategy',
        timeframe: '1-3 months',
        description: recommendationSteps[2] || 'Begin executing selected debt reduction approach (snowball/avalanche/consolidation) with consistent payment discipline.'
      });
      
      timeline.push({
        title: 'Monitoring & Adaptation',
        timeframe: 'Ongoing (Quarterly Review)',
        description: 'Regularly assess progress, adjust strategy as needed, and maintain focus on debt elimination targets.'
      });
    }
    else if (goalType === 'home_purchase') {
      // Home purchase timeline depends heavily on timeframe
      const timeframeMap = {
        'short': {
          phase2: '3-6 months',
          phase3: '6-9 months',
          phase4: '9-12 months'
        },
        'medium': {
          phase2: '6-12 months',
          phase3: '1-2 years',
          phase4: '2-3 years'
        },
        'long': {
          phase2: '1-2 years',
          phase3: '3-4 years',
          phase4: '4-5 years'
        }
      };
      
      const timeframeDurations = timeframeMap[timeframe] || timeframeMap['medium'];
      
      timeline.push({
        title: 'Financial Preparation & Savings Structure',
        timeframe: 'Immediate (0-4 weeks)',
        description: recommendationSteps[0] || 'Establish dedicated savings vehicle for down payment accumulation and automate regular contributions.'
      });
      
      timeline.push({
        title: 'Credit Optimization & Market Research',
        timeframe: timeframeDurations.phase2,
        description: recommendationSteps[1] || 'Enhance credit profile through strategic debt management and begin researching target housing markets.'
      });
      
      timeline.push({
        title: 'Pre-Approval & Down Payment Acceleration',
        timeframe: timeframeDurations.phase3,
        description: recommendationSteps[2] || 'Secure mortgage pre-approval and intensify savings rate as target date approaches.'
      });
      
      timeline.push({
        title: 'Property Selection & Purchase Execution',
        timeframe: timeframeDurations.phase4,
        description: recommendationSteps[3] || 'Engage realtor, identify suitable properties, and execute purchase process with optimal financing.'
      });
    }
    else if (goalType === 'retirement') {
      // Find career stage from decision path if available
      let careerStage = 'mid'; // Default
      
      if (decisionPath && decisionPath.length > 0) {
        const stageDecision = decisionPath.find(d => d.selection === "early" || d.selection === "mid" || d.selection === "late");
        if (stageDecision) {
          careerStage = stageDecision.selection;
        }
      }
      
      timeline.push({
        title: 'Retirement Analysis & Vehicle Selection',
        timeframe: 'Immediate (0-4 weeks)',
        description: recommendationSteps[0] || 'Assess retirement income needs and establish appropriate retirement savings vehicles (401k, IRA, etc.).'
      });
      
      if (careerStage === 'early') {
        timeline.push({
          title: 'Portfolio Construction & Automation',
          timeframe: '1-2 months',
          description: recommendationSteps[1] || 'Implement growth-oriented investment allocation aligned with long-term horizon and establish automated contribution schedule.'
        });
        
        timeline.push({
          title: 'Income Optimization & Contribution Scaling',
          timeframe: '6-12 months',
          description: recommendationSteps[2] || 'Maximize tax-advantaged contribution opportunities and establish protocol for scaling contributions with income growth.'
        });
        
        timeline.push({
          title: 'Long-term Strategy Review',
          timeframe: 'Annual',
          description: 'Conduct comprehensive portfolio review, rebalance as needed, and adjust strategy based on changing circumstances and market conditions.'
        });
      }
      else if (careerStage === 'mid') {
        timeline.push({
          title: 'Portfolio Optimization & Contribution Acceleration',
          timeframe: '1-2 months',
          description: recommendationSteps[1] || 'Refine investment allocation for balanced growth and protection, while maximizing contribution levels.'
        });
        
        timeline.push({
          title: 'Retirement Gap Analysis',
          timeframe: '3-6 months',
          description: recommendationSteps[2] || 'Conduct detailed projection of retirement needs vs. current trajectory and implement adjustments to address any shortfalls.'
        });
        
        timeline.push({
          title: 'Strategy Refinement & Protection',
          timeframe: 'Biannual',
          description: 'Regularly review retirement strategy, adjust asset allocation to reflect changing time horizon, and implement wealth protection measures.'
        });
      }
      else { // late career
        timeline.push({
          title: 'Portfolio Preservation & Income Planning',
          timeframe: '1-2 months',
          description: recommendationSteps[1] || 'Shift investment strategy toward capital preservation and begin structuring portfolio for retirement income distribution.'
        });
        
        timeline.push({
          title: 'Distribution Strategy Development',
          timeframe: '3-6 months',
          description: recommendationSteps[2] || 'Establish optimal withdrawal sequence across accounts, tax planning, and contingency reserves.'
        });
        
        timeline.push({
          title: 'Retirement Transition Planning',
          timeframe: '12-24 months pre-retirement',
          description: 'Finalize retirement budget, healthcare planning, and systematic conversion to income-generating investment approach.'
        });
      }
    }
    else {
      // Generic timeline for other goals
      timeline.push({
        title: 'Foundation Building',
        timeframe: 'Immediate (0-30 days)',
        description: recommendationSteps[0] || 'Establish core financial structure and implement initial recommendations to build foundation for financial plan.'
      });
      
      timeline.push({
        title: 'Strategy Activation',
        timeframe: '1-3 months',
        description: recommendationSteps[1] || 'Activate core investment and savings strategies and establish necessary accounts and automated systems.'
      });
      
      timeline.push({
        title: 'Optimization Phase',
        timeframe: '3-6 months',
        description: 'Review implementation progress, make necessary adjustments, and optimize strategy based on changing conditions and new opportunities.'
      });
      
      timeline.push({
        title: 'Long-term Monitoring',
        timeframe: 'Ongoing (Quarterly Review)',
        description: 'Regularly assess progress toward financial objectives, adjust as needed, and recalibrate strategy to align with evolving goals and market conditions.'
      });
    }
    
    return timeline;
  };

  /**
   * Get currency symbol based on locale
   */
  const getCurrencySymbol = () => {
    return '$'; // Default to USD
  };

  /**
   * Generate and download a financial report as PDF with professional styling
   */
  const generatePDF = () => {
    setLoading(true);
    
    // Use timeout to allow UI to update before processing
    setTimeout(() => {
      try {
        const doc = new jsPDF();
        
        // Get selected color scheme
        const colorScheme = reportOptions.brandStyle === 'jpmorgan' ? COLORS.jpmorgan : COLORS.pwc;

        // Generate PWC style report
        generatePwcStyleReport(doc, colorScheme);
        
        // Save the PDF with client name or default name
        const fileName = clientName 
          ? `${clientName.replace(/\s+/g, '_')}_Financial_Advisory_Report.pdf` 
          : 'Financial_Advisory_Report.pdf';
        
        doc.save(fileName);
        
        // Notify parent component that report was generated
        if (onReportGenerated) {
          onReportGenerated();
        }
        
        setLoading(false);
        handleCloseDialog();
      } catch (error) {
        console.error('Error generating PDF:', error);
        setLoading(false);
      }
    }, 500);
  };

  /**
   * Generate PWC-style report
   */
  const generatePwcStyleReport = (doc, colorScheme) => {
    // First page - Cover with facts and figures
    createPwcCoverPage(doc, colorScheme);
    
    // Add executive summary
    doc.addPage();
    addPwcExecutiveSummary(doc, colorScheme);
    
    // Add client profile
    doc.addPage();
    addPwcClientProfile(doc, colorScheme);
    
    // Add financial analysis
    doc.addPage();
    addPwcFinancialAnalysis(doc, colorScheme);
    
    // Add decision path analysis if enabled
    if (reportOptions.includeDecisionPath && decisionPath && decisionPath.length > 0) {
      doc.addPage();
      addPwcDecisionPathAnalysis(doc, colorScheme);
    }
    
    // Add recommendations
    doc.addPage();
    addPwcRecommendations(doc, colorScheme);
    
    // Add implementation timeline
    if (reportOptions.includeTimeline) {
      doc.addPage();
      addPwcImplementationTimeline(doc, colorScheme);
    }
    
    // Add appendix if enabled
    if (reportOptions.includeAppendix) {
      doc.addPage();
      addPwcAppendix(doc, colorScheme);
    }
  };

  /**
   * Create PWC-style cover page
   */
  const createPwcCoverPage = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    }
    
    // Add Facts and figures header
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'normal');
    doc.text('Facts and figures ' + new Date().getFullYear(), 15, 20);
    
    // Report title
    doc.setFontSize(28);
    doc.setFont('helvetica', 'normal');
    doc.text(reportOptions.brandStyle === 'pwc' ? 'PwC' : 'J.P. Morgan', 15, 40);
    doc.text('Financial Report ' + new Date().getFullYear(), 15, 50);
    
    // Add financial summary section
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Overview', 15, 80);
    
    // Add financial metrics
    let currentY = 95;
    
    // Current savings 
    const lastAmount = financialData && financialData.length > 0 
      ? financialData[financialData.length - 1].amount 
      : (userProfile?.currentSavings ? parseInt(userProfile.currentSavings) : 0);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Current savings', 15, currentY);
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(lastAmount.toLocaleString(), 15, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(getCurrencySymbol(), 15 + doc.getTextWidth(lastAmount.toLocaleString()) + 3, currentY + 10);
    
    currentY += 25;
    
    // Target amount
    const targetAmount = userProfile?.targetAmount ? parseInt(userProfile.targetAmount) : 0;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Target goal', 15, currentY);
    
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text(targetAmount.toLocaleString(), 15, currentY + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(getCurrencySymbol(), 15 + doc.getTextWidth(targetAmount.toLocaleString()) + 3, currentY + 10);
    
    currentY += 25;
    
    // Calculate growth
    if (financialData && financialData.length > 1) {
      const firstAmount = financialData[0].amount;
      const growthPercent = Math.round(((lastAmount / firstAmount) - 1) * 100);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Growth', 15, currentY);
      
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.text(`${growthPercent}%`, 15, currentY + 10);
      
      const growthColor = getGrowthColor(growthPercent, colorScheme);
      doc.setTextColor(growthColor);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(16);
      doc.text(growthPercent >= 0 ? '+' : '', 15 + doc.getTextWidth(`${growthPercent}%`) + 3, currentY + 10);
      doc.setTextColor(255, 255, 255);
    }
    
    // Add separator line
    currentY += 25;
    doc.setDrawColor(100, 100, 100);
    doc.setLineWidth(0.5);
    doc.line(15, currentY, 195, currentY);
    
    // Add client details
    currentY += 15;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Profile', 15, currentY);
    
    currentY += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Client name', 15, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName || userProfile?.name || 'Client', 70, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Financial goal', 15, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(getGoalDisplayName(currentAdvisor?.goal || userProfile?.financialGoal || 'general'), 70, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Time horizon', 15, currentY);
    doc.setFont('helvetica', 'bold');
    
    const timeframeMap = {
      'short': 'Short-term (0-1 year)',
      'medium': 'Medium-term (1-5 years)',
      'long': 'Long-term (5+ years)'
    };
    doc.text(timeframeMap[userProfile?.timeframe] || 'Medium-term (1-5 years)', 70, currentY);
    
    // Add people section in PWC style
    currentY += 25;
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Advisor', 15, currentY);
    
    currentY += 15;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('Financial Advisor', 15, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(currentAdvisor?.name || 'Financial Advisor', 70, currentY);
    
    currentY += 10;
    doc.setFont('helvetica', 'normal');
    doc.text('Specialization', 15, currentY);
    doc.setFont('helvetica', 'bold');
    doc.text(getGoalDisplayName(currentAdvisor?.goal || 'general'), 70, currentY);
    
    // Add branding
    currentY = 270;
    if (reportOptions.brandStyle === 'pwc') {
      // PWC style logo
      doc.setFillColor(255, 255, 255);
      doc.rect(15, currentY - 5, 10, 10, 'F');
      doc.setFillColor(0, 0, 0);
      doc.rect(30, currentY - 5, 10, 10, 'F');
      doc.setFillColor(colorScheme.primary);
      doc.rect(45, currentY - 5, 10, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('pwc', 62, currentY + 3);
    } else {
      // JP Morgan style logo
      doc.setFillColor(colorScheme.primary);
      doc.rect(15, currentY - 5, 20, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('J.P. Morgan', 40, currentY + 3);
    }
  };

  /**
   * Add PWC-style executive summary
   */
  const addPwcExecutiveSummary = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary', 15, 20);
    
    // Add summary section
    let currentY = 40;
    
    if (recommendation && recommendation.summary) {
      const summaryLines = doc.splitTextToSize(recommendation.summary, 180);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(summaryLines, 15, currentY);
      
      currentY += (summaryLines.length * 7) + 20;
    }
    
    // Add key financial metrics
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Financial Metrics', 15, currentY);
    
    currentY += 15;
    
    // Create metrics grid in PWC style
    const metrics = calculateFinancialMetrics(financialData, userProfile);
    
    // Calculate growth or other key metrics to highlight
    let growthRate = 0;
    let savingsRate = 0;
    let progressPercent = 0;
    
    metrics.forEach(metric => {
      if (metric[0] === 'Growth Rate') {
        growthRate = parseInt(metric[1]);
      } else if (metric[0] === 'Current Savings Rate') {
        savingsRate = parseInt(metric[1]);
      } else if (metric[0] === 'Goal Progress') {
        progressPercent = parseInt(metric[1]);
      }
    });
    
    // Display 3 key metrics with PWC style colors and growth indicators
    const boxWidth = 55;
    const boxHeight = 40;
    const startX = 15;
    const margin = 5;
    
    // Current Savings box
    const lastAmount = financialData && financialData.length > 0 
      ? financialData[financialData.length - 1].amount 
      : (userProfile?.currentSavings ? parseInt(userProfile.currentSavings) : 0);
    
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, boxWidth, boxHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Current Savings', startX + 5, currentY + 10);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(lastAmount.toLocaleString() + ' ' + getCurrencySymbol(), startX + 5, currentY + 25);
    
    // Growth Rate box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX + boxWidth + margin, currentY, boxWidth, boxHeight, 'F');
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Growth Rate', startX + boxWidth + margin + 5, currentY + 10);
    
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`${growthRate}%`, startX + boxWidth + margin + 5, currentY + 25);
    
    const growthColor = getGrowthColor(growthRate, colorScheme);
    doc.setTextColor(growthColor);
    doc.setFont('helvetica', 'normal');
    doc.text(growthRate >= 0 ? '+' : '', startX + boxWidth + margin + 5 + doc.getTextWidth(`${growthRate}%`) + 2, currentY + 25);
    doc.setTextColor(textColor, textColor, textColor);
    
    // Savings Rate or Progress box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX + (boxWidth + margin) * 2, currentY, boxWidth, boxHeight, 'F');
    
    if (savingsRate > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Savings Rate', startX + (boxWidth + margin) * 2 + 5, currentY + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${savingsRate}%`, startX + (boxWidth + margin) * 2 + 5, currentY + 25);
    } else if (progressPercent > 0) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Goal Progress', startX + (boxWidth + margin) * 2 + 5, currentY + 10);
      
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(`${progressPercent}%`, startX + (boxWidth + margin) * 2 + 5, currentY + 25);
    } else {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Target Goal', startX + (boxWidth + margin) * 2 + 5, currentY + 10);
      
      const targetAmount = userProfile?.targetAmount ? parseInt(userProfile.targetAmount) : 0;
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(targetAmount.toLocaleString() + ' ' + getCurrencySymbol(), startX + (boxWidth + margin) * 2 + 5, currentY + 25);
    }
    
    currentY += boxHeight + 20;
    
    // Add key findings
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Findings', 15, currentY);
    
    currentY += 15;
    
    // Extract key findings from recommendation
    const keyFindings = [];
    
    if (recommendation && recommendation.steps && recommendation.steps.length > 0) {
      recommendation.steps.forEach((step, index) => {
        if (index < 3) { // Limit to top 3 steps
          keyFindings.push(step);
        }
      });
    } else if (financialData && financialData.length > 0) {
      // Generate default findings based on financial data
      const lastAmount = financialData[financialData.length - 1].amount;
      const targetAmount = userProfile?.targetAmount ? parseInt(userProfile.targetAmount) : 0;
      
      if (targetAmount > 0) {
        const progressPercent = Math.round((lastAmount / targetAmount) * 100);
        keyFindings.push(`You have achieved ${progressPercent}% of your financial goal.`);
      }
      
      if (financialData.length > 1) {
        const firstAmount = financialData[0].amount;
        const growthAmount = lastAmount - firstAmount;
        keyFindings.push(`Your savings have increased by ${growthAmount.toLocaleString()} ${getCurrencySymbol()} since tracking began.`);
      }
      
      keyFindings.push(`Continue your consistent savings behavior to maintain progress toward your financial goals.`);
    } else {
      keyFindings.push("Establish regular financial tracking to enable detailed analysis of your progress.");
      keyFindings.push("Implement recommended savings strategies to accelerate progress toward your financial goals.");
      keyFindings.push("Conduct quarterly reviews of your financial plan to ensure continued alignment with objectives.");
    }
    
    // Display key findings in PWC style
    keyFindings.forEach((finding, index) => {
      const findingLines = doc.splitTextToSize(finding, 170);
      
      // Highlight number
      if (reportOptions.darkMode) {
        doc.setFillColor(colorScheme.primary);
      } else {
        doc.setFillColor(colorScheme.primary);
      }
      doc.circle(25, currentY + 3, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), 25, currentY + 3 + 4);
      
      // Finding text
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(findingLines, 40, currentY);
      
      currentY += (findingLines.length * 7) + 10;
    });
    
    // Add branding footer
    addPwcFooter(doc, colorScheme, 1);
  };

  /**
   * Add PWC-style client profile
   */
  const addPwcClientProfile = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Client Profile', 15, 20);
    
    // Add client profile section
    let currentY = 40;
    
    // Display client information in a grid layout
    const boxWidth = 85;
    const boxHeight = 40;
    const startX = 15;
    const margin = 5;
    const labelColor = reportOptions.darkMode ? 200 : 100;
    
    // Client Name box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Client Name', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(clientName || userProfile?.name || 'Client', startX + 5, currentY + 25);
    
    // Financial Goal box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX + boxWidth + margin, currentY, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Financial Goal', startX + boxWidth + margin + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(getGoalDisplayName(currentAdvisor?.goal || userProfile?.financialGoal || 'general'), 
             startX + boxWidth + margin + 5, currentY + 25);
    
    currentY += boxHeight + margin;
    
    // Time Horizon box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Time Horizon', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    const timeframeMap = {
      'short': 'Short-term (0-1 year)',
      'medium': 'Medium-term (1-5 years)',
      'long': 'Long-term (5+ years)'
    };
    doc.text(timeframeMap[userProfile?.timeframe] || 'Medium-term (1-5 years)', 
             startX + 5, currentY + 25);
    
    // Monthly Income box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX + boxWidth + margin, currentY, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Monthly Income', startX + boxWidth + margin + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Convert income code to readable format
    let incomeDisplay = 'Not specified';
    if (userProfile?.monthlyIncome) {
      const incomeMap = {
        'below_2000': 'Below 2,000 ' + getCurrencySymbol(),
        '2000_4000': '2,000 - 4,000 ' + getCurrencySymbol(),
        '4000_6000': '4,000 - 6,000 ' + getCurrencySymbol(),
        '6000_8000': '6,000 - 8,000 ' + getCurrencySymbol(),
        'above_8000': 'Above 8,000 ' + getCurrencySymbol()
      };
      incomeDisplay = incomeMap[userProfile.monthlyIncome] || userProfile.monthlyIncome;
    }
    
    doc.text(incomeDisplay, startX + boxWidth + margin + 5, currentY + 25);
    
    currentY += boxHeight + margin;
    
    // Current Savings box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Current Savings', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    // Get current savings
    let savingsDisplay = 'Not specified';
    if (financialData && financialData.length > 0) {
      const lastAmount = financialData[financialData.length - 1].amount;
      savingsDisplay = lastAmount.toLocaleString() + ' ' + getCurrencySymbol();
    } else if (userProfile?.currentSavings) {
      // Convert savings code to readable format
      const savingsMap = {
        '0_1000': '0 - 1,000 ' + getCurrencySymbol(),
        '1000_5000': '1,000 - 5,000 ' + getCurrencySymbol(),
        '5000_10000': '5,000 - 10,000 ' + getCurrencySymbol(),
        '10000_20000': '10,000 - 20,000 ' + getCurrencySymbol(),
        'above_20000': 'Above 20,000 ' + getCurrencySymbol()
      };
      savingsDisplay = savingsMap[userProfile.currentSavings] || userProfile.currentSavings;
    }
    
    doc.text(savingsDisplay, startX + 5, currentY + 25);
    
    // Target Amount box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX + boxWidth + margin, currentY, boxWidth, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Target Amount', startX + boxWidth + margin + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    
    const targetAmount = userProfile?.targetAmount ? parseInt(userProfile.targetAmount) : 0;
    doc.text(targetAmount.toLocaleString() + ' ' + getCurrencySymbol(), 
             startX + boxWidth + margin + 5, currentY + 25);
    
    currentY += boxHeight + 20;
    
    // Add Financial Profile section
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Risk & Investment Profile', 15, currentY);
    
    currentY += 15;
    
    // Get risk approach
    const riskApproach = determineRiskApproach(userProfile, currentAdvisor);
    
    // Risk Profile box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, 175, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Risk Profile', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(riskApproach.profile.charAt(0).toUpperCase() + riskApproach.profile.slice(1), 
             startX + 5, currentY + 25);
    
    currentY += boxHeight + margin;
    
    // Investment Emphasis box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, 175, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Investment Emphasis', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(riskApproach.emphasis.charAt(0).toUpperCase() + riskApproach.emphasis.slice(1), 
             startX + 5, currentY + 25);
    
    currentY += boxHeight + margin;
    
    // Financial Needs box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, 175, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Primary Financial Needs', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(riskApproach.needs.charAt(0).toUpperCase() + riskApproach.needs.slice(1), 
             startX + 5, currentY + 25);
    
    // Add Advisor section
    currentY += boxHeight + 20;
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Your Financial Advisor', 15, currentY);
    
    currentY += 15;
    
    // Advisor Name box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, 175, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Advisor', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(currentAdvisor?.name || 'Financial Advisor', startX + 5, currentY + 25);
    
    currentY += boxHeight + margin;
    
    // Specialization box
    if (reportOptions.darkMode) {
      doc.setFillColor(40, 40, 40);
    } else {
      doc.setFillColor(245, 245, 245);
    }
    doc.rect(startX, currentY, 175, boxHeight, 'F');
    
    doc.setTextColor(labelColor, labelColor, labelColor);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Specialization', startX + 5, currentY + 10);
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(getGoalDisplayName(currentAdvisor?.goal || 'general'), startX + 5, currentY + 25);
    
    // Add branding footer
    addPwcFooter(doc, colorScheme, 2);
  };

  /**
   * Add PWC-style financial analysis
   */
  const addPwcFinancialAnalysis = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Financial Analysis', 15, 20);
    
    let currentY = 40;
    
    // Add financial analysis summary
    const metrics = calculateFinancialMetrics(financialData, userProfile);
    const analysisText = generateAnalysisSummary(financialData, userProfile, metrics);
    
    const analysisLines = doc.splitTextToSize(analysisText, 180);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(analysisLines, 15, currentY);
    
    currentY += (analysisLines.length * 7) + 20;
    
    // Skip financial chart if financial data is minimal or not enabled
    if (reportOptions.includeChart && financialData && financialData.length > 1) {
      // Add Financial Progress section
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Financial Progress', 15, currentY);
      
      currentY += 15;
      
      // Draw chart title and background
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(15, currentY, 180, 90, 'F');
      
      // Simple chart visualization in PDF
      const chartHeight = 80;
      const chartWidth = 170;
      const chartStartX = 20;
      const chartStartY = currentY + 5;
      
      // Get data points
      const dataPoints = financialData.map(item => item.amount);
      const maxValue = Math.max(...dataPoints, userProfile?.targetAmount || 0);
      const minValue = 0;
      
      // Calculate scale factors
      const xScale = chartWidth / (dataPoints.length - 1);
      const yScale = chartHeight / (maxValue - minValue);
      
      // Draw axes
      doc.setDrawColor(textColor, textColor, textColor);
      doc.setLineWidth(0.5);
      doc.line(chartStartX, chartStartY + chartHeight, chartStartX + chartWidth, chartStartY + chartHeight); // X-axis
      doc.line(chartStartX, chartStartY, chartStartX, chartStartY + chartHeight); // Y-axis
      
      // Draw axis labels
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      
      // Y-axis labels (simplified)
      const numYLabels = 4;
      for (let i = 0; i <= numYLabels; i++) {
        const value = minValue + ((maxValue - minValue) * (i / numYLabels));
        const y = chartStartY + chartHeight - (value * yScale);
        
        doc.text(Math.round(value).toLocaleString(), chartStartX - 5, y, { align: 'right' });
        
        // Draw horizontal grid lines
        doc.setDrawColor(100, 100, 100);
        doc.setLineWidth(0.1);
        doc.line(chartStartX, y, chartStartX + chartWidth, y);
      }
      
      // X-axis labels (dates)
      for (let i = 0; i < dataPoints.length; i++) {
        const x = chartStartX + (i * xScale);
        const date = financialData[i].date;
        
        if (i % Math.ceil(dataPoints.length / 6) === 0 || i === dataPoints.length - 1) {
          doc.text(date, x, chartStartY + chartHeight + 10, { align: 'center' });
        }
      }
      
      // Draw target line if available
      if (userProfile?.targetAmount) {
        const targetAmount = parseInt(userProfile.targetAmount);
        const targetY = chartStartY + chartHeight - (targetAmount * yScale);
        
        doc.setDrawColor(colorScheme.tertiary);
        doc.setLineWidth(0.8);
        doc.setLineDash([3, 3], 0);
        doc.line(chartStartX, targetY, chartStartX + chartWidth, targetY);
        doc.setLineDash([], 0);
        
        // Add target label
        doc.setFontSize(8);
        doc.setTextColor(colorScheme.tertiary);
        doc.text('Target', chartStartX - 5, targetY, { align: 'right' });
        doc.setTextColor(textColor, textColor, textColor);
      }
      
      // Draw data line
      doc.setDrawColor(colorScheme.secondary);
      doc.setLineWidth(1.5);
      
      for (let i = 1; i < dataPoints.length; i++) {
        const x1 = chartStartX + ((i - 1) * xScale);
        const y1 = chartStartY + chartHeight - (dataPoints[i - 1] * yScale);
        
        const x2 = chartStartX + (i * xScale);
        const y2 = chartStartY + chartHeight - (dataPoints[i] * yScale);
        
        doc.line(x1, y1, x2, y2);
      }
      
      // Draw data points
      doc.setFillColor(colorScheme.secondary);
      
      for (let i = 0; i < dataPoints.length; i++) {
        const x = chartStartX + (i * xScale);
        const y = chartStartY + chartHeight - (dataPoints[i] * yScale);
        
        doc.circle(x, y, 2, 'F');
      }
      
      currentY += 95;
    }
    
    // Add Key Financial Metrics section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Financial Metrics', 15, currentY);
    
    currentY += 15;
    
    // Draw metrics table
    if (metrics.length > 0) {
      // Column settings
      const firstColWidth = 70;
      const secondColWidth = 110;
      
      // Header
      if (reportOptions.darkMode) {
        doc.setFillColor(colorScheme.primary);
      } else {
        doc.setFillColor(colorScheme.primary);
      }
      doc.rect(15, currentY, firstColWidth + secondColWidth, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Metric', 20, currentY + 7);
      doc.text('Value', 20 + firstColWidth, currentY + 7);
      
      currentY += 10;
      
      // Rows
      metrics.forEach((metric, index) => {
        // Alternating row colors
        if (reportOptions.darkMode) {
          doc.setFillColor(index % 2 === 0 ? 50 : 40, index % 2 === 0 ? 50 : 40, index % 2 === 0 ? 50 : 40);
        } else {
          doc.setFillColor(index % 2 === 0 ? 240 : 245, index % 2 === 0 ? 240 : 245, index % 2 === 0 ? 240 : 245);
        }
        doc.rect(15, currentY, firstColWidth + secondColWidth, 10, 'F');
        
        // Metric name
        doc.setTextColor(textColor, textColor, textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(metric[0], 20, currentY + 7);
        
        // Metric value - highlight growth values
        if (metric[0] === 'Growth Rate') {
          const growthValue = parseInt(metric[1]);
          const growthColor = getGrowthColor(growthValue, colorScheme);
          
          doc.setTextColor(growthColor);
          doc.text(metric[1], 20 + firstColWidth, currentY + 7);
          
          doc.setFont('helvetica', 'normal');
          doc.text(growthValue >= 0 ? '+' : '', 20 + firstColWidth + doc.getTextWidth(metric[1]) + 2, currentY + 7);
        } else {
          doc.setTextColor(textColor, textColor, textColor);
          doc.text(metric[1], 20 + firstColWidth, currentY + 7);
        }
        
        currentY += 10;
      });
    } else {
      // No metrics available message
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(15, currentY, 180, 20, 'F');
      
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('Insufficient financial data available for detailed metric calculation.', 20, currentY + 12);
      
      currentY += 20;
    }
    
    // Add branding footer
    addPwcFooter(doc, colorScheme, 3);
  };

  /**
   * Add PWC-style decision path analysis
   */
  const addPwcDecisionPathAnalysis = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Decision Analysis', 15, 20);
    
    let currentY = 40;
    
    // Add introduction text
    const introText = "The following analysis presents the key decisions made during your consultation process. Each decision point reflects your specific preferences and financial circumstances, forming the foundation for the customized recommendations in this report.";
    
    const introLines = doc.splitTextToSize(introText, 180);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(introLines, 15, currentY);
    
    currentY += (introLines.length * 7) + 15;
    
    // Add decision path analysis
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Key Decisions', 15, currentY);
    
    currentY += 15;
    
    // Draw decision path table
    if (decisionPath && decisionPath.length > 0) {
      // Column settings
      const firstColWidth = 50;
      const secondColWidth = 60;
      const thirdColWidth = 70;
      const totalWidth = firstColWidth + secondColWidth + thirdColWidth;
      
      // Header
      if (reportOptions.darkMode) {
        doc.setFillColor(colorScheme.primary);
      } else {
        doc.setFillColor(colorScheme.primary);
      }
      doc.rect(15, currentY, totalWidth, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Decision Stage', 20, currentY + 7);
      doc.text('Question Topic', 20 + firstColWidth, currentY + 7);
      doc.text('Your Preference', 20 + firstColWidth + secondColWidth, currentY + 7);
      
      currentY += 10;
      
      // Rows
      decisionPath.forEach((decision, index) => {
        // Alternating row colors
        if (reportOptions.darkMode) {
          doc.setFillColor(index % 2 === 0 ? 50 : 40, index % 2 === 0 ? 50 : 40, index % 2 === 0 ? 50 : 40);
        } else {
          doc.setFillColor(index % 2 === 0 ? 240 : 245, index % 2 === 0 ? 240 : 245, index % 2 === 0 ? 240 : 245);
        }
        doc.rect(15, currentY, totalWidth, 10, 'F');
        
        // Decision stage
        doc.setTextColor(textColor, textColor, textColor);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Stage ${index + 1}`, 20, currentY + 7);
        
        // Question topic
        const questionText = getQuestionFromDecisionPath(index);
        const truncatedQuestion = questionText.length > 25 ? questionText.substring(0, 25) + '...' : questionText;
        doc.text(truncatedQuestion, 20 + firstColWidth, currentY + 7);
        
        // Preference / selection
        const selection = formatDecisionValue(decision.selection);
        const truncatedSelection = selection.length > 30 ? selection.substring(0, 30) + '...' : selection;
        doc.text(truncatedSelection, 20 + firstColWidth + secondColWidth, currentY + 7);
        
        currentY += 10;
      });
    } else {
      // No decision path available message
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(15, currentY, 180, 20, 'F');
      
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.text('No detailed decision path data available.', 20, currentY + 12);
      
      currentY += 20;
    }
    
    currentY += 15;
    
    // Add decision impact analysis
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Decision Impact Analysis', 15, currentY);
    
    currentY += 15;
    
    // Generate impact analysis text based on decisions
    let impactText = '';
    
    if (decisionPath && decisionPath.length > 0) {
      const goalType = currentAdvisor?.goal || userProfile?.financialGoal || 'general';
      
      if (goalType === 'emergency_fund') {
        // Find relevant decisions
        const timeframeDecision = decisionPath.find(d => d.selection === "short" || d.selection === "medium" || d.selection === "long");
        const amountDecision = decisionPath.find(d => d.selection === "three" || d.selection === "six" || d.selection === "twelve");
        const methodDecision = decisionPath.find(d => d.selection === "automatic" || d.selection === "percentage" || d.selection === "surplus");
        
        const timeframe = timeframeDecision ? formatDecisionValue(timeframeDecision.selection) : "Medium term";
        const amount = amountDecision ? formatDecisionValue(amountDecision.selection) : "6 months of expenses";
        const method = methodDecision ? formatDecisionValue(methodDecision.selection) : "Automatic fixed amount";
        
        impactText = `Your preference for a ${timeframe.toLowerCase()} approach to building an emergency fund covering ${amount.toLowerCase()} demonstrates a balanced approach to financial security. By selecting ${method.toLowerCase()} as your saving method, you've optimized for consistency and discipline in building your financial safety net. These decisions have directly shaped the implementation timeline and specific strategies recommended in this report.`;
      }
      else if (goalType === 'debt_reduction') {
        // Find relevant decisions
        const typeDecision = decisionPath.find(d => ["credit_card", "consumer", "mortgage", "multiple"].includes(d.selection));
        const strategyDecision = decisionPath.find(d => ["avalanche", "snowball", "consolidation", "not_sure"].includes(d.selection));
        
        const type = typeDecision ? formatDecisionValue(typeDecision.selection) : "High-interest debt";
        const strategy = strategyDecision ? formatDecisionValue(strategyDecision.selection) : "Debt avalanche";
        
        impactText = `By identifying ${type.toLowerCase()} as your primary focus and selecting the ${strategy.toLowerCase()} as your preferred approach, you've established a clear framework for debt reduction. These key decisions have guided the development of your customized debt reduction plan, including prioritization strategy, timeline projections, and budget allocation recommendations.`;
      }
      else if (goalType === 'home_purchase') {
        // Find relevant decisions
        const timeframeDecision = decisionPath.find(d => ["short", "medium", "long"].includes(d.selection));
        const downPaymentDecision = decisionPath.find(d => ["ten", "twenty", "thirty_plus", "full"].includes(d.selection));
        
        const timeframe = timeframeDecision ? formatDecisionValue(timeframeDecision.selection) : "Medium term";
        const downPayment = downPaymentDecision ? formatDecisionValue(downPaymentDecision.selection) : "20% down payment";
        
        impactText = `Your selection of a ${timeframe.toLowerCase()} timeline for property purchase with a target of ${downPayment.toLowerCase()} has defined the savings intensity and investment strategy recommended in this report. These decisions balance your homeownership aspirations with financial practicality, shaping the savings rate, investment allocation, and risk profile of your home purchase strategy.`;
      }
      else if (goalType === 'retirement') {
        // Find relevant decisions
        const retirementAgeDecision = decisionPath.find(d => ["early", "standard", "late"].includes(d.selection) && decisionPath.indexOf(d) === 0);
        const currentAgeDecision = decisionPath.find(d => ["early", "mid", "late"].includes(d.selection) && decisionPath.indexOf(d) === 1);
        const vehicleDecision = decisionPath.find(d => ["ike_ikze", "investment", "real_estate", "combined"].includes(d.selection));
        
        const retirementAge = retirementAgeDecision ? formatDecisionValue(retirementAgeDecision.selection) : "Standard retirement age";
        const currentAge = currentAgeDecision ? formatDecisionValue(currentAgeDecision.selection) : "Mid-career";
        const vehicle = vehicleDecision ? formatDecisionValue(vehicleDecision.selection) : "Combined strategy";
        
        impactText = `Your aspiration for ${retirementAge.toLowerCase()}, coupled with your current ${currentAge.toLowerCase()} status and preference for ${vehicle.toLowerCase()} as your primary retirement savings vehicle, has shaped a customized retirement strategy. These decisions have directly influenced the recommended savings rate, investment allocation, and long-term growth projections outlined in this report.`;
      }
      else {
        // Generic impact text
        impactText = `The decisions you've made throughout the consultation process have been instrumental in crafting your personalized financial strategy. Each choice has contributed to the development of recommendations that align with your specific financial objectives, risk tolerance, and timeline preferences.`;
      }
    } else {
      impactText = "Your financial profile and stated objectives have informed the recommendations in this report. A more detailed decision impact analysis would be available with additional consultation data.";
    }
    
    const impactLines = doc.splitTextToSize(impactText, 180);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(impactLines, 15, currentY);
    
    // Add branding footer
    addPwcFooter(doc, colorScheme, 4);
  };

  /**
   * Add PWC-style recommendations
   */
  const addPwcRecommendations = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Strategic Recommendations', 15, 20);
    
    let currentY = 40;
    
    // Add introduction text
    let introText = "Based on our comprehensive analysis of your financial situation and objectives, we recommend the following strategic actions. These recommendations are designed to optimize your financial outcomes and progress toward your goals.";
    
    if (currentAdvisor?.goal) {
      introText += ` The recommendations specifically address your ${getGoalDisplayName(currentAdvisor.goal).toLowerCase()} objective.`;
    }
    
    const introLines = doc.splitTextToSize(introText, 180);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(introLines, 15, currentY);
    
    currentY += (introLines.length * 7) + 15;
    
    // Get recommendations from data or generate default ones
    let recommendations = [];
    
    if (recommendation?.steps && recommendation.steps.length > 0) {
      // Use provided recommendations
      recommendation.steps.forEach((step, index) => {
        // Extract title and details
        const title = getRecommendationTitle(step);
        const details = getRecommendationDetails(step);
        
        recommendations.push({
          title: title,
          details: details,
          rationale: generateRationale(step, userProfile, currentAdvisor)
        });
      });
    } else {
      // Generate default recommendations
      recommendations = generateDefaultRecommendations(userProfile, currentAdvisor);
    }
    
    // Limit to top 3 recommendations for space
    recommendations = recommendations.slice(0, 3);
    
    // Add recommendations in PWC-style boxes
    recommendations.forEach((rec, index) => {
      // Recommendation number
      if (reportOptions.darkMode) {
        doc.setFillColor(colorScheme.primary);
      } else {
        doc.setFillColor(colorScheme.primary);
      }
      doc.circle(25, currentY + 5, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), 25, currentY + 5 + 5);
      
      // Recommendation title
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(rec.title, 45, currentY + 5);
      
      currentY += 15;
      
      // Recommendation details box
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(45, currentY, 150, 35, 'F');
      
      const detailsLines = doc.splitTextToSize(rec.details, 140);
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(detailsLines, 50, currentY + 10);
      
      currentY += 45;
      
      // Rationale box
      if (reportOptions.darkMode) {
        doc.setFillColor(50, 50, 50);
      } else {
        doc.setFillColor(235, 235, 235);
      }
      doc.rect(45, currentY, 150, 25, 'F');
      
      doc.setTextColor(reportOptions.darkMode ? 200 : 100, reportOptions.darkMode ? 200 : 100, reportOptions.darkMode ? 200 : 100);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('RATIONALE', 50, currentY + 8);
      
      const rationaleLines = doc.splitTextToSize(rec.rationale, 140);
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(rationaleLines, 50, currentY + 16);
      
      currentY += 35;
    });
    
    // Add branding footer
    addPwcFooter(doc, colorScheme, 5);
  };

  /**
   * Add PWC-style implementation timeline
   */
  const addPwcImplementationTimeline = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Implementation Timeline', 15, 20);
    
    let currentY = 40;
    
    // Add introduction text
    const introText = "The following implementation timeline provides a structured approach to executing the recommended financial strategies. This phased implementation ensures proper sequencing of actions and allows for adjustments based on changing circumstances.";
    
    const introLines = doc.splitTextToSize(introText, 180);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(introLines, 15, currentY);
    
    currentY += (introLines.length * 7) + 15;
    
    // Generate timeline
    const timeline = generateTimeline(recommendation?.steps || [], userProfile);
    
    // Add timeline phases in PWC-style
    timeline.forEach((phase, index) => {
      // Phase number with colored circle
      if (reportOptions.darkMode) {
        doc.setFillColor(colorScheme.primary);
      } else {
        doc.setFillColor(colorScheme.primary);
      }
      doc.circle(25, currentY + 5, 10, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), 25, currentY + 5 + 5);
      
      // Phase title and timeframe
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text(phase.title, 45, currentY + 5);
      
      doc.setTextColor(colorScheme.primary);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'italic');
      doc.text(phase.timeframe, 45, currentY + 20);
      
      currentY += 30;
      
      // Phase description box
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(45, currentY, 150, 30, 'F');
      
      const descriptionLines = doc.splitTextToSize(phase.description, 140);
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(descriptionLines, 50, currentY + 10);
      
      currentY += 40;
      
      // Add connecting line between phases (except last one)
      if (index < timeline.length - 1) {
        doc.setDrawColor(colorScheme.primary);
        doc.setLineWidth(0.5);
        doc.setLineDash([3, 3], 0);
        doc.line(25, currentY, 25, currentY + 10);
        doc.setLineDash([], 0);
        
        currentY += 10;
      }
    });
    
    // Add success factors box if space permits
    if (currentY < 220) {
      currentY += 15;
      
      // Key Success Factors
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Key Success Factors', 15, currentY);
      
      currentY += 15;
      
      // Success factors box
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(15, currentY, 180, 40, 'F');
      
      // Success factors
      const successFactors = [
        "Consistent implementation of the recommended actions",
        "Regular progress reviews with your financial advisor",
        "Maintaining financial discipline and adherence to the established budget",
        "Prompt adjustment of the plan in response to significant life events"
      ];
      
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      
      let factorY = currentY + 10;
      successFactors.forEach((factor, index) => {
        doc.text(`${index + 1}. ${factor}`, 20, factorY);
        factorY += 8;
      });
    }
    
    // Add branding footer
    addPwcFooter(doc, colorScheme, 6);
  };

  /**
   * Add PWC-style appendix
   */
  const addPwcAppendix = (doc, colorScheme) => {
    // Background color
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.darkBackground);
      doc.rect(0, 0, 210, 297, 'F');
      
      // Add dot pattern (simplified)
      doc.setFillColor(50, 50, 50);
      for (let x = 10; x < 200; x += 20) {
        for (let y = 10; y < 290; y += 20) {
          const size = Math.random() * 5 + 2;
          doc.circle(x + Math.random() * 10, y + Math.random() * 10, size, 'F');
        }
      }
    } else {
      doc.setFillColor(255, 255, 255);
      doc.rect(0, 0, 210, 297, 'F');
    }
    
    // Add title
    const textColor = reportOptions.darkMode ? 255 : 0;
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.text('Appendix', 15, 20);
    
    let currentY = 40;
    
    // Add glossary section
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Glossary of Financial Terms', 15, currentY);
    
    currentY += 15;
    
    // Create glossary table
    const glossaryTerms = [
      ['Asset Allocation', 'The distribution of investments among various asset classes such as stocks, bonds, and cash equivalents.'],
      ['Compound Interest', 'Interest calculated on both the initial principal and accumulated interest over time.'],
      ['Diversification', 'The strategy of investing in a variety of assets to reduce risk exposure.'],
      ['Liquidity', 'The ease with which an asset can be converted to cash without affecting its price.'],
      ['Risk Tolerance', 'An investor\'s ability and willingness to endure fluctuations in the value of their investments.']
    ];
    
    // Add glossary terms in a table
    const firstColWidth = 50;
    const secondColWidth = 130;
    
    // Header
    if (reportOptions.darkMode) {
      doc.setFillColor(colorScheme.primary);
    } else {
      doc.setFillColor(colorScheme.primary);
    }
    doc.rect(15, currentY, firstColWidth + secondColWidth, 10, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Term', 20, currentY + 7);
    doc.text('Definition', 20 + firstColWidth, currentY + 7);
    
    currentY += 10;
    
    // Terms and definitions
    glossaryTerms.forEach((term, index) => {
      // Alternating row colors
      if (reportOptions.darkMode) {
        doc.setFillColor(index % 2 === 0 ? 50 : 40, index % 2 === 0 ? 50 : 40, index % 2 === 0 ? 50 : 40);
      } else {
        doc.setFillColor(index % 2 === 0 ? 240 : 245, index % 2 === 0 ? 240 : 245, index % 2 === 0 ? 240 : 245);
      }
      
      const termLines = doc.splitTextToSize(term[0], firstColWidth - 10);
      const definitionLines = doc.splitTextToSize(term[1], secondColWidth - 10);
      
      // Calculate row height based on which has more lines
      const termHeight = termLines.length * 7;
      const defHeight = definitionLines.length * 7;
      const rowHeight = Math.max(termHeight, defHeight) + 6;
      
      // Draw row background
      doc.rect(15, currentY, firstColWidth + secondColWidth, rowHeight, 'F');
      
      // Term
      doc.setTextColor(textColor, textColor, textColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text(termLines, 20, currentY + 7);
      
      // Definition
      doc.setFont('helvetica', 'normal');
      doc.text(definitionLines, 20 + firstColWidth, currentY + 7);
      
      currentY += rowHeight;
    });
    
    currentY += 15;
    
    // Add additional notes if provided
    if (reportOptions.additionalNotes.trim()) {
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Notes', 15, currentY);
      
      currentY += 15;
      
      // Notes box
      if (reportOptions.darkMode) {
        doc.setFillColor(40, 40, 40);
      } else {
        doc.setFillColor(245, 245, 245);
      }
      doc.rect(15, currentY, 180, 40, 'F');
      
      const notesLines = doc.splitTextToSize(reportOptions.additionalNotes, 170);
      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text(notesLines, 20, currentY + 10);
      
      currentY += 50;
    }
    
// Add data sources and methodology section
doc.setFontSize(18);
doc.setFont('helvetica', 'bold');
doc.text('Data Sources & Methodology', 15, currentY);

currentY += 15;

// Methodology box
if (reportOptions.darkMode) {
  doc.setFillColor(40, 40, 40);
} else {
  doc.setFillColor(245, 245, 245);
}
doc.rect(15, currentY, 180, 50, 'F');

const methodologyText = "This report is based on the financial data provided by you and analyzed using standard financial planning methodologies. Projections and recommendations are based on current market conditions and historical performance patterns, which may not accurately predict future outcomes. All calculations assume consistent savings rates and do not account for unforeseen financial emergencies or significant market disruptions.";

const methodologyLines = doc.splitTextToSize(methodologyText, 170);
doc.setFontSize(12);
doc.setFont('helvetica', 'normal');
doc.text(methodologyLines, 20, currentY + 10);

// Add branding footer
addPwcFooter(doc, colorScheme, 7);
};

/**
 * Add PWC-style footer to page
 */
const addPwcFooter = (doc, colorScheme, pageNumber) => {
  const textColor = reportOptions.darkMode ? 255 : 0;
  
  // Add footer line
  doc.setDrawColor(colorScheme.primary);
  doc.setLineWidth(0.5);
  doc.line(15, 280, 195, 280);
  
  // Add page number
  doc.setTextColor(textColor, textColor, textColor);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Page ${pageNumber}`, 185, 287);
  
  // Add confidentiality text
  doc.setTextColor(textColor, textColor, textColor);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  
  const confidentialityMap = {
    'confidential': 'CONFIDENTIAL: For client use only.',
    'restricted': 'RESTRICTED: For client and authorized advisors only.',
    'internal': 'INTERNAL: For internal use only. Not for distribution.',
    'public': 'This report may be shared with relevant stakeholders.'
  };
  
  doc.text(confidentialityMap[reportOptions.confidentialityLevel] || confidentialityMap['confidential'], 15, 287);
  
  // Add company logo
  if (reportOptions.brandStyle === 'pwc') {
    // PWC style logo
    doc.setFillColor(255, 255, 255);
    doc.rect(15, 270, 5, 5, 'F');
    doc.setFillColor(0, 0, 0);
    doc.rect(22, 270, 5, 5, 'F');
    doc.setFillColor(colorScheme.primary);
    doc.rect(29, 270, 5, 5, 'F');
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text('pwc', 37, 274);
  } else {
    // JP Morgan style logo
    doc.setFillColor(colorScheme.primary);
    doc.rect(15, 270, 10, 5, 'F');
    
    doc.setTextColor(textColor, textColor, textColor);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.text('J.P. Morgan', 28, 274);
  }
};

/**
 * Get display name for financial goal
 */
const getGoalDisplayName = (goal) => {
  const goalMap = {
    'emergency_fund': 'Emergency Fund',
    'debt_reduction': 'Debt Reduction',
    'home_purchase': 'Home Purchase',
    'retirement': 'Retirement Planning',
    'general': 'Financial Planning'
  };
  
  return goalMap[goal] || 'Financial Planning';
};

return (
  <div>
    <Button 
      variant="contained"
      color="primary"
      startIcon={<PictureAsPdf />}
      onClick={handleOpenDialog}
      sx={{ 
        backgroundColor: colorScheme.pwc.primary,
        '&:hover': {
          backgroundColor: colorScheme.pwc.secondary
        }
      }}
    >
      Generate Financial Report
    </Button>
    
    <Dialog
      open={openDialog}
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        Financial Report Options
        <IconButton
          aria-label="close"
          onClick={handleCloseDialog}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>
      
      <DialogContent>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              Report Content
            </Typography>
            <Divider />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Report Title"
              name="reportTitle"
              value={reportOptions.reportTitle}
              onChange={handleTextChange}
              variant="outlined"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Brand Style</InputLabel>
              <Select
                name="brandStyle"
                value={reportOptions.brandStyle}
                onChange={handleSelectChange}
                label="Brand Style"
              >
                <MenuItem value="pwc">PwC Style</MenuItem>
                <MenuItem value="jpmorgan">J.P. Morgan Style</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth variant="outlined">
              <InputLabel>Confidentiality Level</InputLabel>
              <Select
                name="confidentialityLevel"
                value={reportOptions.confidentialityLevel}
                onChange={handleSelectChange}
                label="Confidentiality Level"
              >
                <MenuItem value="confidential">Confidential</MenuItem>
                <MenuItem value="restricted">Restricted</MenuItem>
                <MenuItem value="internal">Internal Use Only</MenuItem>
                <MenuItem value="public">Public</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center">
              <FormControlLabel
                control={
                  <Switch
                    checked={reportOptions.darkMode}
                    onChange={handleOptionChange}
                    name="darkMode"
                    color="primary"
                  />
                }
                label="Dark Mode"
              />
              <Tooltip title="Dark mode creates a professional dark background for the report">
                <IconButton size="small">
                  <InfoOutlined fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Report Sections
            </Typography>
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeBranding}
                  onChange={handleOptionChange}
                  name="includeBranding"
                  color="primary"
                />
              }
              label="Include Branding"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeChart}
                  onChange={handleOptionChange}
                  name="includeChart"
                  color="primary"
                />
              }
              label="Include Financial Chart"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeAdvisorInfo}
                  onChange={handleOptionChange}
                  name="includeAdvisorInfo"
                  color="primary"
                />
              }
              label="Include Advisor Information"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeFullProfile}
                  onChange={handleOptionChange}
                  name="includeFullProfile"
                  color="primary"
                />
              }
              label="Include Full Client Profile"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeTimeline}
                  onChange={handleOptionChange}
                  name="includeTimeline"
                  color="primary"
                />
              }
              label="Include Implementation Timeline"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeExecutiveSummary}
                  onChange={handleOptionChange}
                  name="includeExecutiveSummary"
                  color="primary"
                />
              }
              label="Include Executive Summary"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeDecisionPath}
                  onChange={handleOptionChange}
                  name="includeDecisionPath"
                  color="primary"
                />
              }
              label="Include Decision Path Analysis"
            />
          </Grid>
          
          <Grid item xs={12} sm={6}>
            <FormControlLabel
              control={
                <Checkbox
                  checked={reportOptions.includeAppendix}
                  onChange={handleOptionChange}
                  name="includeAppendix"
                  color="primary"
                />
              }
              label="Include Appendix"
            />
          </Grid>
          
          <Grid item xs={12}>
            <Typography variant="subtitle1" gutterBottom>
              Additional Notes
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              name="additionalNotes"
              value={reportOptions.additionalNotes}
              onChange={handleTextChange}
              variant="outlined"
              placeholder="Add any additional notes for the report..."
            />
          </Grid>
        </Grid>
      </DialogContent>
      
      <DialogActions sx={{ padding: 2 }}>
        <Button onClick={handleCloseDialog} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={generatePDF} 
          variant="contained" 
          color="primary"
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : <PictureAsPdf />}
          sx={{ 
            backgroundColor: colorScheme.pwc.primary,
            '&:hover': {
              backgroundColor: colorScheme.pwc.secondary
            }
          }}
        >
          {loading ? 'Generating...' : 'Generate PDF'}
        </Button>
      </DialogActions>
    </Dialog>
  </div>
);
};

export default ProfessionalFinancialReportGenerator;