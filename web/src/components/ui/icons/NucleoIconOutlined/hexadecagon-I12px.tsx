import type { iconProps } from './iconProps';

function hexadecagon(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px hexadecagon';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m11.177,5.86l-1.427-1.418v-1.995c0-.109-.088-.197-.197-.197h-1.995l-1.418-1.427c-.077-.078-.203-.078-.28,0l-1.418,1.427h-1.995c-.109,0-.197.088-.197.197v1.995l-1.427,1.418c-.078.077-.078.203,0,.28l1.427,1.418v1.995c0,.109.088.197.197.197h1.995l1.418,1.427c.077.078.203.078.28,0l1.418-1.427h1.995c.109,0,.197-.088.197-.197v-1.995l1.427-1.418c.078-.077.078-.203,0-.28Z"
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

export default hexadecagon;
