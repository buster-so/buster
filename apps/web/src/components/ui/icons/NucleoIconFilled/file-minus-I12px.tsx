import type { iconProps } from './iconProps';

function fileMinus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file minus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M12.25,15.5c-1.24,0-2.25-1.009-2.25-2.25s1.01-2.25,2.25-2.25h3.75V6.664c0-.467-.182-.907-.513-1.237l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.064,0,1.978-.614,2.435-1.5h-3.435Zm-1.75-12.921c.009-.004,.004-.001,.013-.005l3.922,3.921s-.001,.003-.002,.005h-2.932c-.55,0-1-.45-1-1V2.579Zm-4.75,3.421h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Zm-.75,3.75c0-.414,.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H5.75c-.414,0-.75-.336-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M17.25,14h-5c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default fileMinus;
