import type { iconProps } from './iconProps';

function toggle2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px toggle 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m7.5,1.5h-3C2.019,1.5,0,3.519,0,6s2.019,4.5,4.5,4.5h3c2.481,0,4.5-2.019,4.5-4.5S9.981,1.5,7.5,1.5Zm-3,7c-1.381,0-2.5-1.119-2.5-2.5s1.119-2.5,2.5-2.5,2.5,1.119,2.5,2.5-1.119,2.5-2.5,2.5Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default toggle2;
