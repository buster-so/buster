import type { iconProps } from './iconProps';

function layerDown(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layer down';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.5,10.308l3.835-2.019c.534-.281,.534-1.046,0-1.327l-5.87-3.091c-.292-.154-.64-.154-.932,0L2.663,6.962c-.534,.281-.534,1.046,0,1.327l3.837,2.021"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8L9 16"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M11.5 13.75L9 16.25 6.5 13.75"
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

export default layerDown;
