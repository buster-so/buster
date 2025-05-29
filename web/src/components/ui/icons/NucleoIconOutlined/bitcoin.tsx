import type { iconProps } from './iconProps';

function bitcoin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bitcoin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.809 2.445L11.253 4.654"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.89 14.041L8.334 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.283,3.403l6.074,1.529c1.22,.307,1.96,1.545,1.653,2.765h0c-.307,1.22-1.545,1.96-2.765,1.653l-3.865-.973"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.38,8.376l4.418,1.112c1.372,.345,2.205,1.738,1.859,3.11h0c-.345,1.372-1.738,2.205-3.11,1.86l-6.626-1.668"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.048 1.75L5.573 15.555"
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

export default bitcoin;
