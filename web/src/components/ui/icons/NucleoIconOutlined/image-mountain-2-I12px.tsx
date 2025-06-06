import type { iconProps } from './iconProps';

function imageMountain2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '12px image mountain 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 12 12" xmlns="http://www.w3.org/2000/svg">
      <g fill="currentColor">
        <path
          d="m2.75,3.75c.552,0,1-.448,1-1s-.448-1-1-1-1,.448-1,1,.448,1,1,1Z"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
        <path
          d="m7.774,4.402L1.919,9.037c-.505.4-.222,1.213.422,1.213h7.317c.46,0,.787-.447.649-.885l-1.463-4.634c-.143-.454-.697-.624-1.07-.328h0Z"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={strokewidth}
        />
      </g>
    </svg>
  );
}

export default imageMountain2;
