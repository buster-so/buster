import type { iconProps } from './iconProps';

function windowUser(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px window user';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h4.521c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75H3.75c-.689,0-1.25-.561-1.25-1.25v-5.25H15.5v2.452c0,.414,.336,.75,.75,.75s.75-.336,.75-.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM4,6c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Zm3,0c-.552,0-1-.448-1-1s.448-1,1-1,1,.448,1,1-.448,1-1,1Z"
          fill="currentColor"
        />
        <path
          d="M16.291,16.346c-.489-1.403-1.811-2.346-3.291-2.346s-2.802,.943-3.291,2.345c-.131,.375-.07,.795,.162,1.123,.237,.333,.621,.532,1.027,.532h4.202c.407,0,.791-.199,1.027-.532,.232-.328,.293-.748,.163-1.123Z"
          fill="currentColor"
        />
        <circle cx="13" cy="11.75" fill="currentColor" r="1.75" />
      </g>
    </svg>
  );
}

export default windowUser;
