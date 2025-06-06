import type { iconProps } from './iconProps';

function tableColsMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px table cols minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8.25,2h-3.5c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75h3.5V2Z"
          fill="currentColor"
        />
        <path
          d="M11.75,12h4.25V4.75c0-1.517-1.233-2.75-2.75-2.75h-3.5V13.241c.371-.732,1.124-1.241,2-1.241Z"
          fill="currentColor"
        />
        <path
          d="M16.75,13.5h-5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h5c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default tableColsMinus;
