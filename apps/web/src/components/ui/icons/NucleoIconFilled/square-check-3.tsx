import type { iconProps } from './iconProps';

function squareCheck3(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px square check 3';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M13.25,2H4.75c-1.517,0-2.75,1.233-2.75,2.75V13.25c0,1.517,1.233,2.75,2.75,2.75H13.25c1.517,0,2.75-1.233,2.75-2.75V4.75c0-1.517-1.233-2.75-2.75-2.75Zm-.303,4.641c-1.859,1.382-3.435,3.29-4.683,5.669-.129,.247-.385,.402-.664,.402h-.003c-.28,0-.536-.158-.664-.407-.575-1.117-1.218-2.025-1.965-2.776-.292-.293-.291-.769,.003-1.061,.293-.292,.769-.292,1.061,.003,.573,.576,1.09,1.228,1.563,1.972,1.239-2.045,2.734-3.726,4.458-5.007,.332-.246,.802-.178,1.049,.155,.247,.332,.178,.802-.155,1.049Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default squareCheck3;
