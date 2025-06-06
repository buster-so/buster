import type { iconProps } from './iconProps';

function folder4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px folder 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M2.75,6c.414,0,.75-.336,.75-.75V3.25c0-.138,.112-.25,.25-.25h2.695c.087,0,.167,.044,.213,.118l.956,1.53c.137,.219,.377,.353,.636,.353h6c.138,0,.25,.112,.25,.25,0,.414,.336,.75,.75,.75s.75-.336,.75-.75c0-.965-.785-1.75-1.75-1.75h-5.584l-.736-1.177c-.321-.516-.876-.823-1.484-.823H3.75c-.965,0-1.75,.785-1.75,1.75v2c0,.414,.336,.75,.75,.75Z"
          fill="currentColor"
        />
        <path
          d="M16.411,7.612c-.333-.389-.817-.612-1.329-.612H2.918c-.512,0-.996,.223-1.329,.612-.333,.389-.479,.902-.399,1.408l.938,6c.135,.857,.861,1.48,1.729,1.48H14.145c.867,0,1.594-.623,1.729-1.48l.938-6c.079-.506-.066-1.019-.399-1.408Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default folder4;
