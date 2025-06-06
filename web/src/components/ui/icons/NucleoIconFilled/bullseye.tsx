import type { iconProps } from './iconProps';

function bullseye(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bullseye';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,17c-4.411,0-8-3.589-8-8S4.589,1,9,1s8,3.589,8,8-3.589,8-8,8Zm0-14.5c-3.584,0-6.5,2.916-6.5,6.5s2.916,6.5,6.5,6.5,6.5-2.916,6.5-6.5-2.916-6.5-6.5-6.5Z"
          fill="currentColor"
        />
        <path
          d="M9,14c-2.757,0-5-2.243-5-5s2.243-5,5-5,5,2.243,5,5-2.243,5-5,5Zm0-8.5c-1.93,0-3.5,1.57-3.5,3.5s1.57,3.5,3.5,3.5,3.5-1.57,3.5-3.5-1.57-3.5-3.5-3.5Z"
          fill="currentColor"
        />
        <circle cx="9" cy="9" fill="currentColor" r="2" />
      </g>
    </svg>
  );
}

export default bullseye;
