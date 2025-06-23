import type { iconProps } from './iconProps';

function house6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px house 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 16L9 12.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25,8.75v5.5c0,1.105-.895,2-2,2H5.75c-1.105,0-2-.895-2-2v-5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2 7L9 1.75 16 7"
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

export default house6;
