import type { iconProps } from './iconProps';

function designFilePlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px design file plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.5,16.75v-.25h-.25c-1.241,0-2.25-1.009-2.25-2.25s1.009-2.25,2.25-2.25h.25v-.25c0-1.241,1.009-2.25,2.25-2.25,.086,0,.167,.016,.25,.025v-2.861c0-.467-.182-.907-.513-1.237l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H3.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H12.525c-.009-.083-.025-.164-.025-.25ZM3.528,7.648c-.125-.217-.123-.486,.003-.702l1.33-2.279c.249-.428,.957-.43,1.208,0l1.33,2.28c.126,.215,.127,.483,.003,.701s-.357,.352-.607,.352h-2.659c-.25,0-.483-.135-.607-.352Zm4.972,4.952c0,.496-.404,.9-.9,.9h-1.699c-.496,0-.9-.404-.9-.9v-1.7c0-.496,.404-.9,.9-.9h1.699c.496,0,.9,.404,.9,.9v1.7Zm0-4.6c0-1.103,.897-2,2-2s2,.897,2,2-.897,2-2,2-2-.897-2-2Z"
          fill="currentColor"
        />
        <path
          d="M17.25,13.5h-1.75v-1.75c0-.414-.336-.75-.75-.75s-.75,.336-.75,.75v1.75h-1.75c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.75v1.75c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-1.75h1.75c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default designFilePlus;
