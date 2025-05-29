import type { iconProps } from './iconProps';

function circleCopyPlus(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px circle copy plus';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M3,11.491c-.216,0-.431-.093-.579-.273-.916-1.114-1.421-2.523-1.421-3.968C1,3.804,3.804,1,7.25,1c1.445,0,2.854,.504,3.968,1.421,.32,.263,.366,.736,.103,1.056-.264,.32-.736,.365-1.056,.103-.846-.696-1.916-1.079-3.015-1.079-2.619,0-4.75,2.131-4.75,4.75,0,1.098,.383,2.169,1.079,3.015,.264,.32,.217,.792-.103,1.056-.14,.115-.309,.171-.477,.171Z"
          fill="currentColor"
        />
        <path
          d="M10.75,4.5c-3.446,0-6.25,2.804-6.25,6.25s2.804,6.25,6.25,6.25,6.25-2.804,6.25-6.25-2.804-6.25-6.25-6.25Zm2.5,7h-1.75v1.75c0,.414-.336,.75-.75,.75s-.75-.336-.75-.75v-1.75h-1.75c-.414,0-.75-.336-.75-.75s.336-.75,.75-.75h1.75v-1.75c0-.414,.336-.75,.75-.75s.75,.336,.75,.75v1.75h1.75c.414,0,.75,.336,.75,.75s-.336,.75-.75,.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default circleCopyPlus;
