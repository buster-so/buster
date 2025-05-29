import type { iconProps } from './iconProps';

function artificialIntelligence(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px artificial intelligence';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M6.439,3.959c-.117-.278-.39-.459-.691-.459h-.178c-.302,0-.575,.181-.691,.459L1.309,12.459c-.161,.382,.019,.822,.401,.982,.382,.161,.821-.02,.982-.401l.647-1.541H7.98l.647,1.541c.121,.287,.399,.459,.692,.459,.097,0,.195-.019,.29-.059,.382-.16,.562-.6,.401-.982L6.439,3.959Zm-2.471,6.041l1.691-4.025,1.691,4.025H3.969Z"
          fill="currentColor"
        />
        <path
          d="M16,12h-1.5V7.25c0-.414-.336-.75-.75-.75h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.25v4h-1.25c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h4.25c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75Z"
          fill="currentColor"
        />
        <path
          d="M11.794,3.146l1.145,.382,.382,1.145c.062,.185,.235,.31,.43,.31s.368-.125,.43-.31l.382-1.145,1.145-.382c.185-.062,.31-.235,.31-.43s-.125-.368-.31-.43l-1.145-.382-.382-1.145c-.124-.37-.737-.37-.86,0l-.382,1.145-1.145,.382c-.185,.062-.31,.235-.31,.43s.125,.368,.31,.43Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default artificialIntelligence;
