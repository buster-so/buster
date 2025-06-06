import type { iconProps } from './iconProps';

function curve(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px curve';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,15.5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75c4.058,0,4.707-2.296,5.528-5.204,.834-2.951,1.779-6.296,6.972-6.296,.414,0,.75,.336,.75,.75s-.336,.75-.75,.75c-4.058,0-4.707,2.296-5.528,5.204-.834,2.951-1.779,6.296-6.972,6.296Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default curve;
