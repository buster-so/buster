import type { iconProps } from './iconProps';

function textPrompt(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text prompt';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M8,12.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.205,8.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.205c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,4.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.585,12.579l-1.776-.888-.888-1.776c-.254-.508-1.088-.508-1.342,0l-.888,1.776-1.776,.888c-.254,.127-.415,.387-.415,.671s.161,.544,.415,.671l1.776,.888,.888,1.776c.127,.254,.387,.415,.671,.415s.544-.161,.671-.415l.888-1.776,1.776-.888c.254-.127,.415-.387,.415-.671s-.161-.544-.415-.671Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textPrompt;
