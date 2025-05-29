import type { iconProps } from './iconProps';

function shapes(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px shapes';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <circle cx="13.5" cy="6" fill="currentColor" r="4" />
        <rect height="7" width="7" fill="currentColor" rx="1.75" ry="1.75" x="4" y="10" />
        <path
          d="M7.963,7.373c.222-.387,.221-.867-.004-1.252L5.33,1.611c-.454-.775-1.705-.775-2.159,0,0,0,0,0,0,0L.541,6.121c-.225,.385-.226,.865-.004,1.252,.223,.387,.638,.627,1.084,.627H6.879c.446,0,.861-.24,1.084-.627Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default shapes;
