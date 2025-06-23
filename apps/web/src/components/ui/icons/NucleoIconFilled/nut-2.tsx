import type { iconProps } from './iconProps';

function nut2(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px nut 2';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.63,4.148L10.38,1.683c-.852-.493-1.908-.493-2.76,0L3.37,4.148c-.845,.49-1.37,1.402-1.37,2.378v4.946c0,.977,.525,1.888,1.37,2.379l4.25,2.465c.426,.247,.903,.37,1.38,.37s.954-.124,1.38-.37l4.25-2.465c.845-.49,1.37-1.402,1.37-2.378V6.527c0-.977-.525-1.888-1.37-2.379Zm-5.63,7.102c-1.243,0-2.25-1.007-2.25-2.25s1.007-2.25,2.25-2.25,2.25,1.007,2.25,2.25-1.007,2.25-2.25,2.25Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default nut2;
