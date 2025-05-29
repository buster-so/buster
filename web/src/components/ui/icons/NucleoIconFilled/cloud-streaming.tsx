import type { iconProps } from './iconProps';

function cloudStreaming(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud streaming';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.757,4.5c-.642-2.065-2.542-3.5-4.757-3.5s-4.115,1.435-4.757,3.5c-1.789,.004-3.243,1.46-3.243,3.25s1.458,3.25,3.25,3.25H13.75c1.792,0,3.25-1.458,3.25-3.25s-1.454-3.246-3.243-3.25Zm-3.053,2.572l-2.308,1.346c-.397,.232-.896-.055-.896-.515v-2.693c0-.46,.499-.747,.896-.515l2.308,1.346c.394,.23,.394,.8,0,1.03Z"
          fill="currentColor"
        />
        <path
          d="M16.25,15h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M8.75,11.75c-.414,0-.75,.336-.75,.75v1H1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6.25v1c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudStreaming;
