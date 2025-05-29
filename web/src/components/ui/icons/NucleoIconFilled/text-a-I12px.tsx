import type { iconProps } from './iconProps';

function textA(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px text a';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path d="M5.107 11H12.892V12.5H5.107z" fill="currentColor" />
        <path
          d="M14.25,16c-.3,0-.584-.182-.699-.479L9,3.789,4.449,15.521c-.15,.387-.586,.577-.97,.428-.386-.15-.578-.584-.428-.97L7.899,2.479c.112-.289,.39-.479,.699-.479h.803c.31,0,.587,.19,.699,.479l4.849,12.5c.15,.386-.042,.82-.428,.97-.089,.035-.181,.051-.271,.051Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default textA;
