import type { iconProps } from './iconProps';

function messageStar(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px message star';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M16.25,8.979V4.25c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v7c0,1.104,.895,2,2,2h2v3l2.981-2.385"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14 10.068L15.004 12.103 17.25 12.429 15.625 14.013 16.009 16.25 14 15.194 11.991 16.25 12.375 14.013 10.75 12.429 12.996 12.103 14 10.068z"
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

export default messageStar;
