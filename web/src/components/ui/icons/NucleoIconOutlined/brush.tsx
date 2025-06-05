import type { iconProps } from './iconProps';

function brush(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px brush';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M10.75 1.75L10.75 5.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,8.75V3.75c0-1.105,.895-2,2-2H14.25v7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3.75,8.75v1.5c0,1.104,.895,2,2,2h2l-.25,3.5c0,.828,.672,1.5,1.5,1.5s1.5-.672,1.5-1.5l-.25-3.5h2c1.105,0,2-.896,2-2v-1.5H3.75Z"
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

export default brush;
