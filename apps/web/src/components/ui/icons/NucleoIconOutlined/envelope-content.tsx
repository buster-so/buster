import type { iconProps } from './iconProps';

function envelopeContent(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope content';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,7.254v5.996c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V7.25l6.815,3.29c.275,.133,.595,.133,.869,0l6.815-3.29v.004Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,5.5V1.75c0-.552,.448-1,1-1H13.25c.552,0,1,.448,1,1v3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 3.75L11.75 3.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25 6.75L11.75 6.75"
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

export default envelopeContent;
