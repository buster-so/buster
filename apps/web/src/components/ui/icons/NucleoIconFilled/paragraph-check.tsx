import type { iconProps } from './iconProps';

function paragraphCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px paragraph check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.75,14.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H6.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M6.75,11H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H6.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,7.5H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M15.25,4H2.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75H15.25c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M11.609,15.271c-.198,0-.389-.079-.53-.22l-1.609-1.609c-.293-.293-.293-.768,0-1.061,.293-.293,.768-.293,1.061,0l1.005,1.005,2.877-3.74c.252-.329,.724-.389,1.051-.138,.329,.253,.39,.724,.137,1.052l-3.397,4.417c-.132,.171-.331,.277-.546,.292-.016,0-.032,.001-.048,.001Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default paragraphCheck;
