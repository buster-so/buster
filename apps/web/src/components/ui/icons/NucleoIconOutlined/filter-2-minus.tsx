import type { iconProps } from './iconProps';

function filter2Minus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px filter 2 minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.5,15.25v1h-3v-7.25L3.106,5.3c-.226-.19-.356-.47-.356-.765v-1.785H15.25v1.785c0,.295-.13,.575-.356,.765l-4.394,3.7v1.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25 12.75L11.25 12.75"
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

export default filter2Minus;
