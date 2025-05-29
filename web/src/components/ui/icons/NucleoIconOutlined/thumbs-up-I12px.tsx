import type { iconProps } from './iconProps';

function thumbsUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px thumbs up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m7,4.75l.638-2.031c.225-.716-.114-1.488-.794-1.807l-.345-.162-2.802,3.449c-.29.357-.448.802-.448,1.261v3.79c0,1.105.895,2,2,2h3.229c.878,0,1.653-.573,1.912-1.412l.769-2.5c.396-1.286-.566-2.588-1.912-2.588h-2.249Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M0.75 10.75L0.75 5.25"
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

export default thumbsUp;
