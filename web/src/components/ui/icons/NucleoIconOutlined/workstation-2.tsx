import type { iconProps } from './iconProps';

function workstation2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px workstation 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M11.75 11.75L11.75 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.75,14.75L.95,10.95c-.23-.23-.253-.595-.053-.852l.854-1.098"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.75 14.75L2.25 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.25 14.75L9.25 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.502,11.602c.231,.094,.483,.148,.748,.148h7c1.105,0,2-.896,2-2V5.25c0-1.104-.895-2-2-2h-6.17"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M4.293,5.18l-.974-.67c-.323-.222-.764-.14-.986,.183l-.457,.665c-.222,.323-.14,.764,.183,.986l.974,.67c.779,.536,.475,2.622,2.046,3.702l3.404-4.951c-1.546-1.063-3.409-.049-4.189-.585Z"
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

export default workstation2;
