import type { iconProps } from './iconProps';

function link3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px link 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75,9.25c0,1.105-.895,2-2,2H3.75c-1.105,0-2-.895-2-2V5.25c0-1.105,.895-2,2-2h6c.753,0,1.409,.416,1.75,1.032"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.25,8.75c0-1.105,.895-2,2-2h6c1.105,0,2,.895,2,2v4c0,1.105-.895,2-2,2h-6c-.753,0-1.409-.416-1.75-1.032"
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

export default link3;
