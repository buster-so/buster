import type { iconProps } from './iconProps';

function numbers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px numbers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M8.969,6.931c.4-1.423,1.78-2.202,3.27-2.181,1.491,.022,2.893,.689,2.981,2.181s-1.491,2.491-3.127,3.159c-1.635,.668-2.992,1.291-3.127,3.16h6.258"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.25,13.25V4.75s-.974,1.712-3.04,2.108"
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

export default numbers;
