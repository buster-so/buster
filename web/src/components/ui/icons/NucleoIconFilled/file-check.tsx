import type { iconProps } from './iconProps';

function fileCheck(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px file check';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.853,18c-.189,0-.372-.071-.512-.201l-1.609-1.5c-.303-.283-.319-.757-.037-1.06,.283-.304,.758-.319,1.061-.038l1,.933,2.896-3.836c.249-.33,.718-.396,1.051-.146,.33,.25,.396,.72,.146,1.051l-3.397,4.5c-.128,.169-.322,.276-.533,.295-.022,.002-.044,.003-.065,.003Z"
          fill="currentColor"
        />
        <path
          d="M10.597,14.216c.424-.455,1.024-.716,1.646-.716,.473,0,.927,.146,1.306,.417l1.905-2.523c.151-.2,.341-.359,.546-.496V6.664c0-.467-.182-.907-.513-1.237l-3.914-3.914c-.331-.331-.77-.513-1.237-.513H4.75c-1.517,0-2.75,1.233-2.75,2.75V14.25c0,1.517,1.233,2.75,2.75,2.75h5.629c-.568-.849-.506-2.007,.218-2.784Zm-.097-11.637c.009-.004,.004-.001,.013-.005l3.922,3.921s-.001,.003-.002,.005h-2.932c-.55,0-1-.45-1-1V2.579Zm-4.75,3.421h2c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75h-2c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75Zm-.75,3.75c0-.414,.336-.75,.75-.75h4.5c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75H5.75c-.414,0-.75-.336-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default fileCheck;
