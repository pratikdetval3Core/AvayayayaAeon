/**
 * Login Page Script
 * Handles login form submission and authentication
 */
import authService from '../services/auth.js';
import { isValidEmail } from '../utils/validation.js';

// DOM Elements
const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = document.getElementById('loginButton');
const loginButtonText = document.getElementById('loginButtonText');
const loginButtonLoader = document.getElementById('loginButtonLoader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');

// Field error elements
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.classList.add('hidden');
  errorText.textContent = '';
}

/**
 * Show field error
 * @param {HTMLElement} errorElement - Error element
 * @param {HTMLElement} inputElement - Input element
 * @param {string} message - Error message
 */
function showFieldError(errorElement, inputElement, message) {
  errorElement.textContent = message;
  inputElement.classList.add('error');
}

/**
 * Clear field error
 * @param {HTMLElement} errorElement - Error element
 * @param {HTMLElement} inputElement - Input element
 */
function clearFieldError(errorElement, inputElement) {
  errorElement.textContent = '';
  inputElement.classList.remove('error');
}

/**
 * Clear all field errors
 */
function clearAllFieldErrors() {
  clearFieldError(emailError, emailInput);
  clearFieldError(passwordError, passwordInput);
}

/**
 * Validate form inputs
 * @returns {boolean} True if form is valid
 */
function validateForm() {
  let isValid = true;
  clearAllFieldErrors();

  // Validate email
  const email = emailInput.value.trim();
  if (!email) {
    showFieldError(emailError, emailInput, 'Email is required');
    isValid = false;
  } else if (!isValidEmail(email)) {
    showFieldError(emailError, emailInput, 'Invalid email format');
    isValid = false;
  }

  // Validate password
  const password = passwordInput.value;
  if (!password) {
    showFieldError(passwordError, passwordInput, 'Password is required');
    isValid = false;
  }

  return isValid;
}

/**
 * Set loading state
 * @param {boolean} loading - Loading state
 */
function setLoading(loading) {
  if (loading) {
    loginButton.disabled = true;
    loginButtonText.classList.add('hidden');
    loginButtonLoader.classList.remove('hidden');
  } else {
    loginButton.disabled = false;
    loginButtonText.classList.remove('hidden');
    loginButtonLoader.classList.add('hidden');
  }
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  // Validate form
  if (!validateForm()) {
    return;
  }

  // Get form data
  const email = emailInput.value.trim();
  const password = passwordInput.value;

  // Set loading state
  setLoading(true);

  try {
    // Attempt login
    const result = await authService.login(email, password);

    if (result.success) {
      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } else {
      // Show error message
      showError(result.error || 'Login failed. Please try again.');
      setLoading(false);
    }
  } catch (error) {
    console.error('Login error:', error);
    showError('An unexpected error occurred. Please try again.');
    setLoading(false);
  }
}

/**
 * Handle input field changes (clear errors on input)
 */
function handleInputChange(inputElement, errorElement) {
  inputElement.addEventListener('input', () => {
    clearFieldError(errorElement, inputElement);
    hideError();
  });
}

/**
 * Initialize password toggle
 */
function initPasswordToggle() {
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordToggleIcon = document.getElementById('passwordToggleIcon');
  
  if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      passwordToggleIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
}

/**
 * Initialize page
 */
function init() {
  // Check if already authenticated
  if (authService.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  // Add form submit listener
  loginForm.addEventListener('submit', handleSubmit);

  // Add input change listeners
  handleInputChange(emailInput, emailError);
  handleInputChange(passwordInput, passwordError);

  // Initialize password toggle
  initPasswordToggle();

  // Focus on email input
  emailInput.focus();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
