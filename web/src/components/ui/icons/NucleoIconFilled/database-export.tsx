import type { iconProps } from './iconProps';

function databaseExport(props: iconProps) {
  const strokewidth = props.strokewidth || 1.3;
  const title = props.title || '18px database export';

  return (
    <svg height="1em" width="1em" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <title>{title}</title>
      <g fill="currentColor">
        <path
          d="M10.523,15.18c-.497,.046-1.01,.07-1.523,.07-3.572,0-5.5-1.064-5.5-1.5v-2.806c1.369,.715,3.478,1.056,5.5,1.056,3.371,0,7-.939,7-3V4.25c0-2.061-3.629-3-7-3s-7,.939-7,3V13.75c0,2.061,3.629,3,7,3,.561,0,1.12-.026,1.664-.077,.412-.039,.715-.404,.677-.817-.04-.413-.394-.721-.817-.676Zm-1.523-4.68c-3.572,0-5.5-1.064-5.5-1.5v-2.806c1.369,.715,3.478,1.056,5.5,1.056s4.131-.341,5.5-1.056v2.806c0,.436-1.928,1.5-5.5,1.5Z"
          fill="currentColor"
        />
        <path
          d="M17.25,12h-3.5c-.414,0-.75,.336-.75,.75s.336,.75,.75,.75h1.689l-3.22,3.22c-.293,.293-.293,.768,0,1.061,.146,.146,.338,.22,.53,.22s.384-.073,.53-.22l3.22-3.22v1.689c0,.414,.336,.75,.75,.75s.75-.336,.75-.75v-3.5c0-.414-.336-.75-.75-.75Z"
          fill="currentColor"
        />
      </g>
    </svg>
  );
}

export default databaseExport;
