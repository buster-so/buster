import type { iconProps } from './iconProps';

function contacts(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px contacts';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="9" cy="7.269" fill="currentColor" r="1.269" />
        <path
          d="M11.198,11.661c.397-.125,.606-.563,.437-.944-.448-1.011-1.458-1.717-2.635-1.717s-2.187,.706-2.635,1.717c-.168,.381,.04,.819,.437,.944,.565,.178,1.314,.339,2.198,.339s1.632-.161,2.198-.339Z"
          fill="currentColor"
        />
        <path
          d="M16.25 4.25L16.25 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 4.25L1.75 13.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="9.5"
          width="12.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          transform="rotate(90 9 9)"
          x="2.75"
          y="4.25"
        />
      </g>
    </svg>
  );
}

export default contacts;
