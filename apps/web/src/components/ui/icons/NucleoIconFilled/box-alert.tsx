import type { iconProps } from './iconProps';

function boxAlert(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px box alert';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,1.5h-2.009c-1.052,0-1.996,.586-2.464,1.529l-.348,.703c.418-.138,.857-.231,1.321-.231h3.5V1.5Z"
          fill="currentColor"
        />
        <path
          d="M14.223,3.028c-.468-.942-1.412-1.528-2.464-1.528h-2.009V3.5h3.5c.464,0,.903,.093,1.322,.231l-.348-.703Z"
          fill="currentColor"
        />
        <path
          d="M13.25,5h-3.5v2.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2.75h-3.5c-1.517,0-2.75,1.233-2.75,2.75v5.5c0,1.517,1.233,2.75,2.75,2.75h5.509c-.155-.303-.259-.637-.259-1v-2.75c0-1.241,1.009-2.25,2.25-2.25s2.25,1.009,2.25,2.25v2.75c0,.276-.068,.531-.162,.773,.976-.423,1.662-1.394,1.662-2.523V7.75c0-1.517-1.233-2.75-2.75-2.75Z"
          fill="currentColor"
        />
        <path
          d="M12.25,15.75c-.414,0-.75-.336-.75-.75v-2.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v2.75c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <circle cx="12.25" cy="17.25" fill="currentColor" r=".75" />
      </g>
    </svg>
  );
}

export default boxAlert;
