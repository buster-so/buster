import type { iconProps } from './iconProps';

function copies3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copies 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="8.5"
          width="8.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="1.75"
        />
        <path
          d="M12.721,5.394c.329,.356,.529,.833,.529,1.356v4.5c0,1.105-.895,2-2,2H6.75c-.523,0-.999-.201-1.356-.529"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M15.721,8.394c.329,.356,.529,.833,.529,1.356v4.5c0,1.105-.895,2-2,2h-4.5c-.523,0-.999-.201-1.356-.529"
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

export default copies3;
