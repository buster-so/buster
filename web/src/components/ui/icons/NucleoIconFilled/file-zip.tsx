import type { iconProps } from './iconProps';

function fileZip(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file zip';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.487,5.427l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V6.664c0-.467-.182-.907-.513-1.237Zm-6.987,7.573c0,.276-.224,.5-.5,.5h-2c-.276,0-.5-.224-.5-.5v-2c0-.827,.673-1.5,1.5-1.5s1.5,.673,1.5,1.5v2Zm.25-7.5h-1.75v1.5h1.75v1.5h-1.75v-1.5h-1.75v-1.5h1.75v-1.5h-1.75v-1.5h1.75v1.5h1.75v1.5Zm5.682,1h-2.932c-.55,0-1-.45-1-1V2.579c.009-.004,.004-.001,.013-.005l3.922,3.921s-.001,.003-.002,.005Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default fileZip;
