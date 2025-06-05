import type { iconProps } from './iconProps';

function easeIn(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px ease in';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.25,13c-.696,0-1.293,.411-1.575,1h-3.925c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h3.925c.282,.589,.879,1,1.575,1,.965,0,1.75-.785,1.75-1.75s-.785-1.75-1.75-1.75Z"
          fill="currentColor"
        />
        <path
          d="M2.749,15.5c-.391,0-.721-.303-.748-.7-.028-.413,.285-.771,.698-.799,5.061-.341,9.164-6.188,10.835-11.478,.125-.395,.546-.612,.941-.489,.395,.125,.614,.546,.489,.941-1.82,5.759-6.403,12.134-12.165,12.522-.017,0-.034,.001-.051,.001Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default easeIn;
