import type { iconProps } from './iconProps';

function arrowDownRight(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px arrow down right';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14,14.75c-.192,0-.384-.073-.53-.22L3.22,4.28c-.293-.293-.293-.768,0-1.061s.768-.293,1.061,0L14.53,13.47c.293,.293,.293,.768,0,1.061-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
        <path
          d="M14.25,15h-6.011c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5.261v-5.26c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v6.01c0,.414-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default arrowDownRight;
