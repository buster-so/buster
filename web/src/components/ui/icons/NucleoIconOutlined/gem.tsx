import type { iconProps } from './iconProps';

function gem(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px gem';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M2.053 6.75L15.951 6.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.88 3.25L6.057 6.75 8.765 15.723"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M10.12 3.25L11.943 6.75 9.235 15.723"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.269,6.123l2.404-2.556c.191-.203,.458-.318,.738-.318h7.178c.28,0,.547,.115,.738,.318l2.404,2.556c.33,.351,.36,.885,.07,1.27l-5.993,7.956c-.403,.535-1.214,.535-1.616,0L2.199,7.393c-.29-.385-.26-.918,.07-1.27Z"
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

export default gem;
