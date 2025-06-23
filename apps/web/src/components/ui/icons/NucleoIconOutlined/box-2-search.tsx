import type { iconProps } from './iconProps';

function box2Search(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box 2 search';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M4.75 9.25L4.75 6.083 11.5 3.083"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.906,1.931l6.344,2.819-6.344,2.819c-.259,.115-.554,.115-.812,0L1.75,4.75,8.094,1.931c.259-.115,.554-.115,.812,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.25 9L15.25 4.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75,4.75v7.85c0,.395,.233,.753,.594,.914l5.75,2.556c.259,.115,.554,.115,.812,0l.443-.198"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.5 7.656L8.5 16.069"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15 15L16.66 16.66"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="13.41"
          cy="13.41"
          fill="none"
          r="2.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default box2Search;
