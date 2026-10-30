import PhoneInput from 'react-phone-number-input';
import labels from 'react-phone-number-input/locale/fr.json';
import 'react-phone-number-input/style.css';

export default function PhoneField({
  id = 'telephone',
  value,
  onChange,
  disabled = false,
}) {
  return (
    <PhoneInput
      id={id}
      className="phone-field"
      defaultCountry="MG"
      international
      withCountryCallingCode
      labels={labels}
      value={value || undefined}
      onChange={(nextValue) => onChange(nextValue || '')}
      disabled={disabled}
      numberInputProps={{
        id,
        name: 'telephone',
        autoComplete: 'tel',
        'aria-label': 'Numéro de téléphone',
      }}
      countrySelectProps={{
        'aria-label': 'Pays et indicatif téléphonique',
      }}
    />
  );
}
