import type { iconProps } from './iconProps';

function feather2Plus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px feather 2 plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.25 1L3.25 5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.5 3.25L1 3.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,14v-4.268c0-.53,.211-1.039,.586-1.414L10.22,3.434c1.407-1.407,3.689-1.407,5.096,0h0c1.407,1.407,1.407,3.689,0,5.096l-4.884,4.884c-.375,.375-.884,.586-1.414,.586h-.733"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M2.5 16.25L9.25 9.5"
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

export default feather2Plus;
