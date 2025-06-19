import type { iconProps } from './iconProps';

function airplay(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px airplay';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m10.445,9.345h0c.486-.365.805-.941.805-1.595V3.25c0-1.105-.895-2-2-2H2.75C1.645,1.25.75,2.145.75,3.25v4.5c0,.655.319,1.23.805,1.595h0"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6.2,7.865l2.249,2.985c.124.165.007.4-.2.4H3.751c-.206,0-.324-.236-.2-.4l2.249-2.985c.1-.133.299-.133.399,0Z"
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

export default airplay;
