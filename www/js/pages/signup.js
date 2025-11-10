/**
 * Signup Page Script
 * Handles signup form submission and user registration
 */
import authService from '../services/auth.js';
import { isValidEmail, validatePassword, validateUsername } from '../utils/validation.js';

// DOM Elements
const signupForm = document.getElementById('signupForm');
const usernameInput = document.getElementById('username');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const confirmPasswordInput = document.getElementById('confirmPassword');
const userTypeSelect = document.getElementById('userType');
const roleSelect = document.getElementById('role');
const signupButton = document.getElementById('signupButton');
const signupButtonText = document.getElementById('signupButtonText');
const signupButtonLoader = document.getElementById('signupButtonLoader');
const errorMessage = document.getElementById('errorMessage');
const errorText = document.getElementById('errorText');
const successMessage = document.getElementById('successMessage');
const successText = document.getElementById('successText');

// Field error elements
const usernameError = document.getElementById('usernameError');
const emailError = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmPasswordError = document.getElementById('confirmPasswordError');
const userTypeError = document.getElementById('userTypeError');
const roleError = document.getElementById('roleError');

// Role options based on user type
const roleOptions = {
  employee: [
    { value: 'employee', label: 'Employee' },
    { value: 'manager', label: 'Manager' }
  ],
  admin: [
    { value: 'admin', label: 'Administrator' },
    { value: 'manager', label: 'Manager' }
  ]
};

/**
 * Show error message
 * @param {string} message - Error message to display
 */
function showError(message) {
  errorText.textContent = message;
  errorMessage.classList.remove('hidden');
  successMessage.classList.add('hidden');
}

/**
 * Hide error message
 */
function hideError() {
  errorMessage.classList.add('hidden');
  errorText.textContent = '';
}

/**
 * Show success message
 * @param {string} message - Success message to display
 */
function showSuccess(message) {
  successText.textContent = message;
  successMessage.classList.remove('hidden');
  errorMessage.classList.add('hidden');
}

/**
 * Hide success message
 */
function hideSuccess() {
  successMessage.classList.add('hidden');
  successText.textContent = '';
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
  clearFieldError(usernameError, usernameInput);
  clearFieldError(emailError, emailInput);
  clearFieldError(passwordError, passwordInput);
  clearFieldError(confirmPasswordError, confirmPasswordInput);
  clearFieldError(userTypeError, userTypeSelect);
  clearFieldError(roleError, roleSelect);
}

/**
 * Update role dropdown based on selected user type
 */
function updateRoleOptions() {
  const userType = userTypeSelect.value;
  
  // Clear existing options
  roleSelect.innerHTML = '<option value="">Select role</option>';
  
  if (userType && roleOptions[userType]) {
    roleOptions[userType].forEach(option => {
      const optionElement = document.createElement('option');
      optionElement.value = option.value;
      optionElement.textContent = option.label;
      roleSelect.appendChild(optionElement);
    });
    roleSelect.disabled = false;
  } else {
    roleSelect.disabled = true;
  }
}

/**
 * Validate form inputs
 * @returns {boolean} True if form is valid
 */
function validateForm() {
  let isValid = true;
  clearAllFieldErrors();

  // Validate username
  const username = usernameInput.value.trim();
  const usernameValidation = validateUsername(username);
  if (!usernameValidation.isValid) {
    showFieldError(usernameError, usernameInput, usernameValidation.error);
    isValid = false;
  }

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
  } else {
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      showFieldError(passwordError, passwordInput, passwordValidation.errors[0]);
      isValid = false;
    }
  }

  // Validate confirm password
  const confirmPassword = confirmPasswordInput.value;
  if (!confirmPassword) {
    showFieldError(confirmPasswordError, confirmPasswordInput, 'Please confirm your password');
    isValid = false;
  } else if (password !== confirmPassword) {
    showFieldError(confirmPasswordError, confirmPasswordInput, 'Passwords do not match');
    isValid = false;
  }

  // Validate user type
  const userType = userTypeSelect.value;
  if (!userType) {
    showFieldError(userTypeError, userTypeSelect, 'Please select a user type');
    isValid = false;
  }

  // Validate role
  const role = roleSelect.value;
  if (!role) {
    showFieldError(roleError, roleSelect, 'Please select a role');
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
    signupButton.disabled = true;
    signupButtonText.classList.add('hidden');
    signupButtonLoader.classList.remove('hidden');
  } else {
    signupButton.disabled = false;
    signupButtonText.classList.remove('hidden');
    signupButtonLoader.classList.add('hidden');
  }
}

/**
 * Handle form submission
 * @param {Event} event - Submit event
 */
async function handleSubmit(event) {
  event.preventDefault();
  hideError();
  hideSuccess();

  // Validate form
  if (!validateForm()) {
    return;
  }

  // Get form data
  const userData = {
    username: usernameInput.value.trim(),
    email: emailInput.value.trim(),
    password: passwordInput.value,
    userType: userTypeSelect.value,
    role: roleSelect.value
  };

  // Set loading state
  setLoading(true);

  try {
    // Attempt signup
    const result = await authService.signup(userData);

    if (result.success) {
      // Show success message
      showSuccess(result.message || 'Account created successfully!');
      
      // Clear form
      signupForm.reset();
      updateRoleOptions();
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      // Show error message
      showError(result.error || 'Signup failed. Please try again.');
      setLoading(false);
    }
  } catch (error) {
    console.error('Signup error:', error);
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
    hideSuccess();
  });
}

/**
 * Initialize password toggles
 */
function initPasswordToggles() {
  const passwordToggle = document.getElementById('passwordToggle');
  const passwordToggleIcon = document.getElementById('passwordToggleIcon');
  const confirmPasswordToggle = document.getElementById('confirmPasswordToggle');
  const confirmPasswordToggleIcon = document.getElementById('confirmPasswordToggleIcon');
  
  if (passwordToggle) {
    passwordToggle.addEventListener('click', () => {
      const type = passwordInput.type === 'password' ? 'text' : 'password';
      passwordInput.type = type;
      passwordToggleIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
  
  if (confirmPasswordToggle) {
    confirmPasswordToggle.addEventListener('click', () => {
      const type = confirmPasswordInput.type === 'password' ? 'text' : 'password';
      confirmPasswordInput.type = type;
      confirmPasswordToggleIcon.textContent = type === 'password' ? '👁️' : '🙈';
    });
  }
}

/**
 * Initialize page
 */
function init() {
  // Check if already authenticated
  if (authService.isAuthenticated()) {
    window.location.href = '../index.html';
    return;
  }

  // Add form submit listener
  signupForm.addEventListener('submit', handleSubmit);

  // Add user type change listener
  userTypeSelect.addEventListener('change', updateRoleOptions);

  // Add input change listeners
  handleInputChange(usernameInput, usernameError);
  handleInputChange(emailInput, emailError);
  handleInputChange(passwordInput, passwordError);
  handleInputChange(confirmPasswordInput, confirmPasswordError);
  handleInputChange(userTypeSelect, userTypeError);
  handleInputChange(roleSelect, roleError);

  // Initialize password toggles
  initPasswordToggles();

  // Initialize role options
  updateRoleOptions();

  // Focus on username input
  usernameInput.focus();
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
