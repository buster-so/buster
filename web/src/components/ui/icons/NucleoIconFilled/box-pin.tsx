import type { iconProps } from './iconProps';

function boxPin(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box pin';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,1.5h-2.009c-1.052,0-1.996,.586-2.464,1.529l-.348,.703c.418-.138,.857-.231,1.321-.231h3.5V1.5Z"
          fill="currentColor"
        />
        <path
          d="M14.223,3.028c-.468-.942-1.412-1.528-2.464-1.528h-2.009V3.5h3.5c.464,0,.903,.093,1.322,.231l-.348-.703Z"
          fill="currentColor"
        />
        <path
          d="M9.5,13.5c0-2.757,2.243-5,5-5,.526,0,1.023,.104,1.5,.255v-1.005c0-1.517-1.233-2.75-2.75-2.75h-3.5v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.75h-3.5c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h5.398c-.385-.723-.648-1.555-.648-2.5Z"
          fill="currentColor"
        />
        <path
          d="M14.5,10c-1.93,0-3.5,1.57-3.5,3.5,0,2.655,3.011,4.337,3.14,4.408,.112,.062,.236,.092,.36,.092s.248-.031,.36-.092c.129-.07,3.14-1.753,3.14-4.408,0-1.93-1.57-3.5-3.5-3.5Zm0,4.25c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75,.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default boxPin;
