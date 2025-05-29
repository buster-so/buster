import type { iconProps } from './iconProps';

function deskNamePlate(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px desk name plate';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.164,5.585l-1.696,6.409c-.168,.634,.31,1.256,.967,1.256h.165"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.164,4.75H13.845c.454,0,.851,.305,.967,.744l1.721,6.5c.168,.634-.31,1.256-.967,1.256H5.885c-.454,0-.851-.305-.967-.744l-1.721-6.5c-.168-.634,.31-1.256,.967-1.256Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.865 7.75L12.365 7.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.615 10.25L13.115 10.25"
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

export default deskNamePlate;
