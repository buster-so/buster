import type { iconProps } from './iconProps';

function chartLineDot(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px chart line dot';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M15.5,6c-1.93,0-3.5-1.57-3.5-3.5,0-.171,.027-.335,.051-.5H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V5.949c-.165,.024-.329,.051-.5,.051Zm-2.22,2.28l-2.146,2.146c-.487,.487-1.28,.487-1.768,0l-1.616-1.616-1.97,1.97c-.146,.146-.338,.22-.53,.22s-.384-.073-.53-.22c-.293-.293-.293-.768,0-1.061l2.146-2.146c.487-.487,1.28-.487,1.768,0l1.616,1.616,1.97-1.97c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061Z"
          fill="currentColor"
        />
        <circle cx="15.5" cy="2.5" fill="currentColor" r="2" />
      </g>
    </svg>
  );
}

export default chartLineDot;
