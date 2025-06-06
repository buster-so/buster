import type { iconProps } from './iconProps';

function investment(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px investment';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="3.75"
          fill="none"
          r="3"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9 3L9 4.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5,13.25H13l-.716,2.864c-.167,.668-.767,1.136-1.455,1.136h-3.658c-.688,0-1.288-.468-1.455-1.136l-.716-2.864Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M8.103,10.01c-.133,.085-1.995,1.242-3.978,.334-1.486-.68-2.022-2.053-2.125-2.336,.156-.051,3.018-.924,5.219,.992,1.625,1.415,1.762,3.371,1.781,3.75v.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9.897,10.01c.133,.085,1.995,1.242,3.978,.334,1.486-.68,2.022-2.053,2.125-2.336-.156-.051-3.018-.924-5.219,.992-1.625,1.415-1.762,3.371-1.781,3.75v.5"
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

export default investment;
