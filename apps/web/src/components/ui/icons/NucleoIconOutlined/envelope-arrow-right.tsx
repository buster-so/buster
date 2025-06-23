import type { iconProps } from './iconProps';

function envelopeArrowRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px envelope arrow right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M1.75,5.75l6.767,3.733c.301,.166,.665,.166,.966,0l6.767-3.733"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75 11.25L17.25 13.75 14.75 16.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M16.25,9.264V5.25c0-1.104-.895-2-2-2H3.75c-1.105,0-2,.896-2,2v7.5c0,1.104,.895,2,2,2h6.211"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M17.25 13.75L12.25 13.75"
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

export default envelopeArrowRight;
