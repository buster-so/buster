import type { iconProps } from './iconProps';

function nightModeOff(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px night mode off';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M6.018 4.25L13.75 4.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.28 6.75L15.893 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.75 9.25L16.246 9.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.581,5.954c.429,.926,.669,1.958,.669,3.046,0,4.004-3.246,7.25-7.25,7.25-1.07,0-2.086-.232-3-.648"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.873,14.127c-1.312-1.312-2.123-3.124-2.123-5.127C1.75,4.996,4.996,1.75,9,1.75c2.002,0,3.815,.811,5.126,2.123"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.124,9.877c-1.312-1.312-2.124-3.125-2.124-5.127,0-.893,.169-1.745,.465-2.535"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.785,11.535c-.79,.295-1.642,.465-2.535,.465-1.088,0-2.12-.24-3.046-.669"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 16L16 2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default nightModeOff;
