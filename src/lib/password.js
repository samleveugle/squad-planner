export function validatePassword(password) {
  if (!password || password.length < 8) {
    return { valid: false, error: "Wachtwoord moet minimaal 8 tekens zijn." };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: "Wachtwoord moet minimaal 1 hoofdletter bevatten." };
  }

  if (!/[0-9]/.test(password)) {
    return { valid: false, error: "Wachtwoord moet minimaal 1 cijfer bevatten." };
  }

  return { valid: true, error: null };
}

export function validatePasswordConfirmation(password, confirmPassword) {
  if (password !== confirmPassword) {
    return { valid: false, error: "Wachtwoorden komen niet overeen." };
  }

  return { valid: true, error: null };
}

export function validatePasswordForm(password, confirmPassword) {
  const passwordResult = validatePassword(password);

  if (!passwordResult.valid) {
    return passwordResult;
  }

  return validatePasswordConfirmation(password, confirmPassword);
}
