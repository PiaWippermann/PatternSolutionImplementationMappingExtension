import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import './App.scss';
import "./styles/globals.scss";
import Search from './pages/Search';
import PatternList from './pages/PatternList';
import CreatePattern from './pages/CreatePattern';
import PatternDetail from './pages/PatternDetail';
import SolutionImplementationList from './pages/SolutionImplementationList';
import CreateSolution from './pages/CreateSolution';
import SolutionImplementationDetail from './pages/SolutionImplementationDetail';
import Login from './pages/Login';
import { DiscussionDataProvider } from './context/DiscussionDataContext';
import { isAuthenticated, logout, getCurrentUser, clearClientCache } from './api';
import LoadingSpinner from './components/LoadingSpinner';
import "./styles/layout/AppLayout.scss";
// import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMagnifyingGlass, faRightFromBracket, faUser } from '@fortawesome/free-solid-svg-icons';

type View = 'login' | 'patterns' | 'solutionsImplementations' | 'patternDetail' | 'solutionImplementationDetail' | 'createPattern' | 'createSolutionImplementation' | 'search';

function App() {
  const [currentView, setCurrentView] = useState<View>('patterns');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);
  const [isUserAuthenticated, setIsUserAuthenticated] = useState<boolean>(false);
  const [currentUserLogin, setCurrentUserLogin] = useState<string | null>(null);

  // Check for authentication when the component mounts
  useEffect(() => {
    async function checkAuth() {
      setIsAuthChecking(true);
      const authenticated = await isAuthenticated();
      setIsUserAuthenticated(authenticated);
      
      if (authenticated) {
        const userLogin = await getCurrentUser();
        setCurrentUserLogin(userLogin);
      }
      
      setIsAuthChecking(false);
    }

    checkAuth();
  }, []);

  // Check for the last visited view in local storage when the component mounts
  useEffect(() => {
    async function loadCurrentView() {
      if (!isUserAuthenticated) return;
      
      const result = await browser.storage.local.get('currentView');
      if (result.currentView) {
        setCurrentView(result.currentView as View);
      }
    }

    loadCurrentView();
  }, [isUserAuthenticated]);

  const handleLoginSuccess = () => {
    setIsUserAuthenticated(true);
    setCurrentView('patterns');
    
    // Load user info after successful login
    getCurrentUser().then(userLogin => setCurrentUserLogin(userLogin));
    
    // Notify background script to initialize extension
    browser.runtime.sendMessage({ type: 'LOGIN_SUCCESS' }).catch(error => {
      console.error('Failed to notify background script:', error);
    });
  };

  const handleLogout = async () => {
    await logout();
    clearClientCache();
    setIsUserAuthenticated(false);
    setCurrentUserLogin(null);
    setCurrentView('login');
  };

  const renderView = () => {
    switch (currentView) {
      case 'login':
        return <Login onLoginSuccess={handleLoginSuccess} />;

      case 'patterns':
        return (
          <PatternList
            onSelectPattern={(number: number) => {
              setSelectedNumber(number);
              setCurrentView('patternDetail');
            }}
            onAddPattern={() => setCurrentView('createPattern')}
          />
        );

      case 'createPattern':
        return <CreatePattern onClose={() => setCurrentView('patterns')} />;

      case 'solutionsImplementations':
        return (
          <SolutionImplementationList
            onSelectSolution={(number: number) => {
              setSelectedNumber(number);
              setCurrentView('solutionImplementationDetail');
            }}
            onAddSolutionImplementation={() => setCurrentView('createSolutionImplementation')}
          />
        );

      case 'createSolutionImplementation':
        return (
          <CreateSolution onClose={() => setCurrentView('solutionsImplementations')} />);

      case 'solutionImplementationDetail':
        return selectedNumber !== null ? (
          <SolutionImplementationDetail
            solutionImplementationNumber={selectedNumber}
            onClose={() => setCurrentView('solutionsImplementations')}
          />
        ) : (
          <p>No Solution Implementation selected.</p>
        );

      case 'patternDetail':
        return selectedNumber !== null ? (
          <PatternDetail
            patternNumber={selectedNumber}
            onClose={() => setCurrentView('patterns')}
          />
        ) : (
          <p>No Pattern selected.</p>
        );

      case 'search':
        return (
          <Search onClose={() => setCurrentView('patterns')} onDiscussionSelected={(result) => {
            setSelectedNumber(result.discussionNumber);
            setCurrentView(result.viewName as View);
          }} />
        );

      default:
        return null;
    }
  };

  // Show loading spinner while checking authentication
  if (isAuthChecking) {
    return (
      <div className="app-layout">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  // Show login page if not authenticated
  if (!isUserAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <DiscussionDataProvider>
      <div className="app-layout">
        {/* User info bar */}
        <div className="user-bar">
          {currentUserLogin && (
            <span className="user-info">
              <FontAwesomeIcon icon={faUser} style={{ marginRight: '0.5rem' }} />
              {currentUserLogin}
            </span>
          )}
          <button className="logout-button" onClick={handleLogout} title="Logout">
            <FontAwesomeIcon icon={faRightFromBracket} />
          </button>
        </div>

        {/* Main header with navigation */}
        <header className="header">
          <div className="headerLeft">
            <div className="logo">
              {/* SVG for Airbnb logo */}
            </div>
          </div>

          <div className="headerCenter">
            <nav className="mainNav">
              <button
                onClick={() => setCurrentView('patterns')}
                className={`navItem ${currentView === 'patterns' ? 'active' : ''}`}
              >
                Patterns
              </button>
              <div className="separator"></div>
              <button
                onClick={() => setCurrentView('solutionsImplementations')}
                className={`navItem ${currentView === 'solutionsImplementations' ? 'active' : ''}`}
              >
                Solution Implementations
              </button>
              <button
                onClick={() => setCurrentView('search')}
              >
                <FontAwesomeIcon icon={faMagnifyingGlass} style={{ color: "#49454f" }} />
              </button>
            </nav>
          </div>
          <div className="headerRight">
            {/* Empty - user info moved to user-bar */}
          </div>
        </header>
        {renderView()}
      </div>
    </DiscussionDataProvider>
  );
}

export default App;