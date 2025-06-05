import type { iconProps } from './iconProps';

function itinerary4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px itinerary 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <rect height="5.5" width="5.5" fill="currentColor" rx="1.75" ry="1.75" x="11" y="11" />
        <circle cx="4.25" cy="4.25" fill="currentColor" r="2.75" />
        <path
          d="M10.78,9.72l-2.75-2.75c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l2.75,2.75c.146,.146,.338,.22,.53,.22s.384-.073,.53-.22c.293-.293,.293-.768,0-1.061Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default itinerary4;
