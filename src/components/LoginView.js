import React, { useState } from 'react';
import { Lock } from 'lucide-react';

/**
 * LoginView Component
 * A full-screen view that provides a form for users to sign in.
 * It handles user input for email and password and displays feedback, such as loading states and error messages.
 * @param {object} props - Component props
 * @param {Function} props.onLogin - The function to call when the user submits the form. It receives the email and password.
 * @param {string|null} props.error - An error message to display if a previous login attempt failed.
 */
const LoginView = ({ onLogin, error }) => {
  // --- STATE MANAGEMENT ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false); // Manages the loading state of the sign-in button.

  // --- EVENT HANDLERS ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    await onLogin(email, password); // Call the parent component's login handler.
    setIsLoading(false); // Reset loading state after the attempt is complete.
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-lg">
        <div className="text-center">
          <div className="inline-block p-3 bg-indigo-500 rounded-full mb-4">
            <Lock className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-white">Sign In</h1>
          <p className="text-gray-400">Access your POS dashboard</p>
        </div>
        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <label
              htmlFor="email"
              className="text-sm font-bold text-gray-400 block"
            >
              Email Address
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-3 mt-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-sm font-bold text-gray-400 block"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-3 mt-2 text-white bg-gray-700 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••••"
            />
          </div>
          
          {/* Display login error message if it exists */}
          {error && (
            <p className="text-sm text-red-400 text-center">{error}</p>
          )}

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 font-bold text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-indigo-500 transition-colors"
            >
              {isLoading ? 'Signing In...' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginView;

