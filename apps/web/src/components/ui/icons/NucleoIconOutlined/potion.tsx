import type { iconProps } from './iconProps';

function potion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px potion';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="7.25" cy="8.75" fill="currentColor" r=".75" />
        <path
          d="M14.19,11.794c-1.322-1.469-3.502-1.806-5.209-.794-1.693,1.004-3.852,.68-5.177-.759"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M5.75 1.75L12.25 1.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M7.25,1.75V6.072c-2.034,.723-3.5,2.646-3.5,4.928,0,2.899,2.351,5.25,5.25,5.25s5.25-2.351,5.25-5.25c0-2.283-1.466-4.205-3.5-4.929V1.75"
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

export default potion;
