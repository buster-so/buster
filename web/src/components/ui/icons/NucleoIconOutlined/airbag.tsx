import type { iconProps } from './iconProps';

function airbag(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px airbag';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle
          cx="12"
          cy="6"
          fill="none"
          r="3.25"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle
          cx="3.25"
          cy="5.25"
          fill="none"
          r="1.5"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.692,8.981l1.25,2.433c.343,.667,1.029,1.086,1.779,1.086h1.927c.371,0,.711,.205,.884,.533l1.569,2.967"
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

export default airbag;
