import type { iconProps } from './iconProps';

function cloudSlash(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px cloud slash';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3.294,14.706L13.461,4.539c-.925-1.521-2.591-2.539-4.461-2.539-2.895,0-5.25,2.355-5.25,5.25,0,.128,.005,.258,.017,.39-1.604,.431-2.767,1.885-2.767,3.61,0,1.552,.948,2.886,2.294,3.456Z"
          fill="currentColor"
        />
        <path
          d="M14.624,6.558L6.182,15h6.318c2.481,0,4.5-2.019,4.5-4.5,0-1.672-.941-3.172-2.376-3.942Z"
          fill="currentColor"
        />
        <path
          d="M2,16.75c-.192,0-.384-.073-.53-.22-.293-.293-.293-.768,0-1.061L15.47,1.47c.293-.293,.768-.293,1.061,0s.293,.768,0,1.061L2.53,16.53c-.146,.146-.338,.22-.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default cloudSlash;
