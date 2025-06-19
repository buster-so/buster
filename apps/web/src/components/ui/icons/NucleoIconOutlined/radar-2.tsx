import type { iconProps } from './iconProps';

function radar2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px radar 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.581,5.954c.429,.926,.669,1.958,.669,3.046,0,4.004-3.246,7.25-7.25,7.25S1.75,13.004,1.75,9,4.996,1.75,9,1.75c2.002,0,3.815,.811,5.126,2.123"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.744,8.791c.004,.069,.006,.139,.006,.209,0,2.071-1.679,3.75-3.75,3.75s-3.75-1.679-3.75-3.75,1.679-3.75,3.75-3.75c1.036,0,1.973,.42,2.652,1.098"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 9L15.75 2.25"
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

export default radar2;
