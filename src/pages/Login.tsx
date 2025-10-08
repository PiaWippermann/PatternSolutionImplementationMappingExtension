import React, { useState } from 'react';
import { validateToken, setToken } from '../api/auth';
import LoadingSpinner from '../components/LoadingSpinner';
import '../styles/pages/Login.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEye, faEyeSlash, faKey } from '@fortawesome/free-solid-svg-icons';

interface LoginProps {
  onLoginSuccess: () => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const [token, setTokenInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const isValid = await validateToken(token);

      if (isValid) {
        await setToken(token);
        onLoginSuccess();
      } else {
        setError('Invalid token. Please check your token and try again.');
      }
    } catch {
      setError('An error occurred during login. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleShowToken = () => {
    setShowToken(!showToken);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <FontAwesomeIcon icon={faKey} className="github-icon" />
          <h1>Login to GitHub</h1>
          <p className="login-subtitle">Authenticate with your Personal Access Token</p>
        </div>

        <div className="login-body">
          <div className="info-section">
            <h3>
              <FontAwesomeIcon icon={faKey} className="info-icon" />
              How to get a Personal Access Token
            </h3>
            <ol className="instructions-list">
              <li>
                Go to{' '}
                <a
                  href="https://github.com/settings/tokens/new"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Token Settings
                </a>
              </li>
              <li>Click "Generate new token" (classic)</li>
              <li>Give your token a descriptive name</li>
              <li>Select the following scopes:
                <ul className="scopes-list">
                  <li><code>repo</code> (for private repositories) or <code>public_repo</code> (for public only)</li>
                  <li><code>read:discussion</code></li>
                  <li><code>write:discussion</code></li>
                </ul>
              </li>
              <li>Click "Generate token" at the bottom</li>
              <li>Copy the token and paste it below</li>
            </ol>
          </div>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-field-container">
              <label htmlFor="token-input">Personal Access Token:</label>
              <div className="token-input-wrapper">
                <input
                  id="token-input"
                  className="custom-input token-input"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                  required
                  autoComplete="off"
                />
                <button
                  type="button"
                  className="toggle-visibility-button"
                  onClick={toggleShowToken}
                  aria-label={showToken ? 'Hide token' : 'Show token'}
                >
                  <FontAwesomeIcon icon={showToken ? faEyeSlash : faEye} />
                </button>
              </div>
            </div>

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            <button
              className="login-button"
              type="submit"
              disabled={isLoading || !token}
            >
              {isLoading ? <LoadingSpinner /> : 'Login'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
