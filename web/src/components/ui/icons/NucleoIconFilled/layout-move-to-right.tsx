import type { iconProps } from './iconProps';

function layoutMoveToRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px layout move to right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,2H3.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H14.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-3.97,7.53l-2.121,2.121c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l.841-.841h-2.689c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h2.689l-.841-.841c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0l2.121,2.121c.293,.293,.293,.768,0,1.061Zm3.72,2.72c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75V5.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.5Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default layoutMoveToRight;
