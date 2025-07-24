import React, { useState, useEffect, useCallback } from 'react';
import { Box, Typography, Snackbar, Alert, CircularProgress } from '@mui/material';
import AchievementNotification from './aichat/AchievementNotification';
import OnboardingForm from './aichat/OnboardingForm.jsx';
import AdvisorSelection from './aichat/AdvisorSelection.jsx';
import DecisionTreeView from './aichat/DecisionTreeView.jsx';
import ChatWindow from './aichat/ChatWindow.jsx';
import useSpeechRecognition from './aichat/hooks/useSpeechRecognition';
import { useAIChatLogic } from './aichat/hooks/useAIChatLogic';
import { ADVISORS, ACHIEVEMENTS, COLOR_PALETTES, INCOME_OPTIONS, SAVINGS_OPTIONS } from './aichat/constants';
import jsPDF from 'jspdf';

const AIChatSection = () => {
  // Main state management
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const [currentAdvisor, setCurrentAdvisor] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [decisionPath, setDecisionPath] = useState([]);
  const [progressValue, setProgressValue] = useState(0);
  const [advancedMode, setAdvancedMode] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [goalAmount, setGoalAmount] = useState(10000);
  const [showChart, setShowChart] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState({ 
    name: '', 
    goal: '', 
    timeframe: '', 
    currentSavings: '', 
    monthlyIncome: '' 
  });
  const [formErrors, setFormErrors] = useState({});
  const [consents, setConsents] = useState({ dataProcessing: false, profiling: false });
  
  // Notifications
  const [notification, setNotification] = useState({ show: false, message: '', severity: 'info' });
  const [newAchievement, setNewAchievement] = useState(null);

  // Custom hooks
  const {
    userProfile,
    setUserProfile,
    chatMessages,
    setChatMessages,
    loading,
    decisionOptions,
    finalRecommendation,
    setFinalRecommendation,
    loadChatHistory,
    loadDecisionOptions,
    generateFinalRecommendation,
    sendMessage,
    previousProfileRef
  } = useAIChatLogic();

  const { 
    isListening, 
    transcript, 
    startListening, 
    stopListening, 
    supported: speechRecognitionSupported 
  } = useSpeechRecognition();

  // Effects
  useEffect(() => { 
    if (transcript) setNewMessage(transcript); 
  }, [transcript]);

  useEffect(() => {
    if (userProfile) {
      setIsAuthenticated(true);
      if (userProfile.onboardingComplete) {
        setIsOnboardingComplete(true);
        setProgressValue(userProfile.progress || 0);
      }
      if (userProfile.targetAmount) setGoalAmount(parseInt(userProfile.targetAmount));
    }
  }, [userProfile]);

  useEffect(() => {
    if (isAuthenticated && currentAdvisor) {
      loadChatHistory(currentAdvisor.id);
    }
  }, [isAuthenticated, currentAdvisor, loadChatHistory]);

  useEffect(() => {
    if (currentAdvisor && isOnboardingComplete) {
      handleLoadDecisionOptions();
    }
  }, [currentAdvisor, currentStep, isOnboardingComplete]);

  useEffect(() => {
    if (userProfile && previousProfileRef.current) {
      if (parseInt(previousProfileRef.current.currentSavings) < 1000 && 
          parseInt(userProfile.currentSavings) >= 1000 && 
          (!userProfile.achievements || !userProfile.achievements.includes('savings_1000'))) {
        const achievement = ACHIEVEMENTS.find(a => a.id === 'savings_1000');
        setNewAchievement(achievement);
      }
      previousProfileRef.current = {...userProfile};
    }
  }, [userProfile, previousProfileRef]);

  // Handlers
  const handleLoadDecisionOptions = useCallback(async () => {
    if (!currentAdvisor) return;
    
    try {
      const result = await loadDecisionOptions(currentAdvisor.id, currentStep, decisionPath);
      if (result.shouldGenerateRecommendation) {
        handleGenerateFinalRecommendation();
      }
    } catch (error) {
      setNotification({ 
        show: true, 
        message: 'Błąd ładowania opcji decyzyjnych', 
        severity: 'error' 
      });
    }
  }, [currentAdvisor, currentStep, decisionPath, loadDecisionOptions]);

  const handleGenerateFinalRecommendation = useCallback(async () => {
    if (!currentAdvisor) return;
    
    try {
      await generateFinalRecommendation(currentAdvisor.id, decisionPath, userProfile);
      
      // Update progress
      const newProgress = Math.min(100, progressValue + 25);
      setProgressValue(newProgress);
      
      // Update user profile
      if (userProfile) {
        const updatedProfile = { 
          ...userProfile, 
          progress: newProgress, 
          lastCompletedAdvisor: currentAdvisor.id 
        };
        
        // Check if this is the first goal achievement
        if (!updatedProfile.achievements || !updatedProfile.achievements.includes('first_goal')) {
          const achievement = ACHIEVEMENTS.find(a => a.id === 'first_goal');
          setNewAchievement(achievement);
          updatedProfile.achievements = updatedProfile.achievements || [];
          updatedProfile.achievements.push('first_goal');
        }
        
        setUserProfile(updatedProfile);
      }
      
      setNotification({ 
        show: true, 
        message: 'Rekomendacje gotowe!', 
        severity: 'success' 
      });
    } catch (error) {
      setNotification({ 
        show: true, 
        message: 'Błąd generowania rekomendacji', 
        severity: 'error' 
      });
    }
  }, [currentAdvisor, decisionPath, userProfile, progressValue, generateFinalRecommendation, setUserProfile]);

  const handleDecisionSelect = (optionIndex) => {
    const selectedOption = decisionOptions[optionIndex];
    
    const newDecision = {
      step: currentStep,
      selection: selectedOption.id,
      value: selectedOption.value
    };
    
    const newPath = [...decisionPath, newDecision];
    setDecisionPath(newPath);
    
    // Calculate progress
    const stepsInFlow = 4;
    const newStepProgress = ((currentStep + 1) / stepsInFlow) * 100;
    const adjustedProgress = Math.min(75, progressValue + newStepProgress / stepsInFlow);
    setProgressValue(adjustedProgress);
    
    setNotification({ 
      show: true, 
      message: 'Wybór zapisany!', 
      severity: 'success' 
    });
    
    setCurrentStep(currentStep + 1);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    
    if (isListening) stopListening();
    
    try {
      const response = await sendMessage(newMessage, currentAdvisor?.id, decisionPath);
      setNewMessage('');
      
      // Check if we should start decision tree
      if (response && response.startDecisionTree) {
        setChatVisible(false);
        setDecisionPath([]);
        setCurrentStep(0);
        handleLoadDecisionOptions();
      }
    } catch (error) {
      setNotification({
        show: true,
        message: 'Wystąpił błąd podczas wysyłania wiadomości',
        severity: 'error'
      });
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.name.trim()) errors.name = 'Podaj swoje imię';
    if (!formData.goal.trim()) errors.goal = 'Wybierz cel';
    if (!formData.timeframe.trim()) errors.timeframe = 'Wybierz ramy czasowe';
    if (!formData.monthlyIncome.trim()) errors.monthlyIncome = 'Wybierz dochód';
    if (!consents.dataProcessing) errors.consents = 'Wymagana zgoda';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      let targetAmount = 10000;
      switch (formData.goal) {
        case 'emergency_fund': targetAmount = 12000; break;
        case 'home_purchase': targetAmount = 100000; break;
        case 'debt_reduction': targetAmount = 20000; break;
        case 'education': targetAmount = 15000; break;
        case 'vacation': targetAmount = 5000; break;
        default: targetAmount = 10000;
      }
      
      const profile = userProfile || {};
      const updatedProfile = {
        ...profile,
        name: formData.name,
        financialGoal: formData.goal,
        timeframe: formData.timeframe,
        currentSavings: formData.currentSavings || '0',
        monthlyIncome: formData.monthlyIncome,
        targetAmount: targetAmount.toString(),
        onboardingComplete: true,
        progress: 10,
        consents,
        achievements: profile.achievements || []
      };
      
      if (!updatedProfile.achievements.includes('first_goal')) {
        updatedProfile.achievements.push('first_goal');
        setTimeout(() => setNewAchievement(ACHIEVEMENTS.find(a => a.id === 'first_goal')), 1000);
      }
      
      setGoalAmount(targetAmount);
      setUserProfile(updatedProfile);
      setIsOnboardingComplete(true);
      setProgressValue(10);
      setNotification({ show: true, message: 'Dane zapisane!', severity: 'success' });
    } catch (error) {
      console.error('Error completing onboarding:', error);
      setNotification({ show: true, message: 'Błąd zapisu danych', severity: 'error' });
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    
    // Add company logo/header
    doc.setFillColor(15, 48, 87);
    doc.rect(0, 0, 210, 25, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('DisiNow - Raport Finansowy', 105, 15, { align: 'center' });
    
    // Add user information
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Raport przygotowany dla: ${userProfile.name || 'Użytkownika'}`, 20, 35);
    doc.text(`Data wygenerowania: ${new Date().toLocaleDateString('pl-PL')}`, 20, 42);
    
    // Add advisor information
    doc.setFillColor(0, 168, 150, 0.1);
    doc.rect(20, 50, 170, 12, 'F');
    doc.setFont('helvetica', 'bold');
    doc.text(`Doradca: ${currentAdvisor.name}`, 25, 58);
    
    // Add summary section
    doc.setFontSize(16);
    doc.setTextColor(15, 48, 87);
    doc.text('Podsumowanie', 20, 75);
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    const summaryLines = doc.splitTextToSize(finalRecommendation.summary, 170);
    doc.text(summaryLines, 20, 85);
    
    let yPos = 85 + (summaryLines.length * 7);
    
    // Add steps section
    if (finalRecommendation.steps && finalRecommendation.steps.length > 0) {
      doc.setFontSize(16);
      doc.setTextColor(15, 48, 87);
      doc.setFont('helvetica', 'bold');
      doc.text('Następne kroki', 20, yPos + 10);
      
      yPos += 20;
      
      finalRecommendation.steps.forEach((step, index) => {
        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        
        doc.setFillColor(0, 168, 150);
        doc.circle(25, yPos, 1.5, 'F');
        
        const stepLines = doc.splitTextToSize(step, 160);
        doc.text(stepLines, 30, yPos);
        
        yPos += (stepLines.length * 7) + 10;
      });
    }
    
    // Add financial information
    doc.setFontSize(16);
    doc.setTextColor(15, 48, 87);
    doc.setFont('helvetica', 'bold');
    doc.text('Twoja sytuacja finansowa', 20, yPos + 10);
    
    yPos += 20;
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'normal');
    
    doc.text(`Miesięczny dochód: ${userProfile.monthlyIncome || '0'} zł`, 25, yPos);
    yPos += 7;
    doc.text(`Obecne oszczędności: ${userProfile.currentSavings || '0'} zł`, 25, yPos);
    yPos += 7;
    doc.text(`Cel finansowy: ${userProfile.targetAmount || '0'} zł`, 25, yPos);
    
    // Add footer
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('© DisiNow - Twój inteligentny asystent finansowy', 105, 285, { align: 'center' });
    
    doc.save('raport_finansowy.pdf');
    
    setNotification({
      show: true,
      message: 'Raport PDF został wygenerowany i pobrany',
      severity: 'success'
    });
  };

  // Helper functions
  const changeAdvisor = () => {
    setCurrentAdvisor(null);
    setCurrentStep(0);
    setDecisionPath([]);
    setFinalRecommendation(null);
    setChatVisible(false);
  };

  const toggleAdvancedMode = () => setAdvancedMode(!advancedMode);
  const handleCloseAchievement = () => setNewAchievement(null);
  const toggleChart = () => setShowChart(!showChart);

  // Render functions
  const renderContent = () => {
    if (!isAuthenticated) {
      return (
        <Box textAlign="center" p={4}>
          <CircularProgress sx={{ color: COLOR_PALETTES.main.secondary }} />
          <Typography variant="body1" sx={{ mt: 2 }}>Weryfikacja...</Typography>
        </Box>
      );
    }
    
    if (!isOnboardingComplete) {
      return (
        <OnboardingForm
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          consents={consents}
          setConsents={setConsents}
          incomeOptions={INCOME_OPTIONS}
          savingsOptions={SAVINGS_OPTIONS}
          loading={loading}
          handleOnboardingSubmit={handleOnboardingSubmit}
          COLORS={COLOR_PALETTES.main}
        />
      );
    }
    
    if (!currentAdvisor) {
      return (
        <AdvisorSelection
          ADVISORS={ADVISORS}
          setCurrentAdvisor={setCurrentAdvisor}
          userProfile={userProfile}
          showChart={showChart}
          toggleChart={toggleChart}
          COLORS={COLOR_PALETTES.main}
          goalAmount={goalAmount}
        />
      );
    }
    
    if (chatVisible) {
      return (
        <ChatWindow
          currentAdvisor={currentAdvisor}
          chatMessages={chatMessages}
          newMessage={newMessage}
          setNewMessage={setNewMessage}
          isListening={isListening}
          startListening={startListening}
          stopListening={stopListening}
          speechRecognitionSupported={speechRecognitionSupported}
          handleSendMessage={handleSendMessage}
          loading={loading}
          setChatVisible={setChatVisible}
          COLORS={COLOR_PALETTES.main}
        />
      );
    }
    
    return (
      <DecisionTreeView
        currentAdvisor={currentAdvisor}
        changeAdvisor={changeAdvisor}
        toggleAdvancedMode={toggleAdvancedMode}
        advancedMode={advancedMode}
        progressValue={progressValue}
        decisionPath={decisionPath}
        finalRecommendation={finalRecommendation}
        decisionOptions={decisionOptions}
        loading={loading}
        handleDecisionSelect={handleDecisionSelect}
        toggleChat={() => setChatVisible(true)}
        generatePDF={generatePDF}
        COLORS={COLOR_PALETTES.main}
      />
    );
  };

  return (
    <Box sx={{ py: 4, backgroundColor: COLOR_PALETTES.main.background, minHeight: '100vh' }}>
      <Box sx={{ maxWidth: 1200, margin: '0 auto', px: 2 }}>
        <Box textAlign="center" mb={4}>
          <Typography variant="h4" gutterBottom sx={{ color: COLOR_PALETTES.main.primary, fontWeight: 'bold' }}>
            DisiNow
          </Typography>
          <Typography variant="body1" sx={{ color: COLOR_PALETTES.main.lightText }}>
            Twój asystent finansowy
          </Typography>
        </Box>
        
        {renderContent()}
        
        <Snackbar
          open={notification.show}
          autoHideDuration={5000}
          onClose={() => setNotification({ ...notification, show: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
        >
          <Alert
            onClose={() => setNotification({ ...notification, show: false })}
            severity={notification.severity}
            variant="filled"
          >
            {notification.message}
          </Alert>
        </Snackbar>
        
        {newAchievement && (
          <AchievementNotification
            achievement={newAchievement}
            onClose={handleCloseAchievement}
            COLORS={COLOR_PALETTES.main}
          />
        )}
      </Box>
    </Box>
  );
};

export default AIChatSection;