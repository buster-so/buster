import type { iconProps } from './iconProps';

function ballTennis(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px ball tennis';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m.773,6.227c.077.003.149.023.227.023,2.899,0,5.25-2.351,5.25-5.25,0-.078-.02-.15-.023-.227"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m5.773,11.227c-.003-.077-.023-.149-.023-.227,0-2.899,2.351-5.25,5.25-5.25.078,0,.15.02.227.023"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="6"
          cy="6"
          fill="none"
          r="5.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default ballTennis;
