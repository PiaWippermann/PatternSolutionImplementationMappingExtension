import { useState, useEffect } from 'react';
import browser from 'webextension-polyfill';
import './App.scss';
import "./styles/globals.scss";
import PatternList from './pages/PatternList';
import CreatePattern from './pages/CreatePattern';
import PatternDetail from './pages/PatternDetail';
import SolutionImplementationList from './pages/SolutionImplementationList';
import CreateSolution from './pages/CreateSolution';
import SolutionImplementationDetail from './pages/SolutionImplementationDetail';
import { DiscussionDataProvider } from './context/DiscussionDataContext';
import "./styles/layout/AppLayout.scss";
import { faBars } from '@fortawesome/free-solid-svg-icons/faBars';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

type View = 'login' | 'patterns' | 'solutionsImplementations' | 'patternDetail' | 'solutionImplementationDetail' | 'createPattern' | 'createSolutionImplementation';

function App() {
  const [currentView, setCurrentView] = useState<View>('patterns');
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null);

  // Check for the last visited view in local storage when the component mounts
  useEffect(() => {
    async function loadCurrentView() {
      const result = await browser.storage.local.get('currentView');
      if (result.currentView) {
        setCurrentView(result.currentView as View);
      }
    }

    loadCurrentView();
  }, []);

  const renderView = () => {
    switch (currentView) {
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

      case 'login':
        return <p>Login View (to be implemented)</p>;
      default:
        return null;
    }
  };

  return (
    <DiscussionDataProvider>
      <div className="app-layout">
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
            </nav>
          </div>
          <div className="headerRight">
            <button className="userMenu">
              <FontAwesomeIcon
                icon={faBars}
                style={{ color: "#49454f" }}
              />
            </button>
          </div>
        </header>
        {renderView()}
      </div>
    </DiscussionDataProvider>
  );
}

export default App;