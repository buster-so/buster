import type { iconProps } from './iconProps';

function nut(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px nut';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M16.317,7.62l-2.465-4.25c-.49-.845-1.402-1.37-2.378-1.37H6.527c-.977,0-1.888,.525-2.379,1.37L1.683,7.62c-.493,.851-.493,1.909,0,2.76l2.465,4.25c.49,.845,1.402,1.37,2.378,1.37h4.946c.977,0,1.888-.525,2.379-1.37l2.465-4.25c.493-.851,.493-1.909,0-2.76Zm-7.317,3.63c-1.243,0-2.25-1.007-2.25-2.25s1.007-2.25,2.25-2.25,2.25,1.007,2.25,2.25-1.007,2.25-2.25,2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default nut;
