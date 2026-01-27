import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Sidebar from './Sidebar';
import MonthlyCalendar from '../workcalendars/MonthlyCalendar';
import confetti from 'canvas-confetti';

function Dashboard() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  console.log('[Dashboard] Render - location.state:', location.state, 'showSuccessModal:', showSuccessModal);

  useEffect(() => {
    console.log('[Dashboard] useEffect triggered');
    // Sprawdź czy przyszliśmy z rejestracji zespołu (sprawdź sessionStorage i location.state)
    const showModalFromStorage = sessionStorage.getItem('showTeamSuccessModal') === 'true';
    const showModalFromState = location.state?.showTeamSuccessModal;
    
    console.log('[Dashboard] showModalFromStorage:', showModalFromStorage, 'showModalFromState:', showModalFromState);
    
    if (showModalFromStorage || showModalFromState) {
      console.log('[Dashboard] ===== SHOWING TEAM SUCCESS MODAL =====');
      console.log('[Dashboard] Setting showSuccessModal to true');
      setShowSuccessModal(true);
      
      // Wyczyść flagę z sessionStorage
      if (showModalFromStorage) {
        sessionStorage.removeItem('showTeamSuccessModal');
        console.log('[Dashboard] Removed showTeamSuccessModal from sessionStorage');
      }
      
      // Wyczyść state, żeby modal nie pokazywał się ponownie przy odświeżeniu
      window.history.replaceState({}, document.title);
      
      // Uruchom konfetti z małym opóźnieniem
      setTimeout(() => {
        console.log('[Dashboard] Triggering confetti...');
        triggerConfetti();
      }, 300);
    } else {
      console.log('[Dashboard] No showTeamSuccessModal flag found');
    }
  }, [location.state]);

  const triggerConfetti = () => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 10000 };

    function randomInRange(min, max) {
      return Math.random() * (max - min) + min;
    }

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        return clearInterval(interval);
      }

      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
      });
    }, 250);
  };

  const handleGoToSettings = () => {
    setShowSuccessModal(false);
    navigate('/settings');
  };

  const handleGoToDashboard = () => {
    setShowSuccessModal(false);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <>
      <Sidebar />
      <div className="content p-3">
        <div className="calendar-section">
          <MonthlyCalendar />
        </div>
      </div>

      {/* Modal sukcesu z efektem konfetti */}
      {(() => {
        console.log('[Dashboard] Modal render check - showSuccessModal:', showSuccessModal);
        return showSuccessModal;
      })() && (
        <div 
          className="fixed inset-0 flex items-center justify-center"
          style={{
            zIndex: 100000001,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }} 
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              handleGoToDashboard();
            }
          }}>
          <div 
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: 'white',
              borderRadius: '20px',
              padding: '40px',
              maxWidth: '500px',
              width: '90%',
              boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
              textAlign: 'center',
              position: 'relative',
              overflow: 'hidden',
              zIndex: 100000002
            }}>
            {/* Dekoracyjne tło */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '6px',
              background: 'linear-gradient(90deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #4facfe 75%, #00f2fe 100%)',
              backgroundSize: '200% 100%',
              animation: 'gradient 3s ease infinite'
            }} />
            
            {/* Ikona sukcesu */}
            <div style={{
              width: '80px',
              height: '80px',
              margin: '0 auto 20px',
              borderRadius: '50%',
              backgroundColor: '#10b981',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 10px 30px rgba(16, 185, 129, 0.3)',
              animation: 'scaleIn 0.5s ease-out'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </div>

            {/* Tytuł */}
            <h2 style={{
              fontSize: '28px',
              fontWeight: '700',
              color: '#1f2937',
              marginBottom: '16px',
              lineHeight: '1.2'
            }}>
              {t('newteam.successMessageWithSettings')}
            </h2>

            {/* Opis */}
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              marginBottom: '30px',
              lineHeight: '1.6'
            }}>
              {i18n.resolvedLanguage === 'pl' 
                ? 'W zakładce Ustawienia możesz skonfigurować godziny pracy, święta, typy urlopów i wiele innych opcji dostosowanych do Twojego zespołu.'
                : 'In the Settings section, you can configure working hours, holidays, leave types, and many other options tailored to your team.'
              }
            </p>

            {/* Przyciski */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={handleGoToSettings}
                style={{
                  backgroundColor: '#667eea',
                  color: 'white',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 15px rgba(102, 126, 234, 0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  margin: '0 auto'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#5568d3';
                  e.target.style.transform = 'translateY(-2px)';
                  e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#667eea';
                  e.target.style.transform = 'translateY(0)';
                  e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.4)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3"></circle>
                  <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"></path>
                </svg>
                {t('newteam.settingsLink')}
              </button>
              <button
                onClick={handleGoToDashboard}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: 'none',
                  padding: '14px 28px',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#e5e7eb';
                  e.target.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#f3f4f6';
                  e.target.style.transform = 'translateY(0)';
                }}
              >
                {i18n.resolvedLanguage === 'pl' ? 'Przejdź do panelu' : 'Go to Dashboard'}
              </button>
            </div>
          </div>

          <style>{`
            @keyframes scaleIn {
              from {
                transform: scale(0);
                opacity: 0;
              }
              to {
                transform: scale(1);
                opacity: 1;
              }
            }
            @keyframes gradient {
              0%, 100% {
                background-position: 0% 50%;
              }
              50% {
                background-position: 100% 50%;
              }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

export default Dashboard;
