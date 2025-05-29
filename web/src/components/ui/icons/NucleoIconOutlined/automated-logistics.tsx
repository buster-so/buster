import type { iconProps } from './iconProps';

function automatedLogistics(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px automated logistics';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <rect
          height="5.5"
          width="5.5"
          fill="none"
          rx="1"
          ry="1"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="6.25"
          y="10.75"
        />
        <path
          d="M1.75,10.75h1c.552,0,1,.448,1,1v3.5c0,.552-.448,1-1,1H1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,10.75h-1c-.552,0-1,.448-1,1v3.5c0,.552,.448,1,1,1h1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 10.75L9 13"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5,8.25l.394-2.362c.065-.388-.104-.778-.432-.996l-2.462-1.641-2.462,1.641c-.327,.218-.496,.608-.432,.996l.394,2.362"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 0.75L9 3.25"
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

export default automatedLogistics;
