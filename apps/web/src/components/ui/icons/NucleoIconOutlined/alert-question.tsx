import type { iconProps } from './iconProps';

function alertQuestion(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px alert question';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m5.604,5.104c.6929-1.6196,1.74-2.442,3.568-2.442,1.578,0,2.975.947,2.975,2.959,0,2.832-3.522,2.243-3.522,5.629"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m8.658,16c.551,0,1-.449,1-1s-.449-1-1-1-1,.449-1,1,.449,1,1,1Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default alertQuestion;
