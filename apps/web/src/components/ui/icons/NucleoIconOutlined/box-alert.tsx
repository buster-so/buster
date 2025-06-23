import type { iconProps } from './iconProps';

function boxAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9 2.25L9 8.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M3,6.284l1.449-2.922c.338-.681,1.032-1.112,1.792-1.112h5.518c.76,0,1.454,.431,1.792,1.112l1.449,2.923"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M14.75,14.56c.307-.352,.5-.806,.5-1.31V7.25c0-1.104-.895-2-2-2H4.75c-1.105,0-2,.896-2,2v6c0,1.104,.895,2,2,2h5"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M12.25 15L12.25 12.25"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="12.25" cy="17.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default boxAlert;
