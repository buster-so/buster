import type { iconProps } from './iconProps';

function checkUnderline(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px check underline';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M7,12.5c-.228,0-.443-.104-.586-.281l-3-3.75c-.259-.324-.206-.795,.117-1.054,.323-.258,.795-.207,1.055,.117l2.404,3.006L13.389,2.283c.253-.327,.727-.388,1.052-.133,.328,.254,.388,.725,.134,1.052L7.593,12.209c-.141,.182-.357,.289-.587,.291h-.006Z"
          fill="currentColor"
        />
        <path
          d="M15.25,16H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default checkUnderline;
