import type { iconProps } from './iconProps';

function medicine(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px medicine';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.58 7.58L5.22 5.22"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.652 9.348L9.348 14.652"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.215,5.76c.201-.93-.054-1.939-.777-2.662-1.131-1.131-2.965-1.131-4.096,0L3.098,7.341c-1.131,1.131-1.131,2.965,0,4.096,.724,.724,1.734,.979,2.665,.776"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="12"
          cy="12"
          fill="none"
          r="3.75"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default medicine;
