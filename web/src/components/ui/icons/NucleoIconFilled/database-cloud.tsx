import type { iconProps } from './iconProps';

function databaseCloud(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px database cloud';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,12c3.371,0,7-.939,7-3V4.25c0-2.061-3.629-3-7-3s-7,.939-7,3V13.75c0,1.876,3.123,2.85,6.218,2.983,.011,0,.021,0,.033,0,.399,0,.731-.315,.748-.718,.019-.414-.303-.764-.717-.782-3.155-.136-4.782-1.102-4.782-1.484v-2.806c1.369,.715,3.478,1.056,5.5,1.056Zm0-1.5c-3.572,0-5.5-1.064-5.5-1.5v-2.806c1.369,.715,3.478,1.056,5.5,1.056s4.131-.341,5.5-1.056v2.806c0,.436-1.928,1.5-5.5,1.5Z"
          fill="currentColor"
        />
        <path
          d="M15,12c-1.187,0-2.241,.714-2.72,1.756-1.221-.084-2.28,.896-2.28,2.119,0,1.172,.953,2.125,2.125,2.125h2.875c1.654,0,3-1.346,3-3s-1.346-3-3-3Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default databaseCloud;
