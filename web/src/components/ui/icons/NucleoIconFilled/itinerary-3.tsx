import type { iconProps } from './iconProps';

function itinerary3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px itinerary 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="5.5" width="5.5" fill="currentColor" rx="1.75" ry="1.75" x="2" y="11" />
        <circle cx="4.75" cy="4.25" fill="currentColor" r="2.75" />
        <path
          d="M13.25,3.5h-4c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4c.689,0,1.25,.561,1.25,1.25v5.5c0,.689-.561,1.25-1.25,1.25h-4c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4c1.517,0,2.75-1.233,2.75-2.75V6.25c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default itinerary3;
