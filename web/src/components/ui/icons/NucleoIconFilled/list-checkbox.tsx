import type { iconProps } from './iconProps';

function listCheckbox(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px list checkbox';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.25,4.5h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M16.25,12h-6c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h6c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M6.406,2.126l-2.877,3.74-.755-.755c-.293-.293-.768-.293-1.061,0s-.293,.768,0,1.061l1.359,1.359c.141,.141,.332,.22,.53,.22,.016,0,.032,0,.049-.001,.215-.014,.414-.12,.545-.291L7.594,3.041c.253-.329,.191-.799-.137-1.052-.33-.253-.799-.191-1.052,.137Z"
          fill="currentColor"
        />
        <rect height="6" width="6" fill="currentColor" rx="1.75" ry="1.75" x="1.5" y="10" />
      </g>
    </svg>
  );
}

export default listCheckbox;
