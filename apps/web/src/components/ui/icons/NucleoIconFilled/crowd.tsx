import type { iconProps } from './iconProps';

function crowd(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px crowd';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="4.25" cy="10.5" fill="currentColor" r="2.5" />
        <circle cx="9" cy="2.5" fill="currentColor" r="2.5" />
        <circle cx="13.75" cy="10.5" fill="currentColor" r="2.25" />
        <path
          d="M4.25,13.75c-1.867,0-3.542,1.249-4.074,3.036-.068,.227-.024,.473,.118,.662,.142,.19,.364,.302,.601,.302H7.605c.237,0,.459-.112,.601-.302,.142-.189,.186-.435,.118-.662-.532-1.788-2.207-3.036-4.074-3.036Z"
          fill="currentColor"
        />
        <path
          d="M11.194,8.023c.219,0,.437-.096,.585-.28,.259-.323,.208-.795-.114-1.055-1.504-1.21-3.825-1.21-5.329,0-.323,.26-.374,.732-.114,1.055,.26,.322,.731,.373,1.055,.114,.987-.795,2.461-.795,3.448,0,.139,.111,.305,.166,.47,.166Z"
          fill="currentColor"
        />
        <path
          d="M17.824,16.786c-.532-1.788-2.207-3.036-4.074-3.036s-3.542,1.249-4.074,3.036c-.068,.227-.024,.473,.118,.662,.142,.19,.364,.302,.601,.302h6.71c.237,0,.459-.112,.601-.302,.142-.189,.186-.435,.118-.662Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default crowd;
