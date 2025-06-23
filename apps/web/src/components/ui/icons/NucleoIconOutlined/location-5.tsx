import type { iconProps } from './iconProps';

function location5(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px location 5';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M13.429,5.978c0,2.609-4.429,7.272-4.429,7.272,0,0-4.429-4.662-4.429-7.272,0-2.675,2.289-4.228,4.429-4.228s4.429,1.552,4.429,4.228Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.381,11.682l1.023,2.5c.404,.987-.322,2.068-1.388,2.068H3.984c-1.066,0-1.792-1.081-1.388-2.068l1.023-2.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="9"
          cy="6"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default location5;
