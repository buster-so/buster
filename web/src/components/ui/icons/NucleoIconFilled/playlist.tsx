import type { iconProps } from './iconProps';

function playlist(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px playlist';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2.5H4.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H13.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M13.75,4H4.25c-1.517,0-2.75,1.233-2.75,2.75v6.5c0,1.517,1.233,2.75,2.75,2.75H13.75c1.517,0,2.75-1.233,2.75-2.75V6.75c0-1.517-1.233-2.75-2.75-2.75Zm-2.587,6.587l-3.14,1.832c-.107,.062-.225,.094-.343,.094-.117,0-.233-.031-.339-.092-.213-.123-.341-.343-.341-.589v-3.663c0-.246,.127-.467,.341-.589,.213-.123,.468-.123,.682,.001l3.14,1.832c.211,.123,.337,.343,.337,.587s-.126,.464-.337,.587Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default playlist;
