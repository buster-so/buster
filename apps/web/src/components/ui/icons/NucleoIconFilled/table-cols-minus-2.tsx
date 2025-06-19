import type { iconProps } from './iconProps';

function tableColsMinus2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table cols minus 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M5.5,2h-1.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h1.75V2Z"
          fill="currentColor"
        />
        <path
          d="M10,14.75c0-.778,.398-1.465,1-1.869V2H7v14h3.381c-.24-.358-.381-.788-.381-1.25Z"
          fill="currentColor"
        />
        <path d="M17,12.5V4.75c0-1.517-1.233-2.75-2.75-2.75h-1.75V12.5h4.5Z" fill="currentColor" />
        <path
          d="M17.25,14h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColsMinus2;
