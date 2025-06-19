import type { iconProps } from './iconProps';

function perfume(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px perfume';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="14.25" cy="3.75" fill="currentColor" r=".75" />
        <circle cx="16.75" cy="2.25" fill="currentColor" r=".75" />
        <circle cx="16.75" cy="5.25" fill="currentColor" r=".75" />
        <path
          d="M7.75,6.969V2.75c0-.552,.448-1,1-1h1.5c.552,0,1,.448,1,1V6.969"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.439,16.25h6.121c1.321-.953,2.189-2.496,2.189-4.25,0-2.899-2.35-5.25-5.25-5.25s-5.25,2.351-5.25,5.25c0,1.754,.868,3.297,2.189,4.25Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.25 11.75L14.75 11.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.815,9c.996-2.542,3.218-4.474,5.935-5.063"
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

export default perfume;
