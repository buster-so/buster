import type { iconProps } from './iconProps';

function layerFront(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layer front';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M15.736,11.875c0,.261-.134,.523-.401,.664l-5.87,3.091c-.292,.154-.64,.154-.932,0l-5.87-3.091c-.267-.141-.401-.402-.401-.664"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 8.25L9 1"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 3L9 0.75 11.25 3"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.5,5.942l-3.835,2.019c-.534,.281-.534,1.046,0,1.327l5.87,3.091c.292,.154,.64,.154,.932,0l5.87-3.091c.534-.281,.534-1.046,0-1.327l-3.837-2.021"
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

export default layerFront;
