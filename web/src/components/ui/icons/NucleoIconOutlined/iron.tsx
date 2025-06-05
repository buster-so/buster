import type { iconProps } from './iconProps';

function iron(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px iron';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M5,6.25l5.519,.631c2.015,.23,3.778,1.463,4.685,3.278l1.046,2.091H1.75s.587-5.58,.787-7.479c.117-1.111,1.121-1.91,2.23-1.776,1.609,.195,3.218,.39,4.827,.585"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M1.75 14.75L16.25 14.75"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <circle cx="6.75" cy="9.25" fill="currentColor" r=".75" />
        <circle cx="9.75" cy="9.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default iron;
