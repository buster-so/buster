import type { iconProps } from './iconProps';

function label3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px label 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m8.132,2.088l2.868,3.25c.334.378.334.945,0,1.323l-2.868,3.25c-.19.215-.463.338-.75.338H2.75c-1.105,0-2-.895-2-2V3.75c0-1.105.895-2,2-2h4.633c.287,0,.56.123.75.338Z"
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

export default label3;
