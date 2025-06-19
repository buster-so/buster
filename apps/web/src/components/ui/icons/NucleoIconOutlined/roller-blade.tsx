import type { iconProps } from './iconProps';

function rollerBlade(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px roller blade';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M7.696,13.543c-.252,1.259-1.364,2.207-2.696,2.207-1.519,0-2.75-1.231-2.75-2.75s1.231-2.75,2.75-2.75c.759,0,1.447,.308,1.945,.805"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5 13L8.889 9.111"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5,7.5c3.038,0,5.5,2.462,5.5,5.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.55,8.122L13.086,2.586c.643-.643,1.685-.643,2.328,0h0c.643,.643,.643,1.685,0,2.328l-5.552,5.552"
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

export default rollerBlade;
