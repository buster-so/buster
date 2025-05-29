import type { iconProps } from './iconProps';

function layers(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px layers';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m6.405,1.362l4.087,2.437c.343.205.343.699,0,.904l-4.087,2.437c-.249.149-.561.149-.81,0L1.507,4.702c-.343-.205-.343-.699,0-.904L5.595,1.362c.249-.149.561-.149.81,0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m10.493,7.298c.343.205.343.699,0,.904l-4.087,2.437c-.249.149-.561.149-.81,0l-4.087-2.437c-.343-.205-.343-.699,0-.904"
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

export default layers;
