import type { iconProps } from './iconProps';

function ticket4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ticket 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <circle cx="6.75" cy="7.563" fill="currentColor" r=".75" />
        <circle cx="6.75" cy="10.437" fill="currentColor" r=".75" />
        <path
          d="M14.25,3.75h-6c0,.828-.672,1.5-1.5,1.5s-1.5-.672-1.5-1.5h-1.5c-1.105,0-2,.896-2,2v6.5c0,1.104,.895,2,2,2h1.5c0-.828,.672-1.5,1.5-1.5s1.5,.672,1.5,1.5h6c1.105,0,2-.896,2-2V5.75c0-1.104-.895-2-2-2Z"
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

export default ticket4;
