import type { iconProps } from './iconProps';

function cylinder(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cylinder';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.5,4.25v7.636c-2.306-1.125-6.694-1.125-9,0V4.25h-1.5V13.75c0,1.805,3.019,2.75,6,2.75s6-.945,6-2.75V4.25h-1.5Zm-4.5,10.75c-2.953,0-4.5-.929-4.5-1.25s1.547-1.25,4.5-1.25,4.5,.929,4.5,1.25-1.547,1.25-4.5,1.25Z"
          fill="currentColor"
        />
        <path
          d="M3,4.25c0,1.805,3.019,2.75,6,2.75s6-.945,6-2.75C15,.64,3,.64,3,4.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cylinder;
