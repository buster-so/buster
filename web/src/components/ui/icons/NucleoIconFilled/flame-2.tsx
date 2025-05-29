import type { iconProps } from './iconProps';

function flame2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px flame 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="m9.4731,1.168c-.1597-.1299-.3647-.1904-.5693-.1616-.2041.0264-.3882.1353-.5093.3013l-2.9692,4.0625-1.0122-.5625c-.2109-.1172-.4683-.125-.688-.021-.2192.105-.374.3096-.4155.5493-.0732.4253-.7183,4.1865-.7183,5.1523,0,4.0762,3.2583,6.5117,6.4087,6.5117s6.4087-2.4355,6.4087-6.5117c0-4.4463-5.6934-9.1235-5.9355-9.3203Zm-.4731,14.332c-1.3838,0-2.5098-1.1592-2.5098-2.5835,0-2.0791,1.8843-4.0967,1.9648-4.1816.2832-.2998.8066-.2998,1.0898,0,.0806.085,1.9648,2.1025,1.9648,4.1816,0,1.4243-1.126,2.5835-2.5098,2.5835Z"
          fill="currentColor"
          strokeWidth="0"
        />
      </g>
    </svg>
  );
}

export default flame2;
