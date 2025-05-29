import type { iconProps } from './iconProps';

function penWriting4(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px pen writing 4';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M14.75,12.5H3.25c-.413,0-.75-.336-.75-.75s.337-.75,.75-.75h1c.414,0,.75-.336,.75-.75s-.336-.75-.75-.75h-1c-1.24,0-2.25,1.009-2.25,2.25s1.01,2.25,2.25,2.25H14.75c.413,0,.75,.336,.75,.75s-.337,.75-.75,.75h-2c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h2c1.24,0,2.25-1.009,2.25-2.25s-1.01-2.25-2.25-2.25Z"
          fill="currentColor"
        />
        <path
          d="M6.836,10.914h.013c.39-.006,2.381-.083,3.268-.97l5.25-5.25c.843-.844,.843-2.217,0-3.061-.819-.817-2.245-.816-3.061,0L7.056,6.884c-.887,.886-.963,2.878-.97,3.268-.003,.203,.076,.399,.22,.542,.141,.141,.332,.22,.53,.22Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default penWriting4;
