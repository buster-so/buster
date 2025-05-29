import type { iconProps } from './iconProps';

function uTurnToUp(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px u turn to up';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m4.25,11.5c-1.792,0-3.25-1.458-3.25-3.25v-1.25c0-.414.336-.75.75-.75s.75.336.75.75v1.25c0,.965.785,1.75,1.75,1.75s1.75-.785,1.75-1.75V1.25c0-.414.336-.75.75-.75s.75.336.75.75v7c0,1.792-1.458,3.25-3.25,3.25Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m10,5c-.192,0-.384-.073-.53-.22l-2.72-2.72-2.72,2.72c-.293.293-.768.293-1.061,0s-.293-.768,0-1.061L6.22.47c.293-.293.768-.293,1.061,0l3.25,3.25c.293.293.293.768,0,1.061-.146.146-.338.22-.53.22Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default uTurnToUp;
