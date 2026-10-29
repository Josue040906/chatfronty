import { isValidPhoneNumber } from 'react-phone-number-input';

export function isPhoneNumberValid(value) {
  return !value || isValidPhoneNumber(value, 'MG');
}
