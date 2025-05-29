import type { iconProps } from './iconProps';

function asterisk(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px asterisk';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M9,16.5c-.414,0-.75-.336-.75-.75V2.25c0-.414,.336-.75,.75-.75s.75,.336,.75,.75V15.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.845,13.125c-.127,0-.256-.032-.374-.101L2.779,6.274c-.358-.207-.481-.666-.274-1.024,.206-.358,.665-.483,1.024-.274l11.691,6.75c.358,.207,.481,.666,.274,1.024-.139,.241-.391,.375-.65,.375Z"
          fill="currentColor"
        />
        <path
          d="M3.155,13.125c-.26,0-.512-.134-.65-.375-.207-.359-.084-.817,.274-1.024L14.471,4.976c.36-.208,.817-.083,1.024,.274,.207,.359,.084,.817-.274,1.024L3.529,13.024c-.118,.068-.247,.101-.374,.101Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default asterisk;
