import type { iconProps } from './iconProps';

function bookOpen3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px book open 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="M9,16.25c0-1.105,.895-2,2-2h4.25c.552,0,1-.448,1-1V3.75c0-.552-.448-1-1-1h-4.25c-1.105,0-2,.895-2,2"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="M9,16.25V4.75c0-1.105-.895-2-2-2H2.75c-.552,0-1,.448-1,1V13.25c0,.552,.448,1,1,1H7c1.105,0,2,.895,2,2Z"
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

export default bookOpen3;
