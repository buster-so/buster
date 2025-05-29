import type { iconProps } from './iconProps';

function house6(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px house 6';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m11.25,4.548c-.128,0-.257-.033-.376-.102L6,1.617,1.126,4.446c-.356.208-.817.086-1.025-.272-.208-.358-.086-.817.272-1.025L5.624.102c.232-.136.521-.136.753,0l5.25,3.048c.358.208.48.667.272,1.025-.139.24-.391.374-.649.374Z"
          fill="currentColor"
          strokeWidth="0"
        />
        <path
          d="m6,3.352L1,6.254v3.496c0,.965.785,1.75,1.75,1.75h2.5v-2.25c0-.414.336-.75.75-.75s.75.336.75.75v2.25h2.5c.965,0,1.75-.785,1.75-1.75v-3.496l-5-2.903Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default house6;
