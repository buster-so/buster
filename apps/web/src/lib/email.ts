const personalEmailDomains = [
  '@gmail',
  '@yahoo',
  '@outlook',
  '@icloud',
  '@aol',
  '@hotmail',
  '@protonmail',
  '@zoho',
  '@mail',
  '@yandex',
  '@gmx',
  '@inbox',
  '@fastmail',
  '@mail',
  '@live',
  '@yahoo',
  '@rediffmail',
  '@tutanota',
  '@rocketmail',
  '@me',
  '@mac',
  '@aim',
  '@hushmail'
];

export const isPersonalEmail = (email: string) => {
  return isValidEmail(email) && personalEmailDomains.some((domain) => email.includes(domain));
};

export const isValidEmail = (email: string) => {
  const re =
    /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
};
