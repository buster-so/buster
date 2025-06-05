import type { iconProps } from './iconProps';

function folders(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folders';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.25,11c-1.241,0-2.25-1.009-2.25-2.25V3.25c0-1.241,1.009-2.25,2.25-2.25h1.351c.62,0,1.218,.259,1.642,.712l1.207,1.288h3.301c1.241,0,2.25,1.009,2.25,2.25v2c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-2c0-.414-.336-.75-.75-.75h-3.626c-.208,0-.406-.086-.547-.237l-1.429-1.525c-.141-.151-.341-.237-.547-.237h-1.351c-.414,0-.75,.336-.75,.75v5.5c0,.414,.336,.75,.75,.75s.75,.336,.75,.75-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M14.75,9h-3.301l-1.207-1.288c-.424-.453-1.022-.712-1.642-.712h-1.351c-1.241,0-2.25,1.009-2.25,2.25v5.5c0,1.241,1.009,2.25,2.25,2.25h7.5c1.241,0,2.25-1.009,2.25-2.25v-3.5c0-1.241-1.009-2.25-2.25-2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default folders;
