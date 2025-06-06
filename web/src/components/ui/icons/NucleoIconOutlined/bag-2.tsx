import type { iconProps } from './iconProps';

function bag2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px bag 2';

  return (
    <svg height="16" width="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M3.05 5.12h9.92a0.89 0.89 0 0 1 0.89 0.82l0.45 5.71a1.78 1.78 0 0 1-1.77 1.92h-9.06a1.78 1.78 0 0 1-1.77-1.92l0.45-5.71a0.89 0.89 0 0 1 0.89-0.82z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6.9 8.9h2.22q0.67 0 0.67 0.67v0.44q0 0.67-0.67 0.67h-2.22q-0.67 0-0.67-0.67v-0.44q0-0.67 0.67-0.67z"
          fill="currentColor"
        />
        <path
          d="M5.56 6.9v-2.9a2.45 2.45 0 1 1 4.9 0v2.9"
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

export default bag2;
