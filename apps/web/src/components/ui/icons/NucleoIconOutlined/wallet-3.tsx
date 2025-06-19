import type { iconProps } from './iconProps';

function wallet3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px wallet 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,8.25c0-1.105,.895-2,2-2H14.25c1.105,0,2,.895,2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,9.25h-4c-.552,0-1,.448-1,1v.5c0,.552-.448,1-1,1h-2.5c-.552,0-1-.448-1-1v-.5c0-.552-.448-1-1-1H1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <rect
          height="11.5"
          width="14.5"
          fill="none"
          rx="2"
          ry="2"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
          x="1.75"
          y="3.25"
        />
      </g>
    </svg>
  );
}

export default wallet3;
