import type { iconProps } from './iconProps';

function sidebarLeft5Hide(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px sidebar left 5 hide';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75ZM6.5,12.25c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5Zm5.53-1.53c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22l-2.25-2.25c-.293-.293-.293-.768,0-1.061l2.25-2.25c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061l-1.72,1.72,1.72,1.72Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default sidebarLeft5Hide;
