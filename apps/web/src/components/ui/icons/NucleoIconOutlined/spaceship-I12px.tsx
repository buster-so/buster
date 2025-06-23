import type { iconProps } from './iconProps';

function spaceship(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px spaceship';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m3.054,6.284l-1.386,1.2c-.258.223-.384.562-.335.9l.417,2.866,2.301-1.5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.949,9.75l2.301,1.5.417-2.866c.049-.337-.077-.676-.335-.9l-1.386-1.2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m6,9.75h1.949c1.869-3.883,1.108-6.844-1.949-9-3.057,2.156-3.818,5.117-1.949,9h1.949Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M6 11.25L6 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6" cy="4.25" fill="currentColor" r=".75" strokeWidth="0" />
      </g>
    </svg>
  );
}

export default spaceship;
