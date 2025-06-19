import type { iconProps } from './iconProps';

function ban(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px ban';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M0.751 5.25H11.25V6.75H0.751z"
          fill="currentColor"
          strokeWidth="0"
          transform="rotate(-45 6 6)"
        />
        <path
          d="m6,12c-3.309,0-6-2.691-6-6S2.691,0,6,0s6,2.691,6,6-2.691,6-6,6Zm0-10.5C3.519,1.5,1.5,3.519,1.5,6s2.019,4.5,4.5,4.5,4.5-2.019,4.5-4.5S8.481,1.5,6,1.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default ban;
