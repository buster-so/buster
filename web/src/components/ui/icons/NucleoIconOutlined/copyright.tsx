import type { iconProps } from './iconProps';

function copyright(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px copyright';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="9"
          cy="9"
          fill="none"
          r="7.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.312,10.76c-.63,1.184-1.877,1.99-3.312,1.99-2.071,0-3.75-1.679-3.75-3.75s1.679-3.75,3.75-3.75c1.435,0,2.682,.806,3.312,1.99"
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

export default copyright;
